# 📚 MANGU Publishing Platform

> **Stream Unlimited Stories** – A cloud-native publishing experience for readers, authors, and operators. Built on React + Node, battle-tested on AWS, and proven to run in Replit for rapid iteration.

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=white&style=for-the-badge)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.0+-339933?logo=nodedotjs&logoColor=white&style=for-the-badge)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0+-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.1-DC382D?logo=redis&logoColor=white&style=for-the-badge)](https://redis.io/)
[![AWS](https://img.shields.io/badge/AWS-ECS%20Fargate-FF9900?logo=amazonaws&logoColor=white&style=for-the-badge)](https://aws.amazon.com/)
[![Vite](https://img.shields.io/badge/Vite-7.0+-646CFF?logo=vite&logoColor=white&style=for-the-badge)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)

---

## 🌟 Hero Overview

MANGU is a modern publishing stack that marries immersive reader experiences with powerful author/admin tooling and enterprise-grade operations. Everything in this repo exists today: React frontend, Express API, PostgreSQL + Redis helpers, Terraform infra, GitHub Actions, observability hooks, and a Replit deployment profile.

| Persona | What they get | Built with |
| --- | --- | --- |
| Readers | Installable PWA, offline-ready browsing, playlists, search | React 18, Vite, TanStack Query (planned), Tailwind, SW |
| Authors | Submission portal, analytics, royalty pipelines | React + Amplify Auth scaffolding + Stripe |
| Admins | CRUD dashboards, fraud/rate-limiting, Notion AI helpers | Express API, PostgreSQL, Redis optional |
| Operators | Terraform IaC, GitHub Actions, Sentry-ready logs, CloudWatch | Terraform modules, ECS, CloudFront, billing alarms |

---

## 🧭 Repository Map

```
.
├── client/                 # React 18 + Vite frontend
│   ├── src/
│   │   ├── pages/          # Home, Library, Events, Admin, Author Portal…
│   │   ├── components/     # UI kit + accessibility primitives
│   │   ├── context/        # Cart, Library, Amplify Auth
│   │   ├── lib/            # serviceWorkerRegistration, a11y helpers
│   │   └── hooks/          # useA11y, useAnnouncer, etc.
│   ├── public/             # manifest, sw.js, offline.html, icons/
│   └── tests/              # Vitest + Playwright integration suites
├── server/                 # Node/Express backend (ES modules)
│   ├── src/routes/         # Books, Notion, health, etc.
│   ├── src/middleware/     # auth, rate limiting, logging
│   ├── src/utils/          # logger (Pino), Notion, formatters
│   └── src/database/       # migrate, rollback, seed scripts + SQL
├── infrastructure/         # Terraform modules, remote backend config
├── docs/                   # Architecture, deployment, runbooks, security
├── scripts/                # CI helpers, diagnostics, deploy/run scripts
├── ROADMAP.md              # Workstream tracker (infra/app/docs)
└── README.md               # You are here
```

---

## 🔐 Environments & Config

### Local / Replit Development

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string | Replit-provided URL or local DSN |
| `PORT` | Backend port | `3009` |
| `VITE_API_URL` | Frontend → API base | `http://localhost:3009/api` |
| `VITE_VAPID_PUBLIC_KEY` | Push notifications (optional) | `<public-key>` |
| `VITE_AWS_REGION`, `VITE_COGNITO_USER_POOL_ID`, … | Cognito auth (optional) | `<set when ready>` |
| `DISABLE_REDIS` | Force in-memory rate limiter/cache | `1` |
| `DEV_ALLOW_NO_DB` | Dev-only: set to `1` to boot backend without Postgres | `1` |
| `CORS_ORIGINS` | Comma-separated origins | `http://localhost:5179,https://<repl>.repl.co` |

Keep secrets out of version control—use Replit Secrets or `.env` (mirrored per `client/.env.example` & `server/.env.example`).

### Production (AWS)

- Remote Terraform backend (S3 + DynamoDB) already configured.
- Secrets managed via AWS Secrets Manager / SSM Parameter Store.
- Reference `docs/PRODUCTION_ENV.md`, `docs/INFRASTRUCTURE.md`, `docs/DEPLOYMENT.md` for full variable lists.

---

## 🛠️ Getting Started

### Prerequisites

- Node.js ≥ 18 / npm ≥ 9
- PostgreSQL (local) or Replit Postgres service
- Redis optional (set `DISABLE_REDIS=1` to skip)
- AWS creds for Terraform/ECR if deploying to AWS

### Local Workflow

```bash
git clone https://github.com/<you>/mangu2-publishing.git
cd mangu2-publishing
npm install              # installs root + workspaces

# Backend
cd server
cp .env.example .env
npm run migrate
npm run seed
npm run dev              # http://localhost:3009

> 📦 **Local Postgres required:** ensure `postgresql://postgres:password@localhost:5432/mangu_dev` is reachable (or adjust `server/.env`), otherwise the backend will log a clear error and exit before handling requests.
>
> 🛠️ **Just want to demo the UI?** Set `DEV_ALLOW_NO_DB=1` in `server/.env` (only works when `NODE_ENV=development`). The backend will start without Postgres and DB-backed APIs will respond with 503/500 while you click through flows.

# Frontend
cd ../client
cp .env.example .env
npm run dev              # http://localhost:5179 (Replit forces 5000)

### Dev Servers

- Run `npm run dev` from the repo root to start both the backend (Express) and frontend (Vite) together.
- Frontend: http://localhost:5179
- Backend health: http://localhost:3009/api/health

Copy `server/.env.example` and `client/.env.example` into their respective `.env` files before you start to ensure the services point at the new ports.
```

### Replit Cloud Workflow (Nov 24, 2025 snapshot)

- Frontend: Vite on **port 5000** (host `0.0.0.0`, HMR proxied)
- Backend: Express on **port 3001**
- Database: Managed Postgres (`DATABASE_URL` injected)
- Startup: `npm install && npm run dev` auto-starts both services
- Health: `http://localhost:3001/api/health`
- Docs: `http://localhost:3001/api/docs`
- Performance: API <100 ms, frontend load <500 ms (Replit env)

Optional AWS integrations (Cognito, S3, Stripe, SES) remain off until secrets are supplied.

---

## ✅ Feature Matrix (Reality vs Blockers)

| Capability | Status | Notes / Blockers |
| --- | --- | --- |
| Reader experience (browse, detail, cart, events) | ✅ | Data fetches still use hard-coded hosts; migrate to shared API client + React Query |
| Cart & checkout UI | ✅ | Stripe integration ready but requires live keys + webhook handler |
| Author portal UI | ✅ | Backend endpoints/guards need completion |
| Admin dashboard UI | ✅ | Delete/update actions still mocked; wire to authenticated API |
| Amplify Cognito auth scaffolding | ✅ | Needs env vars + backend role enforcement |
| PWA & offline plumbing | ✅ | Icons/screenshots missing; components not yet mounted in `App.jsx` |
| Accessibility toolkit | ✅ | Hooks/components built; ensure integrated in layout + tested |
| Structured logging & Sentry | ✅ | Packages + middleware exist; set `SENTRY_DSN` to enable |
| Rate limiting + Redis | ✅ | Works when Redis client provided; otherwise stub |
| Terraform / IaC | ✅ | `infrastructure/` contains VPC/ECS/CloudFront/etc. |
| Docs/runbooks | ✅ | `docs/` plus `ROADMAP.md` track workstreams |
| CI/CD | ✅ | Multiple GitHub Actions workflows (build, deploy, secrets, cost, security) |

---

## 🧩 Frontend Deep Dive

- **Stack**: React 18, Vite 7, React Router 6, Tailwind, Framer Motion, Vitest, Playwright.
- **Design System**: `client/src/styles/design-system.css`, `client/README_COMPONENTS.md`.
- **UI Kit**: Buttons, Inputs, Modals, Drawers, Toasts, Skeletons, DataTable, EmptyState, Theme toggle, animations.
- **Accessibility**: `src/lib/a11y.js`, `src/hooks/useA11y.js`, `src/components/A11yComponents.jsx` (focus traps, announcers, skip links, reduced-motion, etc.).
- **PWA**: `public/manifest.json`, `public/sw.js`, `public/offline.html`, `src/lib/serviceWorkerRegistration.js`, `src/components/PWAInstallPrompt.jsx`.
- **State/Auth**: Cart/Library context, Amplify Auth provider, TODO: React Query for API caching.
- **Testing**: `client/tests` with Vitest + Testing Library; add more coverage for critical routes.

### Outstanding Frontend Work

1. **API client**: Replace direct `fetch('http://localhost:3001/...')` calls with `lib/apiClient` + TanStack Query (cache, retries, optimistic updates).
2. **Admin CRUD wiring**: Implement create/update/delete flows with notifications, optimistic updates, and auth guards.
3. **PWA integration**: Mount `<SkipLink/>`, `<PWAInstallPrompt/>`, `<OfflineIndicator/>` in `App.jsx`; add `<main id="main-content">`; generate icons/screenshots.
4. **Component kit**: Finish unchecked items from `client/README_COMPONENTS.md` (Select, Tabs, Accordion, Badge, Pagination, etc.).
5. **Testing**: Add Vitest + Playwright coverage for Home, Auth, Admin, Author flows; gate e2e in CI.

---

## 🧱 Backend Deep Dive

- **Stack**: Node 20, Express 4, ES modules, Pino logging, Helmet, Compression, Nodemon dev server.
- **Key scripts**: `npm run dev`, `npm run test`, `npm run migrate`, `npm run seed`, `npm run docs:generate`, `npm run security:audit`.
- **Middleware**: Rate limiting (Redis-aware), correlation IDs, structured request logging, Sentry hooks, Joi validation, Notion AI integration.
- **Database**: PostgreSQL via `pg`, migrations + seeds in `server/src/database/`, view counters, relations (authors/categories/publishers).
- **Services**: Stripe, SES, S3, Socket.IO, Notion API helpers.
- **Docs**: Swagger generation to `server/docs/api/swagger.json`; health endpoints for monitoring.

### Outstanding Backend Work

1. **API audit**: Ensure `/api/admin/*`, `/api/author/*`, `/api/orders/*` match frontend expectations; fill missing controllers + tests.
2. **Auth bridge**: Enable Cognito/JWT verification + role-based guards on sensitive routes; expose `/api/me`.
3. **Stripe webhooks**: Validate checkout/session success + billing portal; document secrets.
4. **Uploads/media**: Confirm S3 streaming + signed URLs; consider Replit storage fallback.
5. **Testing**: Expand Vitest coverage (books CRUD, Notion, payments); add Postman/Thunder collections for QA.

---

## ☁️ Infrastructure & DevOps

- **Terraform**: Remote backend + modules for VPC, ECS Fargate, ALB, CloudFront, WAF, RDS, ElastiCache, budgets/alarms. See `infrastructure/` + `docs/INFRASTRUCTURE.md`.
- **CI/CD**: GitHub Actions for build/lint/test/e2e/deploy, caching, secret rotation (`.github/workflows/secret-rotation.yml`), cost monitoring, security scans.
- **Monitoring**: CloudWatch dashboards, billing alarms, Sentry hooks, health endpoints, runbooks (`docs/runbooks/`).
- **Automation**: Scripts for deploys (`deploy-to-production.sh`, `quick-deploy.sh`), diagnostics, start scripts per service.

---

## 🧪 Replit Setup Status (Reality Snapshot)

| Component | Port | Status | Notes |
| --- | --- | --- | --- |
| Frontend (Vite) | 5000 | ✅ | HMR via Replit proxy |
| Backend (Express) | 3001 | ✅ | `/api/health`, `/api/docs` |
| PostgreSQL | Managed | ✅ | Schema (`init.sql`) applied, sample data seeded |
| Redis | Stub | ℹ️ | Set `DISABLE_REDIS=1` to skip |
| Auth | Partial | ℹ️ | Amplify config ready; use JWT or hosted UI once env vars set |

- Env vars configured: `DATABASE_URL`, `NODE_ENV`, `PORT`, `DISABLE_REDIS`, `CORS_ORIGINS`.
- Vite config patched for proxy host/port + WebSocket.
- Performance metrics: API <100 ms, frontend load <500 ms (Replit dev).
- Optional AWS services intentionally off until secrets provided (Cognito, S3, SES, Stripe live keys).

---

## 🧾 Roadmap Highlights (see `ROADMAP.md` for live table)

| Workstream | Status | Next Step |
| --- | --- | --- |
| Architecture diagram | `todo` | Add visuals + narrative to `docs/ARCHITECTURE.md` |
| Secrets automation guide | `todo` | Document rotation workflow usage |
| DR/Backup runbooks | `todo` | Extend `docs/runbooks/` with snapshot playbooks |
| Frontend audit | `todo` | Map `client/` vs product spec; identify owners |
| Backend audit | `todo` | Validate endpoints + tests; prioritize gaps |
| Health endpoint | `in-progress` | Enrich `/api/health` with dependency checks |

---

## 🚀 Launch Playbook (Condensed)

1. **Prep**
   - Install deps, set env vars, migrate + seed DB.
   - Configure telemetry (Sentry DSNs, log level).
2. **Frontend**
   - Centralize API access, wire admin/author flows, mount PWA components, finish design system, add tests.
3. **Backend**
   - Complete CRUD endpoints, auth guards, Stripe webhooks, docs, and tests.
4. **Infra & CI**
   - `terraform plan/apply`, push images to ECR, ensure GH secrets/permissions, confirm CloudFront + Route53 ready.
5. **QA & Launch**
   - Lighthouse ≥90, Playwright suite, manual smoke (signup, checkout, admin delete, offline); invalidate CloudFront.
6. **Post-launch**
   - Monitor for 72 h, collect KPIs, update docs/runbooks, triage backlog into `ROADMAP.md`.

A full-length playbook can live in `docs/LAUNCH_PLAYBOOK.md` if desired—copy this section to seed it.

---

## 🤝 Contribution & Support

- Read `AGENT.md`, `DEVELOPMENT_README.md`, and `ROADMAP.md` before branching.
- Use feature branches + PR templates, run `npm run lint` / `npm test` / `npm run test:e2e` before pushing.
- Reference runbooks under `docs/runbooks/` for deploys, incidents, DR, and backup procedures.
- For help, drop issues in GitHub, ping the team chat, or open a discussion referencing logs/metrics.

---

## ❤️ Credits

Built with care by the MANGU team and community contributors who hardened infrastructure, modernized the frontend, and documented every switch so the next person can ship faster.

> “Just read love.” – Team MANGU
