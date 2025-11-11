# Production Deployment Checklist - MANGU Publishing

## Phase 1: Pre-Deployment ✅

### Code Quality
- [x] Fix 19 linting errors (trailing whitespace removed)
- [x] Commit uncommitted page components (8 pages added)
- [ ] Run `npm audit fix` to address vulnerabilities
- [ ] Upgrade ESLint to v9.x (optional - current version works)

### Security
- [ ] Rotate credentials per URGENT_TOKEN_ROTATION.md
- [ ] Review AWS IAM permissions
- [ ] Scan Docker images with Trivy
- [x] Enable WAF on ALB (configured in Terraform)

### Environment Configuration
- [x] Create production .env.example templates
- [x] Document environment variables in docs/PRODUCTION_ENV.md
- [ ] Set up Secrets Manager with production credentials

## Phase 2: Infrastructure Provisioning ✅

### Terraform Infrastructure
- [x] Create main.tf (VPC, subnets, security groups)
- [x] Create rds.tf (PostgreSQL 16 Multi-AZ)
- [x] Create elasticache.tf (Redis 7 cluster)
- [x] Create ecs.tf (Fargate cluster, task definitions)
- [x] Create alb.tf (Load balancer with WAF)
- [x] Create s3.tf (Upload and static asset buckets)
- [x] Create cloudfront.tf (CDN configuration)
- [x] Create ecr.tf (Container registries)
- [x] Create outputs.tf (Infrastructure outputs)
- [x] Create terraform.tfvars.example (Configuration template)

### Manual Steps Required
- [ ] Copy terraform.tfvars.example to terraform.tfvars
- [ ] Fill in terraform.tfvars with actual values
- [ ] Create ACM certificate for domain
- [ ] Update certificate_arn in terraform.tfvars
- [ ] Run `terraform init`
- [ ] Run `terraform plan` and review
- [ ] Run `terraform apply` to provision infrastructure

## Phase 3: Containerization ✅

### Docker Configuration
- [x] Create Dockerfile (multi-stage Node.js build)
- [x] Create Dockerfile.client (nginx-based)
- [x] Create infrastructure/nginx.conf (nginx config)
- [x] Create .dockerignore (exclude unnecessary files)
- [x] Create docker-compose.prod.yml (local testing)

### Testing Docker Builds
- [ ] Build server image: `docker build -t mangu-server -f Dockerfile .`
- [ ] Build client image: `docker build -t mangu-client -f Dockerfile.client .`
- [ ] Test locally: `docker-compose -f docker-compose.prod.yml up`
- [ ] Verify health endpoints work

## Phase 4: CI/CD Pipeline ✅

### GitHub Actions
- [x] Create .github/workflows/deploy.yml
- [x] Configure AWS ECR integration
- [x] Add security scanning with Trivy
- [x] Enable automatic rollback on failure

### GitHub Secrets Required
- [ ] Add AWS_ROLE_ARN (IAM role for OIDC)
- [ ] Add VITE_API_URL (production API URL)
- [ ] Add PRODUCTION_URL (production frontend URL)

### Setup OIDC for GitHub Actions
- [ ] Create IAM OIDC provider in AWS
- [ ] Create IAM role for GitHub Actions
- [ ] Grant ECR and ECS permissions to role

## Phase 5: Database Setup ✅

### PostgreSQL Configuration
- [x] RDS Multi-AZ configured in Terraform
- [x] Automated backups enabled (7 days)
- [x] Performance Insights enabled
- [x] Secrets Manager integration

### Manual Database Steps
- [ ] Wait for RDS instance to be created
- [ ] Run migrations: `npm --prefix server run migrate`
- [ ] Run seed data (if needed): `npm --prefix server run seed`
- [ ] Verify schema: Check init.sql applied correctly

## Phase 6: Monitoring & Observability ✅

### CloudWatch Configuration
- [x] ECS task logs to CloudWatch
- [x] RDS logs to CloudWatch
- [x] Redis logs to CloudWatch
- [x] Log retention set to 7 days

### Alarms to Configure
- [ ] Create alarm: ECS service unhealthy targets
- [ ] Create alarm: Database CPU > 80%
- [ ] Create alarm: Redis memory > 80%
- [ ] Create alarm: ALB 5xx error rate > 5%
- [ ] Create alarm: Response time > 2s

### Dashboard to Create
- [ ] Create CloudWatch dashboard with key metrics
- [ ] Add ECS CPU/Memory utilization
- [ ] Add RDS connections and IOPS
- [ ] Add ALB request count and latency

## Phase 7: Security Hardening ✅

### AWS Security
- [x] WAF configured with rate limiting
- [x] Security groups with least privilege
- [x] All data encrypted at rest
- [x] TLS 1.3 for ALB and CloudFront
- [x] S3 buckets private by default

