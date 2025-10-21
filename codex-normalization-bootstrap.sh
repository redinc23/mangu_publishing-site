#!/usr/bin/env bash
# codex-normalization-bootstrap.sh
# Automates the "drop-in" for Author Normalization testing:
# - Ensures server/scripts/start-stub-server.js exists (creates a minimal one if missing)
# - Adds Jest config + global setup/teardown to start/stop stub server during tests
# - Adds API & unit tests for normalization
# - Updates server/package.json scripts & devDependencies
# - Runs npm install & tests
set -euo pipefail

Cyan='\033[0;36m'; Green='\033[0;32m'; Yellow='\033[1;33m'; Red='\033[1;31m'; Bold='\033[1m'; Reset='\033[0m'
say(){ printf "${Green}==>${Reset} %s\n" "$*"; }
warn(){ printf "${Yellow}!!${Reset} %s\n" "$*"; }
die(){ printf "${Red}xx${Reset} %s\n" "$*"; exit 1; }

ROOT="$(pwd)"
SRV="${ROOT}/server"
[ -d "$SRV" ] || die "Expected a 'server/' directory at repo root."

ts="$(date +%Y%m%d-%H%M%S)"
bk(){ [ -f "$1" ] && cp "$1" "$1.bak-${ts}" && warn "Backed up $1 -> $1.bak-${ts}" || true; }

mkdir -p "$SRV/scripts" "$SRV/tests" "$SRV/src/utils" "$SRV/src/formatters" "$SRV/db"

# 0) Stub server (only if missing)
if [ ! -f "$SRV/scripts/start-stub-server.js" ]; then
  say "Creating minimal in-memory stub: server/scripts/start-stub-server.js"
  cat > "$SRV/scripts/start-stub-server.js" <<'JS'
/* Minimal in-memory stub server for books API */
const http = require('http');

let seq = 1;
const books = []; // {id, title, isbn, published_at, authors:[{name}]}

function normalizeAuthors(input) {
  if (input == null) return [];
  const arr = Array.isArray(input) ? input : [input];
  const out = [], seen = new Set();
  for (const it of arr) {
    let name = null;
    if (typeof it === 'string') name = it.trim();
    else if (it && typeof it === 'object' && 'name' in it) name = String(it.name ?? '').trim();
    if (!name) continue;
    const k = name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ name });
  }
  return out;
}

function formatBook(row){
  const { id, title, isbn, published_at, authors } = row;
  return { id, title, isbn, publishedAt: published_at ?? null, authors: normalizeAuthors(authors) };
}

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  const matchPut = url.match(/^\/api\/books\/(\d+)\b/);

  if (method === 'GET' && url === '/api/books') {
    const out = books.map(formatBook);
    res.writeHead(200, {'content-type':'application/json'}).end(JSON.stringify(out));
    return;
  }

  if (method === 'POST' && url === '/api/books') {
    let body = ''; req.on('data', c => body += c);
    req.on('end', () => {
      const json = body ? JSON.parse(body) : {};
      const book = {
        id: seq++,
        title: json.title ?? null,
        isbn: json.isbn ?? null,
        published_at: json.publishedAt ?? null,
        authors: json.authors
      };
      books.push(book);
      res.writeHead(201, {'content-type':'application/json'}).end(JSON.stringify(formatBook(book)));
    });
    return;
  }

  if (method === 'PUT' && matchPut) {
    const id = Number(matchPut[1]);
    let body = ''; req.on('data', c => body += c);
    req.on('end', () => {
      const json = body ? JSON.parse(body) : {};
      const idx = books.findIndex(b => b.id === id);
      if (idx < 0) { res.writeHead(404).end('not found'); return; }
      const b = books[idx];
      if (json.title !== undefined) b.title = json.title;
      if (json.isbn !== undefined) b.isbn = json.isbn;
      if (json.publishedAt !== undefined) b.published_at = json.publishedAt;
      if (json.authors !== undefined) b.authors = json.authors;
      res.writeHead(200, {'content-type':'application/json'}).end(JSON.stringify(formatBook(b)));
    });
    return;
  }

  if (url === '/api/health') {
    res.writeHead(200, {'content-type':'application/json'}).end(JSON.stringify({ok:true}));
    return;
  }

  res.statusCode = 404; res.end('not found');
});

const PORT = Number(process.env.PORT || 3001);
server.listen(PORT, () => console.log(`stub listening on :${PORT}`));
JS
else
  say "Found existing stub: server/scripts/start-stub-server.js (leaving as-is)"
