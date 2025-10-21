#!/usr/bin/env bash
# codex-backend-toggle.sh
# Adds a toggleable data backend (memory | pg) for the books/author normalization stack.
# - Creates repo interface + memory/pg impls
# - Adds loader that selects backend via DATA_BACKEND env
# - Patches routes/books.js to use the repo abstraction
# - Adds minimal Postgres schema, .env.example, and npm scripts
# - Provides Jest global setup that boots the real app with the chosen backend
set -euo pipefail

GREEN='\033[1;32m'; YELLOW='\033[1;33m'; RED='\033[1;31m'; RESET='\033[0m'
say(){ printf "${GREEN}==>${RESET} %s\n" "$*"; }
warn(){ printf "${YELLOW}!!${RESET} %s\n" "$*"; }
die(){ printf "${RED}xx${RESET} %s\n" "$*"; exit 1; }

ROOT="$(pwd)"
SRV="${ROOT}/server"
[ -d "$SRV" ] || die "Expected a 'server/' directory at repo root."

ts="$(date +%Y%m%d-%H%M%S)"
bk(){ [ -f "$1" ] && cp "$1" "$1.bak-${ts}" && warn "Backed up $1 -> $1.bak-${ts}" || true; }

mkdir -p "$SRV/src/data" "$SRV/src/utils" "$SRV/src/formatters" "$SRV/sql" "$SRV/tests"

# 0) Ensure normalizeAuthors + formatBook exist (don’t overwrite if present)
if [ ! -f "$SRV/src/utils/normalizeAuthors.js" ]; then
  say "Creating server/src/utils/normalizeAuthors.js"
  cat > "$SRV/src/utils/normalizeAuthors.js" <<'JS'
function normalizeAuthors(input) {
  if (input == null) return [];
  const arr = Array.isArray(input) ? input : [input];
  const out = []; const seen = new Set();
  for (const item of arr) {
    let name = null;
    if (typeof item === 'string') name = item.trim();
    else if (item && typeof item === 'object' && 'name' in item) name = String(item.name ?? '').trim();
    else if (item && typeof item === 'object' && 'fullName' in item) name = String(item.fullName ?? '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name });
  }
  return out;
}
module.exports = { normalizeAuthors };
JS
fi

if [ ! -f "$SRV/src/formatters/formatBook.js" ]; then
  say "Creating server/src/formatters/formatBook.js"
  cat > "$SRV/src/formatters/formatBook.js" <<'JS'
const { normalizeAuthors } = require('../utils/normalizeAuthors');
function formatBook(row) {
  const { id, title, isbn, published_at, authors, authors_json, authors_text, author_name, ...rest } = row;
  const source = authors ?? authors_json ?? authors_text ?? (author_name ? [author_name] : []);
  return {
    id, title, isbn,
    publishedAt: published_at ?? row.publishedAt ?? null,
    authors: normalizeAuthors(source),
    ...rest
  };
}
module.exports = { formatBook };
JS
fi

# 1) Repository interface + loader
say "Writing server/src/data/index.js (backend loader)"
cat > "$SRV/src/data/index.js" <<'JS'
/**
 * Data layer switcher. Set DATA_BACKEND=memory|pg (default: memory)
 */
const backend = (process.env.DATA_BACKEND || 'memory').toLowerCase();

let repo;
if (backend === 'pg') {
  repo = require('./repos.pg');
} else {
  repo = require('./repos.memory');
}

module.exports = repo;
JS

# 2) Memory repository
say "Writing server/src/data/repos.memory.js"
cat > "$SRV/src/data/repos.memory.js" <<'JS'
const { normalizeAuthors } = require('../utils/normalizeAuthors');

// In-memory store
let seq = 1;
const books = []; // {id, title, isbn, published_at, authors:[{name}]}

async function createBook({ title, isbn = null, publishedAt = null, authors = [] }) {
  const b = { id: seq++, title: title ?? null, isbn, published_at: publishedAt ?? null, authors };
  books.push(b);
  return { ...b };
}

async function updateBook(id, { title, isbn, publishedAt, authors }) {
  const idx = books.findIndex(b => b.id === Number(id));
  if (idx < 0) return null;
  const b = books[idx];
  if (title !== undefined) b.title = title;
  if (isbn !== undefined) b.isbn = isbn;
  if (publishedAt !== undefined) b.published_at = publishedAt;
  if (authors !== undefined) b.authors = authors;
  return { ...b };
}

async function getBook(id) {
  const b = books.find(b => b.id === Number(id));
  return b ? { ...b } : null;
}

async function listBooks() {
  // Return raw rows; formatter will normalize authors
  return books.map(b => ({ ...b }));
}

async function attachAuthorsToBook(_id, _authors) {
  // Memory: authors are stored on the book record; normalization happens on read.
  return;
}

module.exports = {
  createBook,
  updateBook,
  getBook,
  listBooks,
  attachAuthorsToBook,
  _memory: { books } // for debug
};
JS

# 3) PG repository (safe SQL, attaches authors)
say "Writing server/src/data/repos.pg.js"
cat > "$SRV/src/data/repos.pg.js" <<'JS'
const { pool } = require('../db/pool'); // make sure this path matches your repo
const { normalizeAuthors } = require('../utils/normalizeAuthors');

async function createBook({ title, isbn = null, publishedAt = null, authors = [] }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ins = await client.query(
      `INSERT INTO books (title, isbn, published_at)
       VALUES ($1, $2, $3)
       RETURNING id, title, isbn, published_at`,
      [title ?? null, isbn, publishedAt]
    );
    const book = ins.rows[0];
    await attachAuthorsToBookWithClient(client, book.id, normalizeAuthors(authors));
    await client.query('COMMIT');
    return book;
  } catch (e) {
    await client.query('ROLLBACK'); throw e;
  } finally {
    client.release();
  }
}

