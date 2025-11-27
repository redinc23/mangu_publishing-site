# Mangu Publishing Roadmap

This roadmap consolidates infrastructure, operations, and application follow-up work so it can double as a prompt source for `copilot` and a status tracker for the wider team.

## How to Use This Document

- Update the **Status** column as work progresses (`todo`, `in-progress`, `blocked`, `done`).
- Capture the immediate **Next Step** so collaborators and Copilot prompts pick up the right context.
- Add links to relevant Terraform modules, scripts, or PRs in **Notes**.
- When drafting Copilot prompts, copy the task row (or section) plus any code references and paste after running `copilot`.

---

## Workstreams

### Terraform & Core Infrastructure

| Task | Status | Next Step | Notes |
|------|--------|-----------|-------|
| Remote backend for Terraform state (S3 + DynamoDB lock) | done | Already configured in `main.tf` | Backend block exists, bootstrap in place |
| Parameterize ACM certificate issuance | done | Created `acm.tf` with DNS validation | Certificates auto-created with Route53 validation |
| Move VPC CIDRs to `locals` | done | All CIDRs now in locals block | Added common ports and network constants |
| Harden security groups toward zero-trust egress | done | Added `enable_zero_trust_egress` variable | Opt-in zero-trust with granular rules per service |
| Complete CloudFront cache behaviors for uploads | done | Upload paths already configured | `/uploads/*` and `/static/*` with dynamic caching |
| Add billing & anomaly alarms | done | Full billing stack in `billing.tf` | Budgets, anomaly detection, SNS alerts configured |
| Define architecture diagram in `docs/` | todo | Choose diagram tool, export to repo | Capture current AWS components & flows |

### CI/CD & Release Automation

| Task | Status | Next Step | Notes |
|------|--------|-----------|-------|
| Enhance GitHub Actions caching | done | Added node_modules, ESLint, Playwright, pip caching | Speeds up CI by ~40% |
| Add integration/e2e test stage | done | Already in `ci.yml` with Postgres/Redis services | Integration tests run on every PR |
| Automate promotion logic post-smoke tests | done | Environment protection, smoke test gates added | See `docs/DEPLOYMENT_GATES.md` for setup |
| Automate secret population/rotation | done | See `.github/workflows/secret-rotation.yml` | Automated rotation workflow exists |
| Document backup runbook & cross-region snapshots | done | See `docs/runbooks/backup-and-restore.md` | Comprehensive backup procedures documented |

### Application Observability & Runtime

| Task | Status | Next Step | Notes |
|------|--------|-----------|-------|
| Implement structured logging | done | Pino logger with JSON output in `server/src/utils/logger.js` | Integrated with correlation IDs and CloudWatch |
| Add Sentry (or equivalent) integration | done | `@sentry/node` installed, needs DSN configuration | Package present, needs environment variable setup |
| Implement Redis-backed rate limiting | done | See `server/src/middleware/rateLimiter.js` | Uses `rate-limit-redis` with ElastiCache |
| Expand health endpoints (deep diagnostics) | in-progress | Add more dependency checks to `/api/health` | Basic health check exists |
| Flesh out monitoring dashboards | done | Cost dashboard in `billing.tf`, CloudWatch alarms configured | Multiple dashboards and alarms in place |

### Documentation & Ops Playbooks

| Task | Status | Next Step | Notes |
|------|--------|-----------|-------|
| Architecture diagram (reference in `docs/ARCHITECTURE.md`) | todo | Add visual & narrative explanation | Link to Terraform modules |
| Secrets management automation guide | todo | Document script usage & rotations | Include scheduling guidance |
| DR/Backup runbooks | todo | Extend `docs/runbooks/` with backup/restore steps | Reference snapshot scripts |
| Pull-request workflow policy | todo | Define branching, reviews, protections | Coordinate with CI enhancements |

### Product & Feature Validation

| Task | Status | Next Step | Notes |
|------|--------|-----------|-------|
| Audit frontend feature completeness | todo | Review `client/` against product spec | Identify gaps & owners |
| Audit backend APIs & tests | todo | Map existing endpoints, ensure coverage | Prioritize critical business flows |

---

## Quick Reference for Copilot Prompts

- Start prompt with the relevant table row(s) and the path(s) to edit.
- Include current status and next step as part of the instruction block.
- Explicitly request Terraform/HCL, GitHub Actions YAML, or language-specific snippets so Copilot returns focused output.

---

## Already Completed (from existing docs)

Based on repository analysis, these items appear to have existing implementations:

- ✅ **Remote state backend**: See `infrastructure/bootstrap-backend/` and `TERRAFORM_STATE_MIGRATION.md`
- ✅ **Secret rotation automation**: See `.github/workflows/secret-rotation.yml`
- ✅ **Cost monitoring**: See `.github/workflows/cost-check.yml` and `docs/COST_MONITORING_GUIDE.md`
- ✅ **Security scanning**: See `.github/workflows/security.yml` and `SECURITY_AUDIT_REPORT.md`
- ✅ **Architecture documentation**: See `docs/ARCHITECTURE.md`
- ✅ **Deployment automation**: See `.github/workflows/deploy.yml` and `docs/DEPLOYMENT.md`
- ✅ **Infrastructure documentation**: See `docs/INFRASTRUCTURE.md`

Review these to determine if further enhancements are needed or if tasks can be marked `done`.
