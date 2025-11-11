# Deployment Runbook

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Secrets updated in AWS Secrets Manager
- [ ] Backup taken
- [ ] Team notified

## Standard Deployment

### 1. Trigger Deployment

**Option A: Automatic (Recommended)**
```bash
git checkout main
git pull origin main
git push origin main
```

**Option B: Manual via GitHub Actions**
1. Go to Actions tab
2. Select "Deploy to Production"
3. Click "Run workflow"

### 2. Monitor Deployment

```bash
# Watch ECS service status
watch -n 5 'aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query "services[0].events[:5]"'

# Watch logs
aws logs tail /ecs/mangu-publishing-server-production --follow
```

### 3. Verify Deployment

```bash
# Run smoke tests
./scripts/smoke-tests.sh https://mangu-publishing.com

# Check health endpoint
curl https://mangu-publishing.com/api/health

# Verify database connection
curl https://mangu-publishing.com/api/health | jq '.database'

# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=mangu-publishing-server-production \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### 4. Post-Deployment

- [ ] Verify all smoke tests pass
- [ ] Check CloudWatch metrics
- [ ] Review application logs
- [ ] Test critical user flows
- [ ] Monitor for 30 minutes

## Database Migration Deployment

### Pre-Migration

```bash
# Backup database
aws rds create-db-snapshot \
  --db-instance-identifier mangu-publishing-db-production \
  --db-snapshot-identifier pre-migration-$(date +%Y%m%d-%H%M%S)

# Verify backup
aws rds describe-db-snapshots \
  --db-snapshot-identifier pre-migration-*
```

### Migration

```bash
# Scale up ECS tasks for faster migration
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --desired-count 1

# Connect to database
aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBInstances[0].Endpoint.Address'

# Run migrations
npm --prefix server run migrate

# Verify migration
psql $DATABASE_URL -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 5;"
```

### Post-Migration

```bash
# Scale back to normal
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --desired-count 2

# Run smoke tests
./scripts/smoke-tests.sh https://mangu-publishing.com
```

## Emergency Deployment

### Fast-Track Deployment (Skip Tests)

**⚠️ Use only for critical security fixes**

```bash
# Push directly to ECR
docker build -t server:hotfix -f Dockerfile .
docker tag server:hotfix <ecr-url>/mangu-publishing/server:hotfix
docker push <ecr-url>/mangu-publishing/server:hotfix

# Update ECS service
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --force-new-deployment
```

## Scheduled Maintenance Deployment

### 1. Pre-Maintenance

```bash
# Announce maintenance
echo "Maintenance scheduled for $(date)"

# Create maintenance page
aws s3 cp maintenance.html s3://mangu-static-production/maintenance.html

# Update ALB to route to maintenance page (if needed)
```

### 2. During Maintenance

```bash
# Scale down to 0
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --desired-count 0

# Perform maintenance
# (database upgrades, major version updates, etc.)

# Scale back up
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --desired-count 2
```

### 3. Post-Maintenance

```bash
# Remove maintenance page
aws s3 rm s3://mangu-static-production/maintenance.html

# Verify all services
./scripts/smoke-tests.sh https://mangu-publishing.com

# Announce completion
echo "Maintenance complete"
```

## Deployment Troubleshooting

### Issue: Tasks Failing to Start

```bash
# Check task logs
aws ecs list-tasks --cluster mangu-publishing-cluster-production
aws logs tail /ecs/mangu-publishing-server-production --since 10m

# Check task definition
aws ecs describe-task-definition \
  --task-definition mangu-publishing-server-production
```

**Common causes:**
- Invalid environment variables
- Insufficient memory/CPU
- Failed health checks
- Image pull errors

### Issue: Tasks Failing Health Checks

```bash
# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Check application logs
aws logs filter-pattern "/ecs/mangu-publishing-server-production" \
  --log-stream-names "ecs/server/*" \
  --filter-pattern "ERROR"
```

**Common causes:**
- Database connection timeout
- Application startup errors
- Port mismatch

### Issue: Deployment Stuck

```bash
# Force new deployment
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --force-new-deployment

# If still stuck, stop all tasks
aws ecs list-tasks --cluster mangu-publishing-cluster-production | \
  jq -r '.taskArns[]' | \
  xargs -I {} aws ecs stop-task --cluster mangu-publishing-cluster-production --task {}
```

## Rollback Procedures

See [rollback.md](./rollback.md) for detailed rollback procedures.

## Contact Information

- **On-Call Engineer**: [phone/slack]
- **Team Lead**: [phone/slack]
- **AWS Support**: [support plan details]

## Related Documentation

- [Rollback Runbook](./rollback.md)
- [Scaling Runbook](./scaling.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Infrastructure Documentation](../INFRASTRUCTURE.md)
