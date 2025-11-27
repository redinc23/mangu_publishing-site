  <!-- docs/UNIFIED-DROP-IN.md -->

  # Unified Drop‑In Execution Guide (Docker + Normalization + Backend Toggle)

  > **⚠️ DEPRECATED**: This guide references Docker for local development, which has been removed from this project.  
  > **For current local development setup**, see `README.md` which uses Homebrew-installed PostgreSQL and Redis on Mac.  
  > This document is kept for historical reference only.
  >
  > This runbook gives you a one‑shot way to:  
  > **(0)** Stabilize Docker on Apple Silicon with health and Redis checks,  
  > **(1)** Bootstrap author‑normalization tests with a stub server, and  
  > **(2)** Enable a toggleable data backend (`memory` | `pg`) behind the same API.  
  > It's designed to be **additive**: keep existing working pieces; apply only what's missing.

  ---

  ## Phase 0 — Docker (Apple Silicon Safeguards)

  **Files to create or merge:**

  1. `docker-compose.yml`
  ```yaml
  # docker-compose.yml
# Compose v2+ (no top-level `version:`).
# Apple Silicon notes:
# - Services with reliable ARM64 support run natively (faster).
# - If a service lacks ARM64 images or native builds, set:
#     platform: linux/amd64
#   which enables QEMU/Rosetta emulation in Docker Desktop for Mac.

name: mangu2-publishing

x-health-defaults: &health_defaults
  interval: 5s
  timeout: 3s
  retries: 20
  start_period: 10s

services:
  # ---- App (dev server) ----
  web:
    # Safe default for Apple Silicon; remove for native arm64 once your stack is proven.
    platform: linux/amd64
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NODE_ENV=development
    env_file:
      - .env
    volumes:
      - ./:/app
    working_dir: /app
    command: sh -c "npm run dev || yarn dev || python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 3000"
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    environment:
      # Faster reloads on macOS bind mounts
      CHOKIDAR_USEPOLLING: "1"
      WATCHPACK_POLLING: "true"

  # ---- PostgreSQL (arm64 available; prefer native) ----
  db:
    image: postgres:16
    # If extensions/images misbehave on arm64, you can force emulation:
    # platform: linux/amd64
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mangu_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d mangu_dev"]
      <<: *health_defaults

  # ---- Redis (arm64 OK) ----
  cache:
    image: redis:7-alpine
    # If a plugin forces x86, uncomment:
    # platform: linux/amd64
    command: ["redis-server", "--save", "", "--appendonly", "no"]
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      <<: *health_defaults

volumes:
  pgdata:
  ```

  2. `start-dev.sh`
  ```bash
  #!/usr/bin/env bash
# start-dev.sh
# Start the dev stack reliably, auto-heal Docker daemon reachability,
# and prevent common Apple Silicon pitfalls. Includes Redis health gates.
set -euo pipefail

say()  { printf "\033[1;34m==>\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m!!\033[0m %s\n" "$*"; }
die()  { printf "\033[1;31mxx\033[0m %s\n" "$*" >&2; exit 1; }

require_cmd() { command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"; }
open_docker_desktop_mac() { [[ "$(uname -s)" == "Darwin" ]] && open -gja "Docker" || true; }

wait_for_docker() {
  local max="${1:-60}"
  for _ in $(seq 1 "$max"); do
    docker info >/dev/null 2>&1 && return 0
    sleep 1
  done
  return 1
}

wait_for_container_health() {
  local svc="$1" max="${2:-60}"
  local name
  name="$(docker compose ps -q "$svc" || true)"
  [[ -z "$name" ]] && return 1
  for _ in $(seq 1 "$max"); do
    local st
    st="$(docker inspect -f '{{ if .State.Health }}{{ .State.Health.Status }}{{ else }}unknown{{ end }}' "$name" 2>/dev/null || echo 'unknown')"
    [[ "$st" == "healthy" ]] && return 0
    sleep 1
  done
  return 1
}

wait_for_web_http() {
  local url="${1:-http://localhost:3000/health}" max="${2:-60}"
  for _ in $(seq 1 "$max"); do
    if curl -fsS "$url" >/dev/null 2>&1 || curl -fsSI "http://localhost:3000" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

say "Checking prerequisites…"
require_cmd docker
require_cmd curl

say "Checking Docker context:"
docker context ls || true

if ! docker info >/dev/null 2>&1; then
  warn "Docker daemon not reachable. Attempting auto-recovery…"
  case "$(uname -s)" in
    Darwin)
      say "Opening Docker Desktop and waiting up to 60s…"
      open_docker_desktop_mac
      wait_for_docker 60 || die "Docker daemon still unreachable. Please ensure Docker Desktop is running."
      ;;
    Linux)
      warn "Run: sudo systemctl start docker"
      warn "Ensure your user is in the 'docker' group (then re-login)."
      die "Docker daemon unreachable."
      ;;
    *) die "Unsupported OS for auto-recovery. Please start Docker manually.";;
  esac
fi

say "Docker OK: $(docker info --format '{{.ServerVersion}} / {{.OperatingSystem}} / {{.Architecture}}')"

if docker compose version >/dev/null 2>&1; then
  say "Compose v2: $(docker compose version)"
else
  warn "'docker compose' (v2) not found. Install/Update Docker Desktop."
fi

# Validate compose file
docker compose config -q || die "docker-compose.yml failed validation."

# Apple Silicon hint
if [[ "$(uname -m)" == "arm64" ]]; then
  say "Detected Apple Silicon (arm64). If x86 images are required, enable Rosetta/QEMU emulation in Docker Desktop."
fi

# Pre-flight: clean orphans & stray networks (safe)
say "Pre-flight cleanup (orphans & stray networks)…"
docker compose down --remove-orphans || true
docker network prune -f || true

say "Building images (no cache) for a clean slate…"
docker compose build --no-cache

say "Starting services…"
docker compose up -d

say "Waiting for dependent services (db, cache)…"
wait_for_container_health db 60   || warn "db not healthy within 60s (check logs)."
wait_for_container_health cache 60 || warn "cache not healthy within 60s (check logs)."

# Extra Redis health (beyond container healthcheck)
if id="$(docker compose ps -q cache)"; then
  say "Verifying Redis responsiveness (PING/INFO)…"
  if ! docker exec "$id" redis-cli ping >/dev/null 2>&1; then
    warn "Redis PING failed — check 'docker logs cache' and retry."
  else
    docker exec "$id" sh -lc 'redis-cli info server | egrep "redis_version|uptime_in_seconds" && redis-cli info memory | egrep "used_memory_human|maxmemory_human" && redis-cli dbsize' || true
  fi
fi

say "Waiting for web (HTTP)…"
wait_for_web_http "http://localhost:3000/health" 60 || warn "Web not responding yet; check logs."

say "Stack is up. Try:  curl -I http://localhost:3000/health"
say "Use 'docker compose logs -f' to follow logs."
  ```

  3. `test-setup.sh`
  ```bash
  #!/usr/bin/env bash
# test-setup.sh
# Validate Docker daemon, Compose v2, container health, ports, and provide diagnostics.
# Emphasis on Redis health (PING + INFO) due to prior flakiness.
set -euo pipefail

ok()   { printf "\033[1;32m✔\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m!\033[0m %s\n" "$*"; }
err()  { printf "\033[1;31m✗\033[0m %s\n" "$*" >&2; }

require_cmd() { command -v "$1" >/dev/null 2>&1 || { err "Missing required command: $1"; exit 1; }; }

require_cmd docker
require_cmd curl
command -v nc >/dev/null 2>&1 || warn "netcat (nc) not found; port checks will use curl only."

echo "== Diagnostics ==================================================="
echo "Time: $(date)"
echo "OS/Arch: $(uname -s) / $(uname -m)"
echo "Repo: $(pwd)"
echo "------------------------------------------------------------------"

echo "-> Docker daemon reachability"
if docker info >/dev/null 2>&1; then
  ok "Docker reachable: $(docker info --format '{{.ServerVersion}} / {{.OperatingSystem}} / {{.Architecture}}')"
else
  err "Docker daemon is not running or not reachable."
  case "$(uname -s)" in
    Darwin) echo "  Start Docker Desktop (Applications → Docker), then re-run." ;;
    Linux)  echo "  Run: sudo systemctl start docker ; add your user to 'docker' group and re-login." ;;
  esac
  exit 1
fi

echo "-> Compose CLI"
if docker compose version >/dev/null 2>&1; then
  ok "Compose v2 present: $(docker compose version)"
else
  warn "Compose v2 missing. Install/Update Docker Desktop to get 'docker compose'."
fi

echo "-> Container status"
docker compose ps || true

echo "-> Health status snapshot (db/cache via container health)"
for svc in db cache; do
  id="$(docker compose ps -q "$svc" || true)"
  if [[ -n "$id" ]]; then
    hs="$(docker inspect -f '{{ if .State.Health }}{{ .State.Health.Status }}{{ else }}unknown{{ end }}' "$id" 2>/dev/null || echo 'unknown')"
    echo "  ${svc}: ${hs}"
    if [[ "$hs" != "healthy" && "$hs" != "starting" ]]; then
      warn "  ${svc} not healthy—tailing last 100 lines:"
      docker logs --tail=100 "$id" || true
    fi
  else
    warn "  ${svc}: not running"
  fi
done

echo "-> Redis deep-check (PING/INFO/DBSIZE)"
if id="$(docker compose ps -q cache)"; then
  if docker exec "$id" redis-cli ping >/dev/null 2>&1; then
    ok "redis-cli PING ok"
    docker exec "$id" sh -lc 'redis-cli info server | egrep "redis_version|uptime_in_seconds"; redis-cli info memory | egrep "used_memory_human|maxmemory_human"; redis-cli dbsize' || true
  else
    warn "redis-cli PING failed; investigate 'docker logs cache' and ensure port 6379 is free."
  fi
else
  warn "Redis container not found ('cache')."
fi

echo "-> Web responsiveness (host HTTP)"
if curl -fsS "http://localhost:3000/health" >/dev/null 2>&1 || curl -fsSI "http://localhost:3000" >/dev/null 2>&1; then
  ok "web: responds on http://localhost:3000"
else
  warn "web: no response on port 3000; tailing last 100 lines (if running):"
  id="$(docker compose ps -q web || true)"
  [[ -n "$id" ]] && docker logs --tail=100 "$id" || echo "  web container not running."
fi

echo "-> Port checks"
check_port() {
  local port="$1"
  if (curl -fsSI "http://localhost:$port" >/dev/null 2>&1) || (command -v nc >/dev/null 2>&1 && nc -z localhost "$port" >/dev/null 2>&1); then
    ok "Port $port reachable on localhost"
  else
    warn "Port $port not reachable; service may still be starting or mapped differently."
  fi
}
check_port 3000
check_port 5432
check_port 6379

echo "-> Apple Silicon notes (if arm64)"
if [[ "$(uname -m)" == "arm64" ]]; then
  echo "  Using Apple Silicon. If you see x86-only images failing to run:"
  echo "    - Keep 'platform: linux/amd64' on affected service(s)"
  echo "    - Ensure Docker Desktop emulation (Rosetta/QEMU) is enabled"
fi

echo "------------------------------------------------------------------"
echo "All checks complete."
  ```

  4. `DOCKER-QUICKSTART.md`
  ```md
  # Docker Quickstart — mangu2-publishing

This project ships with Apple Silicon–friendly Docker defaults plus helper scripts that auto‑recover when Docker isn’t running.

## TL;DR

```bash
# 0) Start Docker Desktop (macOS) or the docker service (Linux)
# 1) From the repo root:
./start-dev.sh
# 2) Verify everything:
./test-setup.sh
# 3) Work as usual:
docker compose logs -f
docker compose down
```

## Why it sometimes fails on Apple Silicon

- Some stacks (node-gyp, wkhtmltopdf, older binaries) don’t have ARM builds.
- Our `docker-compose.yml` pins **web** to `platform: linux/amd64` by default for maximum compatibility.
  If your app builds natively on arm64, remove that line for faster native performance.

## Common fixes

- **Daemon not running**: `docker info` fails → start Docker Desktop (macOS) or `sudo systemctl start docker` (Linux).
- **Permission denied on Linux**: add your user to the `docker` group and re-login.
- **Port not responding**: services may still be starting; see `docker compose ps` and `docker compose logs -f`.

## Service Map

- **web** → dev app server on `http://localhost:3000` (health endpoint optional)
- **db**  → Postgres 16 (port 5432, volume `pgdata`)
- **cache** → Redis 7 (port 6379)