async function updateBook(id, { title, isbn, publishedAt, authors }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const upd = await client.query(
      `UPDATE books
       SET title = COALESCE($2, title),
           isbn = COALESCE($3, isbn),
           published_at = COALESCE($4, published_at)
       WHERE id = $1
       RETURNING id, title, isbn, published_at`,
      [id, title ?? null, isbn ?? null, publishedAt ?? null]
    );
    const book = upd.rows[0];
    if (!book) { await client.query('ROLLBACK'); return null; }
    if (authors !== undefined) {
      await attachAuthorsToBookWithClient(client, book.id, normalizeAuthors(authors));
    }
    await client.query('COMMIT');
    return book;
  } catch (e) {
    await client.query('ROLLBACK'); throw e;
  } finally {
    client.release();
  }
}

async function getBook(id) {
  const { rows } = await pool.query(
    `SELECT
       b.id, b.title, b.isbn, b.published_at,
       COALESCE(json_agg(DISTINCT jsonb_build_object('name', a.name))
         FILTER (WHERE a.id IS NOT NULL), '[]') AS authors_json
     FROM books b
     LEFT JOIN book_authors ba ON ba.book_id = b.id
     LEFT JOIN authors a ON a.id = ba.author_id
     WHERE b.id = $1
     GROUP BY b.id`,
    [id]
  );
  return rows[0] ?? null;
}

async function listBooks() {
  const { rows } = await pool.query(
    `SELECT
       b.id, b.title, b.isbn, b.published_at,
       COALESCE(json_agg(DISTINCT jsonb_build_object('name', a.name))
         FILTER (WHERE a.id IS NOT NULL), '[]') AS authors_json
     FROM books b
     LEFT JOIN book_authors ba ON ba.book_id = b.id
     LEFT JOIN authors a ON a.id = ba.author_id
     GROUP BY b.id
     ORDER BY b.id DESC`
  );
  return rows;
}

