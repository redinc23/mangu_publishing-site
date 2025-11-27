# Deployment Gates & Promotion Logic

This document describes the automated promotion logic and manual approval gates for production deployments.

## Overview

The deployment workflow (`deploy.yml`) includes automatic and manual gates to ensure only healthy, tested code reaches production.

## Automated Gates

### 1. Pre-Deployment Tests (Blocking)
All tests must pass before deployment begins:
- **Unit tests**: Client and server test suites
- **Integration tests**: Full stack with Postgres and Redis
- **Security scan**: npm audit for high/critical vulnerabilities
- **Build validation**: Docker images build successfully
- **Container scanning**: Trivy scans for vulnerabilities

### 2. Post-Deployment Smoke Tests (Validation)
After deployment, smoke tests verify:
- `/api/health` endpoint responds with 200
- Database connectivity
- Redis connectivity
- Critical API endpoints respond correctly

**Behavior:**
- ✅ **Pass**: Deployment is marked successful, commit comment created
- ❌ **Fail**: ECS Circuit Breaker automatically rolls back to previous version

### 3. ECS Circuit Breaker (Automatic Rollback)
AWS ECS monitors:
- Task health checks (ALB target health)
- Deployment progress
- Failed task launches

**If issues detected:**
- Deployment automatically rolled back
- Previous task definition restored
- CloudWatch logs captured
- GitHub notification sent

## Manual Approval Gates

### Setting Up Production Environment Protection

To require manual approval before production deployments:

#### 1. Configure GitHub Environment

```bash
# Navigate to repository settings
https://github.com/YOUR_ORG/mangu2-publishing/settings/environments

# Or use GitHub CLI
gh api repos/:owner/:repo/environments/production -X PUT -f wait_timer=0 -f prevent_self_review=true
```

#### 2. Add Required Reviewers

In GitHub UI:
1. Go to **Settings** → **Environments** → **production**
2. Check **Required reviewers**
3. Add team members who can approve deployments
4. Set **Wait timer** (optional): Delay deployment by X minutes
5. Check **Prevent self-review** (recommended)

#### 3. Add Deployment Protection Rules (GitHub Enterprise)

For advanced control:
- Require specific teams to approve
- Require branch protection rules to pass
- Require status checks from external systems
- Custom deployment protection rules via GitHub Apps

### Approval Workflow

1. Developer pushes to `main` branch
2. All automated tests run (unit, integration, security)
3. Docker images build and scan
4. **⏸️ Workflow pauses** waiting for approval
5. Designated reviewer receives notification
6. Reviewer checks:
   - Test results in workflow logs
   - Security scan results
   - PR description and changes
7. Reviewer approves or rejects
8. **On approval**: Deployment proceeds
9. Smoke tests validate deployment
10. Success/failure notification sent

### Manual Override

If you need to bypass smoke tests (not recommended):

```bash
# Use workflow_dispatch with manual flag
gh workflow run deploy.yml -f skip_smoke_tests=true
```

This requires updating `deploy.yml` to support the flag:

```yaml
on:
  workflow_dispatch:
    inputs:
      skip_smoke_tests:
        description: 'Skip smoke tests (emergency only)'
        required: false
        default: 'false'
```

## Rollback Procedures

### Automatic Rollback (ECS Circuit Breaker)
- Triggers on: Health check failures, deployment timeouts
- Reverts to: Previous stable task definition
- Notifications: GitHub commit comment, CloudWatch alarm

### Manual Rollback
See [docs/runbooks/rollback.md](./runbooks/rollback.md)

```bash
# Quick rollback to previous deployment
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --task-definition mangu-publishing-server-production:PREVIOUS_REVISION

# Or use the rollback workflow
gh workflow run rollback.yml
```

## Monitoring Deployment Health

### CloudWatch Dashboards
- **Cost Dashboard**: `mangu-publishing-cost-dashboard-production`
- **Application Metrics**: ECS CPU/Memory, ALB request rates
- **Error Rates**: 4xx, 5xx responses

### Alarms
- `mangu-publishing-cloudfront-5xx-errors`: CloudFront origin errors
- `mangu-publishing-ecs-high-cpu`: ECS task CPU > 80%
- `mangu-publishing-alb-target-health`: Unhealthy targets

### Logs
```bash
# View deployment logs
aws logs tail /ecs/mangu-publishing-cluster-production --follow

# Check smoke test results
gh run view --log | grep "smoke"
```

## Promotion Criteria

Deployments are automatically promoted when:
- ✅ All pre-deployment tests pass
- ✅ Docker images build successfully
- ✅ Container scans show no critical vulnerabilities
- ✅ Database migrations complete
- ✅ ECS services stabilize (all tasks healthy)
- ✅ Smoke tests pass
- ✅ Manual approval granted (if configured)

## Best Practices

1. **Always wait for smoke tests**: Don't manually approve until smoke tests finish
2. **Review security scans**: Check Trivy results before approving
3. **Monitor during deployment**: Watch CloudWatch logs in real-time
4. **Have rollback plan**: Know how to rollback before deploying
5. **Test in staging first**: Use preview environments for risky changes
6. **Incremental rollouts**: For major changes, deploy to subset of tasks first

## Troubleshooting

### Smoke Tests Failing
```bash
# Check application logs
aws logs tail /ecs/mangu-publishing-cluster-production/server --follow

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups \
    --names mangu-publishing-srv-production \
    --query 'TargetGroups[0].TargetGroupArn' --output text)
```

### Circuit Breaker Not Triggering
- Verify ECS service has circuit breaker enabled:
  ```bash
  aws ecs describe-services \
    --cluster mangu-publishing-cluster-production \
    --services mangu-publishing-server-production \
    --query 'services[0].deploymentConfiguration.deploymentCircuitBreaker'
  ```

### Manual Approval Stuck
- Check GitHub Actions UI for pending approval
- Verify approver has correct permissions
- Check if wait timer is delaying deployment

## Configuration Files

- **Workflow**: `.github/workflows/deploy.yml`
- **Smoke Tests**: `scripts/smoke-tests.sh`
- **Rollback Workflow**: `.github/workflows/rollback.yml`
- **Environment Config**: GitHub Settings → Environments → production

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Rollback Runbook](./runbooks/rollback.md)
- [CI/CD Pipeline Reference](./ci-cd-quick-reference.md)
- [Infrastructure Guide](./INFRASTRUCTURE.md)