### Application Security
- [ ] Review CORS configuration for production domains
- [ ] Enable rate limiting in application
- [ ] Configure CSP headers in nginx
- [ ] Review and test authentication flow
- [ ] Verify JWT secret is strong (32+ chars)

## Phase 8: Documentation ✅

### Documentation Created
- [x] docs/DEPLOYMENT.md (deployment guide)
- [x] docs/PRODUCTION_ENV.md (environment variables)
- [x] docs/INFRASTRUCTURE.md (architecture)
- [x] docs/runbooks/deployment.md (deployment runbook)
- [x] docs/runbooks/rollback.md (rollback procedures)
- [x] docs/runbooks/scaling.md (scaling guide)
- [x] docs/runbooks/troubleshooting.md (troubleshooting)

### Operational Scripts
- [x] scripts/smoke-tests.sh (production health checks)
- [ ] Make smoke-tests.sh executable: `chmod +x scripts/smoke-tests.sh`

## Phase 9: Testing & Validation

### Local Testing
- [ ] Test Docker builds locally
- [ ] Run smoke tests against local docker-compose
- [ ] Verify all environment variables work
- [ ] Test health endpoints

### Staging Deployment
- [ ] Deploy to staging environment first
- [ ] Run full test suite in staging
- [ ] Load test staging environment
- [ ] Verify monitoring and alerts work
- [ ] Practice rollback in staging

## Phase 10: Production Go-Live

### Pre-Launch
- [ ] Verify all checklist items complete
- [ ] Schedule deployment window
- [ ] Notify team of deployment time
- [ ] Prepare rollback plan
- [ ] Have on-call engineer ready

### Deployment Steps
1. [ ] Trigger deployment (push to main or manual)
2. [ ] Monitor deployment progress (15-20 minutes)
3. [ ] Verify tasks are healthy in ECS
4. [ ] Run smoke tests: `./scripts/smoke-tests.sh`
5. [ ] Check CloudWatch logs for errors
6. [ ] Verify database connectivity
7. [ ] Test critical user flows manually

### Post-Launch Monitoring (First 24 Hours)
- [ ] Monitor CloudWatch metrics continuously
- [ ] Check error rates in logs
- [ ] Verify no performance degradation
- [ ] Monitor costs in AWS Cost Explorer
- [ ] Be ready to rollback if issues arise

## Phase 11: Post-Deployment

### Optimization
- [ ] Review CloudWatch metrics
- [ ] Optimize slow database queries
- [ ] Fine-tune auto-scaling thresholds
- [ ] Set up cost alerts
- [ ] Enable CloudWatch Container Insights

### Documentation Updates
- [ ] Update README.md with production URLs
- [ ] Document any issues encountered
- [ ] Update runbooks based on experience
- [ ] Create architecture diagram

### Team Handoff
- [ ] Train team on deployment process
- [ ] Share access to AWS console
- [ ] Document on-call procedures
- [ ] Schedule deployment retrospective

## Quick Commands Reference

### Deploy to Production
```bash
git push origin main
```

### Check Deployment Status
```bash
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production
```

### View Logs
```bash
aws logs tail /ecs/mangu-publishing-server-production --follow
```

### Run Smoke Tests
```bash
./scripts/smoke-tests.sh https://mangu-publishing.com
```

### Rollback
```bash
# See docs/runbooks/rollback.md for detailed steps
```

## Success Criteria

- ✅ Application deploys successfully to AWS
- ✅ All services healthy (database, cache, API, frontend)
- ✅ UI/design preserved exactly as designed
- ✅ CI/CD pipeline automates deployments
- ✅ Monitoring and alerts configured
- ✅ Documentation complete
- ✅ Zero critical security vulnerabilities
- ✅ Response time < 500ms for health endpoint
- ✅ 99.9% uptime SLA target

## Estimated Timeline

- **Phase 1-2**: 2-3 hours (Infrastructure setup)
- **Phase 3-4**: 1-2 hours (Docker & CI/CD)
- **Phase 5-6**: 1 hour (Database & Monitoring)
- **Phase 7-8**: 1 hour (Security & Documentation)
- **Phase 9**: 2-3 hours (Testing in staging)
- **Phase 10**: 1 hour (Production deployment)
- **Phase 11**: Ongoing (Optimization)

**Total**: 8-11 hours for complete production setup

## Emergency Contacts

- **DevOps Lead**: [contact info]
- **Database Admin**: [contact info]
- **On-Call Engineer**: [contact info]
- **AWS Support**: [support plan]

## Related Documentation

- [README.md](./README.md) - Project overview
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Deployment guide
- [docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md) - Architecture
- [docs/PRODUCTION_ENV.md](./docs/PRODUCTION_ENV.md) - Environment vars
- [docs/runbooks/](./docs/runbooks/) - Operational runbooks