async function attachAuthorsToBook(bookId, authors) {
  const client = await pool.connect();
  try {
    await attachAuthorsToBookWithClient(client, bookId, normalizeAuthors(authors));
  } finally {
    client.release();
  }
}

async function attachAuthorsToBookWithClient(client, bookId, authors) {
  if (!Array.isArray(authors) || authors.length === 0) {
    await client.query('DELETE FROM book_authors WHERE book_id = $1', [bookId]);
    return;
  }
  // upsert authors
  const authorIds = [];
  for (const { name } of authors) {
    const up = await client.query(
      `INSERT INTO authors (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name]
    );
    authorIds.push(up.rows[0].id);
  }
  // reset links
  await client.query('DELETE FROM book_authors WHERE book_id = $1', [bookId]);
  const values = authorIds.map((_, i) => `($1,$${i+2})`).join(', ');
  await client.query(`INSERT INTO book_authors (book_id, author_id) VALUES ${values}`, [bookId, ...authorIds]);
}

module.exports = {
  createBook,
  updateBook,
  getBook,
  listBooks,
  attachAuthorsToBook
};
JS

# 4) Patch routes/books.js to use repo abstraction
BOOKS_ROUTE="$SRV/src/routes/books.js"
ALT_BOOKS_ROUTE="$SRV/routes/books.js"
TARGET=""
if [ -f "$BOOKS_ROUTE" ]; then TARGET="$BOOKS_ROUTE"; elif [ -f "$ALT_BOOKS_ROUTE" ]; then TARGET="$ALT_BOOKS_ROUTE"; fi
if [ -n "$TARGET" ]; then
  bk "$TARGET"
  say "Patching $TARGET to use data repo"
  cat > "$TARGET" <<'JS'
const router = require('express').Router();
const repo = require('../data'); // resolves to memory or pg via DATA_BACKEND
const { normalizeAuthors } = require('../utils/normalizeAuthors');
const { formatBook } = require('../formatters/formatBook');

// GET /api/books
router.get('/', async (_req, res, next) => {
  try {
    const rows = await repo.listBooks();
    res.json(rows.map(formatBook));
  } catch (err) { next(err); }
});

// POST /api/books
router.post('/', async (req, res, next) => {
  try {
    const { title, isbn, publishedAt } = req.body;
    const authors = normalizeAuthors(req.body.authors);
    if (!title) return res.status(400).json({ error: 'title required' });
    const book = await repo.createBook({ title, isbn, publishedAt, authors });
    res.status(201).json(formatBook({ ...book, authors }));
  } catch (err) { next(err); }
});

// PUT /api/books/:id
router.put('/:id', async (req, res, next) => {
  try {
    const bookId = Number(req.params.id);
    const { title, isbn, publishedAt } = req.body;
    const authors = Object.prototype.hasOwnProperty.call(req.body, 'authors')
      ? normalizeAuthors(req.body.authors)
      : undefined;
    const book = await repo.updateBook(bookId, { title, isbn, publishedAt, authors });
    if (!book) return res.status(404).json({ error: 'not found' });
    if (authors !== undefined) return res.json(formatBook({ ...book, authors }));
    const hydrated = await repo.getBook(bookId);
    res.json(formatBook(hydrated ?? book));
  } catch (err) { next(err); }
});

module.exports = router;
JS
else
  warn "Could not find routes/books.js to patch (looked in src/routes and routes). Skip."
fi

# 5) Ensure app.js mounts /api/books
APP_JS="$SRV/src/app.js"
ALT_APP_JS="$SRV/app.js"
APP_TARGET=""
if [ -f "$APP_JS" ]; then APP_TARGET="$APP_JS"; elif [ -f "$ALT_APP_JS" ]; then APP_TARGET="$ALT_APP_JS"; fi
if [ -n "$APP_TARGET" ]; then
  if ! grep -q "app.use('/api/books'" "$APP_TARGET"; then
    bk "$APP_TARGET"
    awk '
      /express\(\)/ && !injected { print; print "const booksRouter = require(\x27./routes/books\x27);"; injected=1; next }
      { print }
      END {
        print "app.use(\x27/.well-known/health\x27, (_req,res)=>res.json({ok:true}));"
        print "app.use(\x27/api/books\x27, booksRouter);"
      }
    ' "$APP_TARGET" > "$APP_TARGET.new" || true
    mv "$APP_TARGET.new" "$APP_TARGET"
  fi
else
  warn "No app.js found (looked in server/src/app.js and server/app.js)."
fi

# 6) Jest: boot the real app (memory backend by default)
JCONF="$SRV/jest.config.js"
bk "$JCONF"
cat > "$JCONF" <<'JS'
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  globalSetup: '<rootDir>/tests/globalSetup.app.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.app.js',
};
JS

say "Writing tests/globalSetup.app.js"
cat > "$SRV/tests/globalSetup.app.js" <<'JS'
const { spawn } = require('child_process');
const fs = require('fs'); const net = require('net'); const path = require('path');
const PID_FILE = path.join(__dirname, '.app-server.pid');
const PORT = Number(process.env.PORT || 3001);

function waitForPort(port, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function once() {
      const s = net.createConnection(port, '127.0.0.1');
      s.once('connect', () => { s.end(); resolve(true); });
      s.once('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error(`Timed out waiting for :${port}`));
        else setTimeout(once, 200);
      });
    })();
  });
}

module.exports = async () => {
  const root = path.join(__dirname, '..');
  const candidates = ['index.js', 'server.js', 'src/index.js'];
  let entry = null;
  for (const c of candidates) {
    const p = path.join(root, c);
    if (fs.existsSync(p)) { entry = p; break; }
  }
  if (!entry) {
    // Fallback: start express app from app.js
    entry = path.join(root, 'tests', 'tmp-start-app.js');
    if (!fs.existsSync(entry)) {
      fs.writeFileSync(entry, `
        const path = require('path');
        let app;
        try { app = require(path.join(__dirname,'..','src','app')); }
        catch { app = require(path.join(__dirname,'..','app')); }
        const PORT = Number(process.env.PORT || 3001);
        app.listen(PORT, ()=>console.log('app listening on:'+PORT));
      `);
    }
  }

  const child = spawn(process.execPath, [entry], {
    cwd: root,
    stdio: ['ignore','pipe','pipe'],
    env: { ...process.env, NODE_ENV: 'test', DATA_BACKEND: process.env.DATA_BACKEND || 'memory', PORT: String(PORT) },
    detached: process.platform !== 'win32'
  });

  fs.writeFileSync(PID_FILE, String(child.pid));
  child.stdout.on('data', d => process.stdout.write(`[app] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[app] ${d}`));
  await waitForPort(PORT, 20000);
};
JS

say "Writing tests/globalTeardown.app.js"
cat > "$SRV/tests/globalTeardown.app.js" <<'JS'
const fs = require('fs'); const path = require('path');
const PID_FILE = path.join(__dirname, '.app-server.pid');
module.exports = async () => {
  try {
    if (fs.existsSync(PID_FILE)) {
      const pid = Number(fs.readFileSync(PID_FILE, 'utf8'));
      if (pid) { try { process.kill(pid, 'SIGTERM'); } catch {} }
      fs.unlinkSync(PID_FILE);
    }
  } catch {}
};
JS

# 7) API normalization tests (real app)
say "Writing tests/books.normalization.test.js (real app)"
cat > "$SRV/tests/books.normalization.test.js" <<'JS'
/* eslint-disable no-undef */
const fetch = global.fetch || require('node-fetch');
const BASE = process.env.API_BASE || 'http://127.0.0.1:3001';

async function json(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

describe('author normalization (API, DATA_BACKEND=' + (process.env.DATA_BACKEND || 'memory') + ')', () => {
  test('POST: accepts string and returns [{name}]', async () => {
    const res = await fetch(`${BASE}/api/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Beloved', authors: 'Toni Morrison' }),
    });
    const body = await json(res);
    expect(body.title).toBe('Beloved');
    expect(body.authors).toEqual([{ name: 'Toni Morrison' }]);
  });

  test('PUT: accepts mixed array, dedups case-insensitively, returns normalized', async () => {
    const created = await json(await fetch(`${BASE}/api/books`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Song of Solomon', authors: 'Toni Morrison' })
    }));
    const updated = await json(await fetch(`${BASE}/api/books/${created.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authors: ['toni morrison', { name: 'Robert Smith' }, '  Robert Smith  '] })
    }));
    expect(updated.authors).toEqual([{ name: 'Toni Morrison' }, { name: 'Robert Smith' }]);
  });

  test('GET: always returns authors as array of {name}', async () => {
    const list = await json(await fetch(`${BASE}/api/books`));
    expect(Array.isArray(list)).toBe(true);
    for (const b of list) {
      expect(Array.isArray(b.authors)).toBe(true);
      for (const a of b.authors) {
        expect(a && typeof a.name === 'string').toBe(true);
        expect(a.name.length).toBeGreaterThan(0);
      }
    }
  });
});
JS

# 8) SQL schema for Postgres
say "Writing server/sql/schema.sql (minimal)"
cat > "$SRV/sql/schema.sql" <<'SQL'
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  isbn TEXT,
  published_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS book_authors (
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, author_id)
);
SQL

# 9) .env.example
ENV_EX="$SRV/.env.example"
[ -f "$ENV_EX" ] && cp "$ENV_EX" "$ENV_EX.bak-${ts}" || true
say "Writing server/.env.example"
cat > "$ENV_EX" <<'ENV'
# DATA BACKEND: memory (fast default) or pg (requires DATABASE_URL)
DATA_BACKEND=memory

# When DATA_BACKEND=pg, set DATABASE_URL (e.g., postgres://user:pass@localhost:5432/mangu_dev)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mangu_dev

# Server port
PORT=3001
ENV

# 10) package.json scripts
PKG="$SRV/package.json"
[ -f "$PKG" ] || die "Missing $PKG"
bk "$PKG"

node - <<'NODE'
const fs = require('fs'); const path = require('path');
const pkgPath = path.join(process.cwd(), 'server', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.scripts = pkg.scripts || {};
pkg.scripts["dev:memory"] = "cross-env DATA_BACKEND=memory node index.js || cross-env DATA_BACKEND=memory node src/index.js || cross-env DATA_BACKEND=memory node server.js";
pkg.scripts["dev:pg"] = "cross-env DATA_BACKEND=pg node index.js || cross-env DATA_BACKEND=pg node src/index.js || cross-env DATA_BACKEND=pg node server.js";
pkg.scripts["test"] = pkg.scripts["test"] || "jest";
pkg.scripts["test:memory"] = "cross-env DATA_BACKEND=memory jest --runInBand";
pkg.scripts["test:pg"] = "cross-env DATA_BACKEND=pg jest --runInBand";

pkg.devDependencies = pkg.devDependencies || {};
if (!pkg.devDependencies.jest) pkg.devDependencies.jest = "^29.7.0";
if (!pkg.devDependencies["node-fetch"]) pkg.devDependencies["node-fetch"] = "^3.3.2";
if (!pkg.devDependencies["cross-env"]) pkg.devDependencies["cross-env"] = "^7.0.3";

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log("Updated scripts/devDependencies in server/package.json");
NODE

# 11) Install & test (memory backend)
say "Installing dev deps & running tests (memory backend)…"
( cd "$SRV" && npm ci && npm run test:memory )

say "Done."
