# Rollback Runbook

## Quick Rollback

### Automatic Rollback (Fastest)

ECS has circuit breaker enabled - it will automatically rollback if deployment fails.

Monitor automatic rollback:
```bash
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query 'services[0].deployments'
```

### Manual Rollback via GitHub Actions

1. Go to GitHub Actions
2. Find last successful deployment
3. Click "Re-run all jobs"

### Command-Line Rollback

```bash
# Get previous task definition
PREVIOUS_TASK_DEF=$(aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query 'services[0].taskDefinition' \
  --output text | sed 's/:.*//'):$(($(aws ecs describe-services \
    --cluster mangu-publishing-cluster-production \
    --services mangu-publishing-server-production \
    --query 'services[0].taskDefinition' \
    --output text | sed 's/.*://') - 1))

# Rollback
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --task-definition $PREVIOUS_TASK_DEF \
  --force-new-deployment

# Wait for stability
aws ecs wait services-stable \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production
```

## Rollback Scenarios

### Scenario 1: Application Error After Deployment

**Symptoms:**
- 5xx errors in logs
- Failed health checks
- Application crashes

**Action:**
1. Identify the issue
   ```bash
   aws logs tail /ecs/mangu-publishing-server-production --since 5m | grep ERROR
   ```

2. Rollback to previous version
   ```bash
   # Use command-line rollback above
   ```

3. Verify rollback
   ```bash
   ./scripts/smoke-tests.sh https://mangu-publishing.com
   ```

### Scenario 2: Database Migration Failure

**Symptoms:**
- Database connection errors
- Migration errors in logs
- Data inconsistency

**Action:**
1. Stop application
   ```bash
   aws ecs update-service \
     --cluster mangu-publishing-cluster-production \
     --service mangu-publishing-server-production \
     --desired-count 0
   ```

2. Rollback database migration
   ```bash
   # Connect to database
   psql $DATABASE_URL
   
   # List migrations
   SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;
   
   # Rollback last migration
   npm --prefix server run migrate:rollback
   ```

3. Restore from backup if needed
   ```bash
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier mangu-db-recovery \
     --db-snapshot-identifier pre-migration-YYYYMMDD-HHMMSS
   ```

4. Rollback application
   ```bash
   # Use command-line rollback above
   ```

5. Restart application
   ```bash
   aws ecs update-service \
     --cluster mangu-publishing-cluster-production \
     --service mangu-publishing-server-production \
     --desired-count 2
   ```

### Scenario 3: Performance Degradation

**Symptoms:**
- High response times
- CPU/Memory spikes
- Timeout errors

**Action:**
1. Quick mitigation - scale up
   ```bash
   aws ecs update-service \
     --cluster mangu-publishing-cluster-production \
     --service mangu-publishing-server-production \
     --desired-count 4
   ```

2. If scaling doesn't help, rollback
   ```bash
   # Use command-line rollback above
   ```

3. Investigate root cause
   ```bash
   # Check metrics
   aws cloudwatch get-metric-statistics \
     --namespace AWS/ECS \
     --metric-name CPUUtilization \
     --dimensions Name=ServiceName,Value=mangu-publishing-server-production \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Average,Maximum
   ```

### Scenario 4: Breaking Frontend Change

**Symptoms:**
- UI not loading
- JavaScript errors
- Blank pages

**Action:**
1. Rollback client
   ```bash
   PREVIOUS_CLIENT_TASK_DEF=$(aws ecs describe-services \
     --cluster mangu-publishing-cluster-production \
     --services mangu-publishing-client-production \
     --query 'services[0].taskDefinition' \
     --output text | sed 's/:.*//'):$(($(aws ecs describe-services \
       --cluster mangu-publishing-cluster-production \
       --services mangu-publishing-client-production \
       --query 'services[0].taskDefinition' \
       --output text | sed 's/.*://') - 1))
   
   aws ecs update-service \
     --cluster mangu-publishing-cluster-production \
     --service mangu-publishing-client-production \
     --task-definition $PREVIOUS_CLIENT_TASK_DEF \
     --force-new-deployment
   ```

2. Invalidate CloudFront cache
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id <distribution-id> \
     --paths "/*"
   ```

3. Verify
   ```bash
   curl -I https://mangu-publishing.com
   ```

### Scenario 5: Infrastructure Issue

**Symptoms:**
- Tasks can't be scheduled
- Network connectivity issues
- AWS service outages

**Action:**
1. Check AWS Service Health
   ```bash
   aws health describe-events --filter eventTypeCategories=issue
   ```

2. If infrastructure change caused issue, rollback Terraform
   ```bash
   cd infrastructure/terraform
   git checkout HEAD~1
   terraform plan
   terraform apply
   ```

3. If AWS service outage, wait or failover to different region

## Rollback Verification

### Post-Rollback Checklist

- [ ] Application starts successfully
- [ ] Health checks passing
- [ ] Smoke tests passing
- [ ] Database connectivity confirmed
- [ ] Cache connectivity confirmed
- [ ] Critical user flows working
- [ ] Error rates normal
- [ ] Response times normal

### Verification Commands

```bash
# Health check
curl https://mangu-publishing.com/api/health | jq

# Smoke tests
./scripts/smoke-tests.sh https://mangu-publishing.com

# Check service status
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'

# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=<load-balancer-name> \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# Check error rates
aws logs filter-log-events \
  --log-group-name /ecs/mangu-publishing-server-production \
  --start-time $(($(date +%s) - 600))000 \
  --filter-pattern "ERROR"
```

## Database Rollback

### Rollback Single Migration

```bash
# Connect to database
psql $DATABASE_URL

# Show recent migrations
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 10;

# Rollback one migration
npm --prefix server run migrate:rollback

# Verify
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 10;
```

### Restore from Snapshot

```bash
# List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# Restore to new instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mangu-db-rollback \
  --db-snapshot-identifier pre-migration-YYYYMMDD-HHMMSS

# Wait for restore
aws rds wait db-instance-available \
  --db-instance-identifier mangu-db-rollback

# Update application to point to new database
# (update Secrets Manager secret)

# After verification, rename instances
# (requires downtime - plan carefully)
```

## Rollback Testing

### Pre-Production Rollback Test

Perform rollback test in staging:

```bash
# Deploy to staging
# ... deployment steps ...

# Immediately rollback
# ... rollback steps ...

# Verify rollback works
# ... verification steps ...
```

## Post-Rollback Actions

1. **Document Incident**
   - What went wrong
   - When it was detected
   - How it was resolved
   - Duration of impact

2. **Root Cause Analysis**
   - Why did the deployment fail
   - What tests missed the issue
   - How to prevent in future

3. **Update Procedures**
   - Add new checks
   - Update documentation
   - Improve testing

4. **Team Communication**
   - Notify stakeholders
   - Share lessons learned
   - Update runbooks

## Emergency Contacts

- **On-Call Engineer**: [phone/slack]
- **Database Admin**: [phone/slack]
- **DevOps Lead**: [phone/slack]
- **AWS Support**: [support case portal]

## Related Documentation

- [Deployment Runbook](./deployment.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Database Migration Guide](../database-migrations.md)