## Switching away from amd64 emulation (faster, if supported)

1. Edit `docker-compose.yml`, remove `platform: linux/amd64` under `web`.
2. Rebuild clean:
   ```bash
   docker compose down --remove-orphans
   docker system prune -af
   docker compose build --no-cache
   docker compose up -d
   ```
3. If native build fails, revert the platform line and ensure Docker Desktop’s x86 emulation is enabled.

## Resetting a wedged DB

```bash
docker compose down -v
docker volume ls | grep pgdata
# If needed: docker volume rm <volume-name>
docker compose up -d
```

## Verification

```bash
chmod +x start-dev.sh test-setup.sh
./start-dev.sh | tee start-dev.out
./test-setup.sh | tee test-setup.out
docker compose ps | tee compose-ps.out
```
  ```

  **Verification**
  ```bash
  chmod +x start-dev.sh test-setup.sh
  ./start-dev.sh | tee start-dev.out
  ./test-setup.sh | tee test-setup.out
  docker compose ps | tee compose-ps.out
  ```

  **If You Already Fixed Docker…**
  - If your compose already pins `platform: linux/amd64` only where needed and includes health checks → keep yours.  
  - If your start script already handles daemon auto‑recovery, health waits, **Redis PING/INFO**, and Apple Silicon hints → keep yours.  
  - Otherwise, merge the snippets above (safe defaults for contributors).

  ---

  ## Phase 1 — Author Normalization Bootstrap

  **Automation script:** `codex-normalization-bootstrap.sh`
  ```bash
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
  ```

  Run:
  ```bash
  chmod +x codex-normalization-bootstrap.sh
  ./codex-normalization-bootstrap.sh
  ```

  ---

  ## Phase 2 — Toggleable Data Backend (memory | pg)

  **Automation script:** `codex-backend-toggle.sh`
  ```bash
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
  ```

  Run:
  ```bash
  chmod +x codex-backend-toggle.sh
  ./codex-backend-toggle.sh
  ```

  ---

  ## Git Guardrails (Commit & Push)
  ```bash
  git status
  git add -A
  git commit -m "chore: Phase 0 Docker (Apple Silicon + Redis health) + Phase 1 normalization bootstrap + Phase 2 backend toggle"
  git rev-parse --abbrev-ref HEAD
  git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
  git log --oneline -n 5
  ```

  ## Codex Collaboration Templates
  Use these verbatim to keep the loop tight and automated.

  **PROGRESS UPDATE**
  ```markdown
  **PROGRESS UPDATE: Docker + Normalization + Toggle**

  - `./start-dev.sh`: ✅/❌ [last 20 lines]
  - `./test-setup.sh`: ✅/❌ [last 20 lines]
  - `npm --prefix server run test:memory`: ✅/❌ [last 20 lines]
  - `DATA_BACKEND=pg npm --prefix server run test:pg` (if DB): ✅/❌ [last 20 lines]
  - `docker compose ps`: [paste table]

  **Remaining Issues:** [errors or odd behavior]
  **Ask:** Provide exact file diffs to resolve remaining failures.
  ```

  **TASK COMPLETION REPORT**
  ```markdown
  **TASK COMPLETION REPORT**

  **Completed Task:** Phase 0/1/2 integration
  **Status:** ✅ SUCCESS / ⚠️ PARTIAL / ❌ BLOCKED

  **Evidence:**
  ```
  [paste terminal output for start-dev.sh, test-setup.sh, tests]
  ```

  **Next Task Request:** [choose: deploy pipeline / page review step / auth polish]
  ```

  **INCIDENT REPORT**
  ```markdown
  **INCIDENT REPORT**

  **Task:** [what you were trying]
  **Error:**
  ```
  [paste 5–20 lines]
  ```
  **Relevant Files:** [list]
  **Request:** Root cause + exact patch.
  ```

  **CHECKPOINT**
  ```markdown
  **PROJECT CHECKPOINT**

  **Phase:** [e.g., Phase 2: Code Quality & Resilience]
  **Completed:** [bullets]
  **Blockers:** [bullets]
  **Next Steps:** [bullets]
  **Quick Validation:**
  ```bash
  [commands + short outputs]
  ```
  ```
