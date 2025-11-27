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
| Remote backend for Terraform state (S3 + DynamoDB lock) | todo | Outline bootstrap flow, reference `infrastructure/bootstrap-backend` | Requires migration plan from local state |
| Parameterize ACM certificate issuance | todo | Determine domain vars, add DNS validation automation | Must ensure certificate reaches `ISSUED` before deploy |
| Move VPC CIDRs to `locals` | todo | Identify hard-coded CIDRs in `infrastructure/terraform` | Improves reuse and readability |
| Harden security groups toward zero-trust egress | todo | Audit open egress rules, design whitelist | Coordinate with app port requirements |
| Complete CloudFront cache behaviors for uploads | todo | Map origin paths, add cache control overrides | Confirm with frontend upload patterns |
| Add billing & anomaly alarms | todo | Model budgets/alerts in Terraform | Align thresholds with finance expectations |
| Define architecture diagram in `docs/` | todo | Choose diagram tool, export to repo | Capture current AWS components & flows |

### CI/CD & Release Automation

| Task | Status | Next Step | Notes |
|------|--------|-----------|-------|
| Enhance GitHub Actions caching | todo | Profile builds, add dependency cache steps | Focus on server/client installs |
| Add integration/e2e test stage | todo | Identify critical smoke/integration suites | Ensure failures block deploy |
| Automate promotion logic post-smoke tests | todo | Design gating rules, update `deploy.yml` | Consider manual override path |
| Automate secret population/rotation | todo | Script ingestion into Secrets Manager | Use existing README guidance as base |
| Document backup runbook & cross-region snapshots | todo | Draft runbook in `docs/runbooks/` | Reference existing `scripts/backup-*` |

### Application Observability & Runtime

| Task | Status | Next Step | Notes |
|------|--------|-----------|-------|
| Implement structured logging | todo | Select logging schema (JSON), update server/client | Integrate with CloudWatch log groups |
| Add Sentry (or equivalent) integration | todo | Configure DSNs, wire into runtime | Ensure secrets handled securely |
| Implement Redis-backed rate limiting | todo | Design middleware, connect to ElastiCache | Coordinate with API usage patterns |
| Expand health endpoints (deep diagnostics) | todo | Define metrics & dependency checks | Feed ALB/CloudWatch alarms |
| Flesh out monitoring dashboards | todo | Map key metrics, create CloudWatch/Sentry boards | Pair with alert thresholds |

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



