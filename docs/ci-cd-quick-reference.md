# CI/CD Pipeline - Quick Reference

## Pipeline Jobs (in order)

1. **test** - Lint, typecheck, unit tests (with npm cache)
2. **integration-tests** - Real Postgres/Redis tests (ephemeral)
3. **security-scan** - Snyk + npm audit
4. **build-and-push** - Docker build with BuildKit cache + Trivy scan → ECR
5. **deploy** - Database migrations + ECS deployment
6. **smoke-tests** - Health checks on production
7. **performance-tests** - Lighthouse CI + response time baseline
8. **promote-images** - Tag as `stable` + timestamped tag

## Common Commands

### Run integration tests locally
```bash
docker-compose -f docker-compose.test.yml up -d
cd server && npm run test:integration
docker-compose -f docker-compose.test.yml down -v
```

### Test smoke tests
```bash
./scripts/smoke-tests.sh http://localhost:3000
```

### Check deployed image tags
```bash
aws ecr describe-images \
  --repository-name mangu-publishing/server \
  --query 'imageDetails[*].imageTags' | grep -E "stable|production"
```

### Manual rollback to stable
```bash
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --force-new-deployment
```

### View deployment logs
```bash
aws logs tail /ecs/mangu-publishing-cluster-production/server --follow
```

## Required Secrets

| Secret | Purpose | Example |
|--------|---------|---------|
| `AWS_ROLE_ARN` | OIDC authentication | `arn:aws:iam::123456789012:role/GitHubActions` |
| `DATABASE_URL` | Production DB | `postgresql://user:pass@host:5432/db` |
| `PRODUCTION_URL` | Production app URL | `https://mangu-publishing.com` |
| `VITE_API_URL` | Frontend API endpoint | `https://api.mangu-publishing.com` |
| `SNYK_TOKEN` | Security scanning | `abcd1234-...` |

## Cache Locations

- **npm cache**: GitHub Actions cache for `node_modules`
- **Docker cache**: GitHub Actions cache backend (BuildKit)
- **Trivy cache**: In-workflow only

## Performance Metrics

| Stage | Time (cached) | Time (uncached) |
|-------|---------------|-----------------|
| Install deps | ~15s | ~45s |
| Docker build | ~60s | ~150s |
| Integration tests | ~30s | ~40s |
| Deploy + wait | ~180s | ~180s |
| Smoke tests | ~20s | ~20s |
| **Total** | **~6 min** | **~9 min** |

## Image Tags Explained

| Tag | Purpose | Updated |
|-----|---------|---------|
| `latest` | Most recent build | Every push to main |
| `<commit-sha>` | Specific commit | Every push to main |
| `stable` | Current production | After successful deployment |
| `production-YYYYMMDD-HHMMSS` | Deployment timestamp | After successful deployment |

## Troubleshooting

### "Integration tests failed"
- Check Postgres/Redis container health: `docker ps`
- Verify DATABASE_URL and REDIS_URL env vars
- Check logs: `docker-compose -f docker-compose.test.yml logs`

### "Trivy scan blocked deployment"
- Review scan results in workflow logs
- Check GitHub Security tab for details
- Update vulnerable dependencies

### "Smoke tests failed"
- Check production URL accessibility
- Verify health endpoint returns 200
- Review ECS service events

### "Image promotion skipped"
- Ensure all previous jobs succeeded
- Check workflow dependencies
- Verify AWS credentials are valid

## Key Files

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | Main deployment pipeline |
| `docker-compose.test.yml` | Ephemeral test databases |
| `scripts/smoke-tests.sh` | Production health checks |
| `Dockerfile` | Server image |
| `Dockerfile.client` | Client image |

## Emergency Procedures

### Rollback to previous stable
```bash
# 1. Find previous stable commit
git log --oneline -10

# 2. Deploy that commit's image
IMAGE_TAG="<commit-sha>"
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --force-new-deployment
```

### Disable automatic deployments
```bash
# Create .github/workflows/deploy.yml.disabled
git mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled
git commit -m "Temporarily disable auto-deploy"
git push
```

### Check deployment status
```bash
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Rollout:deployments[0].rolloutState}'
```

## Monitoring URLs

- **GitHub Actions**: `https://github.com/YOUR_ORG/mangu2-publishing/actions`
- **GitHub Security**: `https://github.com/YOUR_ORG/mangu2-publishing/security`
- **AWS Console**: `https://console.aws.amazon.com/ecs/v2/clusters/mangu-publishing-cluster-production`
- **CloudWatch Logs**: `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups`

---

**Need help?** See full documentation: [`docs/ci-cd-pipeline-upgrade.md`](./ci-cd-pipeline-upgrade.md)
