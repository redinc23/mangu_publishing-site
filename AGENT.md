AGENT RUNBOOK — One-shot setup & verification

This file provides a compact, copy-pasteable set of steps an automated agent or human can run to bring up a full local environment, apply migrations, seed data, and run tests.

Prerequisites
- Docker & Docker Compose
- Node.js 18+, npm or yarn
- `scripts/credentials/local.sh` created and loaded (or `scripts/launch_credentials.sh`)

One-shot sequence (safe defaults)

1) Install dependencies (root workspace - supports yarn workspaces)

```bash
# From project root
npm install
npm --prefix server install
npm --prefix client install
```

2) Load credentials and start dev services (Postgres, Redis, Adminer, MailHog)

```bash
source scripts/launch_credentials.sh
./start-dev.sh
```

3) Wait for DB/Redis to be ready (optional manual wait)

```bash
# Wait until Postgres accepts connections
# On macOS with nc available
until nc -z localhost 5432; do sleep 1; done
```

4) Run migrations (this will use `server/src/database/migrations/` if present, otherwise `init.sql`)

```bash
# Ensure DATABASE_URL env var is set (scripts/launch_credentials.sh should do this)
node server/src/database/migrate.js
```

5) Seed sample data (if `seed.sql` or `seeds/` exists)

```bash
node server/src/database/seed.js
```

6) Start servers (in separate terminals)

```bash
# Terminal A (frontend)
cd client && npm run dev

# Terminal B (backend)
cd server && npm run dev
```

7) Run quick verification (health endpoints + tests)

```bash
# Health
curl http://localhost:5000/api/health
# Unit tests (server)
npm --prefix server run test
# Unit tests (client)
npm --prefix client run test
# e2e (client)
npm --prefix client run test:e2e
```

Dangerous reset (explicit confirmation required)

```bash
# WARNING: destroys ALL DB DATA. Only run in disposable dev DB.
FORCE_RESET=1 node server/src/database/reset.js
```

Rollback last migration (if rollback script exists)

```bash
node server/src/database/rollback.js
# Or to force-remove migration record (dangerous):
REMOVE_RECORD=1 node server/src/database/rollback.js
```

Notes for agents
- Respect `DISABLE_REDIS=1` for environments without Redis; server code uses a stub when disabled.
- Use `req.app.locals.db` and `req.app.locals.redis` to access DB and cache in server routes.
- Prefer small, focused migrations under `server/src/database/migrations/` and add rollback SQL alongside when possible.
- If `server/package.json` references scripts that point to missing files, prefer the safe fallback described here (init.sql/seed.sql).

If you want, I can:
- Add a tiny GitHub Action workflow that validates migrations and lint/tests on PRs.
- Expand this runbook into `.github/workflows/agent-setup.yml` for CI verification.
