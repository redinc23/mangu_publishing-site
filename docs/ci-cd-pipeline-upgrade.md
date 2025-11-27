# CI/CD Pipeline Upgrade Documentation

**Status**: ✅ Implemented  
**Last Updated**: 2024-11-11  
**Version**: 2.0

## Overview

The deployment pipeline has been upgraded with enterprise-grade features including advanced caching, E2E testing, automated rollback, secret management, and comprehensive monitoring.

## Quick Navigation

- [Build & Dependency Caching](#1-dependency-caching)
- [End-to-End Testing](#e2e-testing-stage)
- [Automated Promotion & Rollback](#automated-promotion--rollback)
- [Secret Management](#secret-automation)
- [Disaster Recovery](./runbooks/backup-and-dr.md)

## New Pipeline Architecture

### Job Flow

```
test (unit tests, lint, typecheck)
  ↓
integration-tests (ephemeral Postgres/Redis)
  ↓
security-scan (Snyk + npm audit)
  ↓
build-and-push (Docker build with cache, Trivy scan, ECR push)
  ↓
deploy (ECS deployment)
  ↓
smoke-tests (health checks)
  ↓
performance-tests (Lighthouse CI + baseline)
  ↓
promote-images (tag as 'stable' + timestamped)
```

## Key Features

### 1. Dependency Caching

**Location:** All jobs with npm dependencies

**Benefits:**
- Faster job execution (30-70% reduction in install time)
- Reduced GitHub Actions minutes consumption
- Separate caches for client and server workspaces

**Implementation:**
```yaml
- name: Cache client node_modules
  uses: actions/cache@v4
  with:
    path: client/node_modules
    key: ${{ runner.os }}-client-${{ hashFiles('client/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-client-
```

### 2. Integration Testing with Ephemeral Databases

**Location:** `integration-tests` job

**Components:**
- PostgreSQL 16 (tmpfs for speed)
- Redis 7 (tmpfs for speed)
- Automatic cleanup after tests

**Configuration:** `docker-compose.test.yml`

**Benefits:**
- Real database testing without persistent state
- Fast execution with in-memory storage
- Parallel execution safe (isolated containers)

**Usage:**
```bash
# Local development
docker-compose -f docker-compose.test.yml up -d
npm --prefix server run test:integration
docker-compose -f docker-compose.test.yml down -v
```

### 3. Auto-Promotion After Smoke Tests

**Location:** `promote-images` job

**Promotion Strategy:**
- Only runs after successful smoke tests and performance tests
- Creates multiple tags for rollback flexibility:
  - `stable` - current production version
  - `production-YYYYMMDD-HHMMSS` - timestamped for audit trail
  - `latest` - most recent build (already exists)
  - `<commit-sha>` - original build tag (already exists)

**Benefits:**
- Clear production version identification
- Easy rollback to any previous stable version
- Immutable audit trail of deployments

### 4. Security Scanning

**Location:** `security-scan` job and within `build-and-push` job

**Scanners:**

#### Snyk (Dependency Scanning)
- Scans all workspaces
- Checks for known vulnerabilities
- Severity threshold: HIGH
- Continues on error to not block critical fixes

#### npm audit
- Runs on root, server, and client workspaces
- Identifies vulnerabilities in dependencies
- Audit level: HIGH

#### Trivy (Container Scanning)
- Scans both server and client Docker images
- Checks for OS and application vulnerabilities
- Results uploaded to GitHub Security tab
- Severity: CRITICAL, HIGH
- SARIF format for GitHub integration

**Benefits:**
- Multi-layered security coverage
- Early detection of vulnerabilities
- Automated security reporting
- GitHub Security tab integration

### 5. Performance Testing

**Location:** `performance-tests` job

**Components:**

#### Lighthouse CI
- Runs 3 times for consistency
- Tests against production URL
- Checks: Performance, Accessibility, Best Practices, SEO
- Uses recommended preset
- Results stored in temporary public storage

#### cURL Performance Baseline
- Measures actual response times:
  - DNS lookup time
  - Connection time
  - TLS handshake time
  - Time to first byte
  - Total request time

**Benefits:**
- Catch performance regressions before users notice
- Objective performance metrics
- SEO and accessibility validation
- Historical performance tracking

## Docker Build Optimization

### BuildKit and Buildx

**Features:**
- Multi-stage build caching
- GitHub Actions cache backend (`type=gha`)
- Parallel layer builds
- Efficient layer reuse

**Benefits:**
- 40-60% faster builds on cache hit
- Reduced network transfer
- Lower ECR storage costs

### Cache Strategy

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

- `mode=max` - caches all layers, not just final stage
- Shared across workflow runs
- Automatic cleanup by GitHub

## Notification System

### Success Notification

**Trigger:** After successful image promotion

**Content:**
- Commit and branch information
- Workflow run link
- Status checklist
- Image tags
- Production URL

**Delivery:** GitHub commit comment

### Failure Notification

**Trigger:** Any job failure

**Content:**
- Failure context
- CloudWatch log paths
- Rollback instructions
- ECS service status

**Features:**
- AWS credentials configured for ECS status check
- Automatic ECS Circuit Breaker detection
- Links to runbook documentation

## Environment Variables Required

### Secrets

```bash
# AWS
AWS_ROLE_ARN              # IAM role for OIDC authentication
DATABASE_URL              # Production database connection string
PRODUCTION_URL            # Production application URL
VITE_API_URL              # Frontend API endpoint

# Security Scanning
SNYK_TOKEN                # Snyk API token (optional but recommended)
```

### Environment Variables (in workflow)

```yaml
AWS_REGION: us-east-1
ECR_SERVER_REPOSITORY: mangu-publishing/server
ECR_CLIENT_REPOSITORY: mangu-publishing/client
ECS_CLUSTER: mangu-publishing-cluster-production
ECS_SERVER_SERVICE: mangu-publishing-server-production
ECS_CLIENT_SERVICE: mangu-publishing-client-production
```

## Rollback Procedures

### Automatic Rollback

**ECS Circuit Breaker:**
- Monitors deployment health checks
- Automatic rollback on failures
- Preserves previous task definition

### Manual Rollback

**Using stable tag:**
```bash
# Deploy previous stable version
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --task-definition mangu-server:stable
```

**Using timestamped tag:**
```bash
# List available production tags
aws ecr describe-images \
  --repository-name mangu-publishing/server \
  --filter "tagStatus=TAGGED" \
  --query 'imageDetails[*].imageTags' \
  --output table

# Deploy specific timestamp
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --force-new-deployment \
  --task-definition mangu-server:production-20250111-120000
```

## Local Testing

### Test the integration test setup:
```bash
# Start test databases
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
cd server
npm run test:integration

# Cleanup
docker-compose -f docker-compose.test.yml down -v
```

### Test smoke tests:
```bash
# Start local services (PostgreSQL and Redis)
brew services start postgresql@16
brew services start redis

# Start development servers
npm run dev

# Run smoke tests against local
./scripts/smoke-tests.sh http://localhost:3001
```

### Test Docker builds with cache:
```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with cache
docker build --cache-from=mangu-server:latest \
  -t mangu-server:test \
  -f Dockerfile .
```

## Performance Benchmarks

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Install time (cache hit) | 45s | 15s | 67% |
| Install time (cache miss) | 45s | 40s | 11% |
| Build time (cache hit) | 180s | 60s | 67% |
| Build time (cache miss) | 180s | 150s | 17% |
| Total pipeline time | 8-10 min | 6-7 min | 25% |

### GitHub Actions Minutes Savings

- Average monthly runs: ~150 (5/day)
- Minutes saved per run: ~3 minutes
- Monthly savings: ~450 minutes
- Annual savings: ~5,400 minutes

## Monitoring and Alerts

### GitHub Security Tab

- Trivy scan results automatically uploaded
- Vulnerability tracking and management
- Dependency graph integration
- Automated security advisories

### CloudWatch Integration

**Log groups:**
- `/ecs/mangu-publishing-cluster-production/server`
- `/ecs/mangu-publishing-cluster-production/client`

**Metrics to watch:**
- Deployment success rate
- Average deployment time
- Image vulnerability count
- Performance test scores

## Troubleshooting

### Integration tests fail

**Issue:** Postgres container not ready
**Solution:** Increase healthcheck timeout in `docker-compose.test.yml`

### Trivy scan timeout

**Issue:** Large images cause scan timeout
**Solution:** Increase timeout or split into separate job

### Cache not working

**Issue:** Cache key mismatch
**Solution:** Verify `package-lock.json` is committed and unchanged

### Lighthouse CI fails

**Issue:** Production site not accessible
**Solution:** Verify `PRODUCTION_URL` secret and DNS configuration

### Image promotion fails

**Issue:** AWS credentials expired
**Solution:** Verify OIDC configuration and IAM role trust policy

## Next Steps

### Recommended Enhancements

1. **Code Coverage Reports**
   - Add coverage collection to test jobs
   - Upload to Codecov or similar
   - Enforce coverage thresholds

2. **Preview Environments**
   - Deploy PR branches to isolated environments
   - Automated teardown after merge
   - Integration with GitHub Checks

3. **Load Testing**
   - k6 or Artillery for load testing
   - Run on staging before production
   - Performance regression detection

4. **Advanced Rollback**
   - Blue/green deployments
   - Canary releases
   - Automated rollback on metric degradation

5. **Enhanced Monitoring**
   - Datadog or New Relic integration
   - Custom metrics from application
   - Real-user monitoring (RUM)

## References

- [GitHub Actions Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Docker Buildx](https://docs.docker.com/buildx/working-with-buildx/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [ECS Circuit Breaker](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html)

---

**Last Updated:** 2025-11-11
**Pipeline Version:** 2.0
**Maintained By:** DevOps Team