fi

# 1) Normalizer + formatter (only create if missing)
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

# 2) Jest config + global setup/teardown + tests
JCONF="$SRV/jest.config.js"
[ -f "$JCONF" ] && cp "$JCONF" "$JCONF.bak-${ts}" || true
say "Writing $JCONF"
cat > "$JCONF" <<'JS'
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
};
JS

say "Writing server/tests/globalSetup.js"
cat > "$SRV/tests/globalSetup.js" <<'JS'
const { spawn } = require('child_process');
const fs = require('fs'); const net = require('net'); const path = require('path');
const PID_FILE = path.join(__dirname, '.stub-server.pid');
const PORT = Number(process.env.PORT || 3001);

function waitForPort(port, timeoutMs = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function tryOnce() {
      const s = net.createConnection(port, '127.0.0.1');
      s.once('connect', () => { s.end(); resolve(true); });
      s.once('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error(`Timed out waiting for :${port}`));
        else setTimeout(tryOnce, 200);
      });
    })();
  });
}

module.exports = async () => {
  const child = spawn(process.execPath, ['scripts/start-stub-server.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(PORT) },
    detached: process.platform !== 'win32',
  });
  require('fs').writeFileSync(PID_FILE, String(child.pid));
  child.stdout.on('data', d => process.stdout.write(`[stub] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[stub] ${d}`));
  await waitForPort(PORT, 15000);
};
JS

say "Writing server/tests/globalTeardown.js"
cat > "$SRV/tests/globalTeardown.js" <<'JS'
const fs = require('fs'); const path = require('path');
const PID_FILE = path.join(__dirname, '.stub-server.pid');
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

say "Writing server/tests/books.normalization.test.js"
cat > "$SRV/tests/books.normalization.test.js" <<'JS'
/* eslint-disable no-undef */
const fetch = global.fetch || require('node-fetch');
const BASE = process.env.API_BASE || 'http://127.0.0.1:3001';

async function json(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

describe('author normalization (API)', () => {
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

say "Writing (optional) unit test server/src/utils/normalizeAuthors.test.js"
cat > "$SRV/src/utils/normalizeAuthors.test.js" <<'JS'
const { normalizeAuthors } = require('./normalizeAuthors');
describe('normalizeAuthors', () => {
  test('null → []', () => { expect(normalizeAuthors(null)).toEqual([]); });
  test('string → [{name}]', () => { expect(normalizeAuthors('Toni Morrison')).toEqual([{ name: 'Toni Morrison' }]); });
  test('array of strings → objects', () => { expect(normalizeAuthors(['A','B'])).toEqual([{name:'A'},{name:'B'}]); });
  test('{name} passthrough + trim + dedup', () => {
    expect(normalizeAuthors(['  A  ', '', { name:'a' }, { name:'B' }])).toEqual([{name:'A'},{name:'B'}]);
  });
});
JS

# 3) Update server/package.json (scripts + devDeps)
PKG="$SRV/package.json"
[ -f "$PKG" ] || die "Missing $PKG"
bk "$PKG"

node - <<'NODE'
const fs = require('fs'); const path = require('path');
const pkgPath = path.join(process.cwd(), 'server', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.scripts = pkg.scripts || {};
pkg.scripts["dev:stub"] = pkg.scripts["dev:stub"] || "node ./scripts/start-stub-server.js";
pkg.scripts["test"] = pkg.scripts["test"] || "jest";
pkg.scripts["test:api-normalization"] = "jest -t normalization --runInBand";
pkg.scripts["test:unit-normalization"] = "jest -t normalizeAuthors --runInBand";

pkg.devDependencies = pkg.devDependencies || {};
if (!pkg.devDependencies.jest) pkg.devDependencies.jest = "^29.7.0";
if (!pkg.devDependencies["node-fetch"]) pkg.devDependencies["node-fetch"] = "^3.3.2";

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log("Updated server/package.json");
NODE

# 4) Install & run tests
say "Installing dev dependencies & running tests…"
( cd "$SRV" && npm ci && npm test )

say "All done."
printf "${Cyan}${Bold}Next:${Reset}\n"
cat <<'TXT'
1) Commit the changes:
   git add server && git commit -m "test(author-normalization): add stub-backed API tests, jest config, and unit tests"

2) Re-run focused suites if needed:
   cd server
   npm run test:api-normalization
   npm run test:unit-normalization

3) When ready, point routes at the real DB path again (stub is only for tests),
   or keep the stub for fast CI smoke and add a separate PG-backed integration job.
TXT
