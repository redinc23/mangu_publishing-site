# Copilot instructions for MANGU Publishing

This repository is a monorepo with a React frontend (`client/`) and an Express backend (`server/`). Use this doc to make code changes that match project conventions and to locate important workflows.

Key places to read before editing
- `README.md` — quick-start, env and Docker guidance.
- `start-dev.sh`, `test-setup.sh` — canonical local dev / health-check scripts.
- `server/src/index.js` and `server/src/app.js` — server bootstrap, DB/Redis wiring and HTTP routes (health, books endpoints).
- `server/src/database/init.sql` — canonical schema (UUID PKs, enums, indexes) — migrations live under `server/src/database/migrations/` and seeds under `server/src/database/seeds/`.
- `client/src/main.jsx` and `client/src/App.jsx` — app entry, ErrorBoundary, routing patterns.

Important project patterns (do not break these)
- Database & cache wiring: `server/src/index.js` sets DB pool and Redis client via `setDbPool()` and `setRedisClient()`; routes access them via `req.app.locals.db` and `req.app.locals.redis`.
- Redis is optional in dev: the server supports `DISABLE_REDIS=1` -> a lightweight stub is used. Respect this in tests and in code that checks for `redisClient` API shape (methods like `get`, `setEx`, `set`).
- SQL-first schema: `init.sql` is authoritative. The code issues raw SQL queries in routes (see `app.js`), so prefer minimal, compatible SQL changes and update tests and seed data.
- Error & health semantics: `/api/health` returns detailed status and non-200 codes for critical failures; use it when implementing readiness checks.

Scripts & developer workflows
- Start full local environment (recommended):
  1) load creds: `source scripts/launch_credentials.sh` (creates required env vars)
  2) `./start-dev.sh` (brings up Dockerized Postgres, Redis, Adminer, MailHog)
  3) In separate terminals: `cd client && npm run dev` and `cd server && npm run dev`
- Quick npm/yarn commands:
  - From workspace root: `npm install` or `yarn install` (yarn workspaces are configured)
  - Start both at once: `npm run dev` (uses `concurrently` + yarn workspaces)
  - Server migrations/seeds: `npm --prefix server run migrate` / `npm --prefix server run seed` (verify `server/src/database/migrate.js` exists; if missing, use `init.sql`/`seed.sql` in `server/src/database/`)
  - Tests: `npm test` at repo root runs configured test flows; `cd client && npm test` and `cd server && npm test` run unit tests (Vitest). Playwright is used for e2e in `client` (`npm run test:e2e`).

Code conventions & style
- JS/TS: `client/` uses ESM + Vite + optional TypeScript checks (`type-check` script). `server/` is ESM (`type: module`). Stick to existing lint configs in each workspace (`eslint` + `lint-staged`).
- Logging & errors: server logs with console + `winston` in places; maintain human-readable console output for dev. Do not remove the detailed error messages gated by NODE_ENV checks.
- Routes: many routes live inline in `app.js` (books, featured, trending). When adding larger features, prefer creating a new file under `server/src/routes/` and import into `app.js` to keep file size manageable.

Integration points & external services
- Postgres: authoritative storage (connection via `DATABASE_URL`), schema in `server/src/database/init.sql`.
- Redis: caching, optional in dev. Use keys like `books:featured` (see `app.js`).
- AWS SDK clients are present (`@aws-sdk/*`) — look under `server/src/services/` for S3, SES, Dynamo usage.
- Stripe, SES, Cognito integration exist — credentials are expected in `scripts/credentials/*.sh` and `.env` files.

Testing & CI hints
- Use `./test-setup.sh` locally to validate environment before running tests.
- Unit tests use Vitest; run `npm --prefix server run test` or `npm --prefix client run test`.
- CI runs comprehensive validation (see `.github/workflows/ci.yml`):
  1. Migration validation (clean apply + rollback testing)
  2. Security scanning (npm audit + CodeQL Analysis)
  3. Lint & test suite (server, client, e2e with Playwright)
  4. Infrastructure validation (Docker Compose, K8s manifests, Terraform)
  5. Preview environment deployment for PRs
- Preserve `lint-staged` and Husky hooks when editing configs; CI enforces these.

Examples to copy/paste
- Access DB in a route: `const db = req.app.locals.db; if (!db) return res.status(503).json({error:'Database unavailable'})` (pattern repeated in `app.js`).
- Caching pattern: `const cached = await redisClient.get('books:featured'); if (cached) return res.json(JSON.parse(cached));` then write back with `setEx`.

If anything is unclear
- Point edits at the files referenced above. If you plan to change DB migration tooling or remove `start-dev.sh` assumptions, add migration notes and update `README.md` and `test-setup.sh` accordingly.

Please review and tell me which sections you want expanded (examples, more file references, or CI specifics).
