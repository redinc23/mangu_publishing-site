# Troubleshooting Guide

## Quick Diagnostic Commands

```bash
# Check all service status
./scripts/health-check.sh

# View recent errors
aws logs filter-log-events \
  --log-group-name /ecs/mangu-publishing-server-production \
  --start-time $(($(date +%s) - 3600))000 \
  --filter-pattern "ERROR"

# Check ECS service health
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Events:events[:5]}'
```

## Common Issues

### Issue: 502 Bad Gateway

**Symptoms:**
- Users see 502 error
- ALB cannot reach backend

**Diagnosis:**
```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Check ECS tasks
aws ecs list-tasks --cluster mangu-publishing-cluster-production
aws logs tail /ecs/mangu-publishing-server-production --since 5m
```

**Common Causes:**
1. Tasks failed health checks
2. All tasks crashed
3. Security group misconfiguration

**Resolution:**
```bash
# Force new deployment
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --force-new-deployment

# If persists, check security groups
aws ec2 describe-security-groups --group-ids <sg-id>
```

### Issue: Database Connection Timeout

**Symptoms:**
- "Connection timeout" in logs
- Health check shows database disconnected
- 503 errors

**Diagnosis:**
```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBInstances[0].DBInstanceStatus'

# Check security group
aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBInstances[0].VpcSecurityGroups'

# Test connection from ECS task
aws ecs execute-command \
  --cluster mangu-publishing-cluster-production \
  --task <task-id> \
  --container server \
  --interactive \
  --command "pg_isready -h <db-host> -p 5432"
```

**Resolution:**
1. Verify DATABASE_URL in Secrets Manager
2. Check security group allows port 5432 from ECS tasks
3. Verify RDS is in same VPC as ECS tasks
4. Check connection pool settings

### Issue: High Response Time

**Symptoms:**
- Slow page loads
- Timeouts
- High latency metrics

**Diagnosis:**
```bash
# Check ALB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=<lb-name> \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# Check database performance
aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBInstances[0].PerformanceInsightsEnabled'

# Check slow queries
aws logs filter-log-events \
  --log-group-name /aws/rds/instance/mangu-publishing-db-production/postgresql \
  --filter-pattern "duration"
```

**Resolution:**
1. Scale up ECS tasks
2. Add database indexes
3. Enable Redis caching
4. Optimize slow queries

### Issue: Memory Leak

**Symptoms:**
- Memory usage constantly increasing
- OOMKilled tasks
- Tasks restarting frequently

**Diagnosis:**
```bash
# Check memory utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=mangu-publishing-server-production \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum

# Check task stopped reason
aws ecs describe-tasks \
  --cluster mangu-publishing-cluster-production \
  --tasks <task-arn> \
  --query 'tasks[0].stoppedReason'
```

**Resolution:**
1. Increase task memory temporarily
2. Review application code for memory leaks
3. Enable memory profiling
4. Restart tasks to clear memory

### Issue: Redis Connection Failed

**Symptoms:**
- "ECONNREFUSED" errors
- Cache misses
- Degraded performance

**Diagnosis:**
```bash
# Check Redis status
aws elasticache describe-replication-groups \
  --replication-group-id mangu-redis-production \
  --query 'ReplicationGroups[0].Status'

# Check connectivity
aws ecs execute-command \
  --cluster mangu-publishing-cluster-production \
  --task <task-id> \
  --container server \
  --interactive \
  --command "redis-cli -h <redis-host> -p 6379 -a <auth-token> ping"
```

**Resolution:**
1. Verify REDIS_URL in Secrets Manager
2. Check security group allows port 6379
3. Verify auth token is correct
4. Temporarily disable Redis with DISABLE_REDIS=1

### Issue: Deployment Stuck

**Symptoms:**
- Deployment shows "IN_PROGRESS" for >15 minutes
- New tasks not starting
- Old tasks not stopping

**Diagnosis:**
```bash
# Check deployment status
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query 'services[0].deployments'

# Check service events
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query 'services[0].events[:10]'
```

**Resolution:**
```bash
# Stop old tasks manually
aws ecs list-tasks \
  --cluster mangu-publishing-cluster-production \
  --service-name mangu-publishing-server-production \
  --desired-status RUNNING | \
  jq -r '.taskArns[]' | \
  head -n 1 | \
  xargs -I {} aws ecs stop-task --cluster mangu-publishing-cluster-production --task {}

# If still stuck, force new deployment
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --force-new-deployment
```

### Issue: SSL Certificate Error

**Symptoms:**
- "Certificate expired" error
- Browser warnings
- HTTPS not working

**Diagnosis:**
```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn <certificate-arn> \
  --query 'Certificate.{Status:Status,NotAfter:NotAfter}'

# Check ALB listener
aws elbv2 describe-listeners \
  --load-balancer-arn <alb-arn> \
  --query 'Listeners[?Protocol==`HTTPS`].Certificates'
```

**Resolution:**
1. Renew certificate in ACM (auto-renews if DNS validation configured)
2. Update ALB listener with new certificate
3. Verify DNS records for certificate validation

### Issue: CloudFront Not Updating

**Symptoms:**
- Old content still serving
- Code changes not reflected
- Stale cache

**Resolution:**
```bash
# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"

# Check invalidation status
aws cloudfront get-invalidation \
  --distribution-id <distribution-id> \
  --id <invalidation-id>

# Verify cache headers
curl -I https://mangu-publishing.com | grep -i cache
```

## Debugging Tools

### Enable ECS Exec for Shell Access

```bash
# Enable execute command on service
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --enable-execute-command

# Connect to running task
TASK_ARN=$(aws ecs list-tasks \
  --cluster mangu-publishing-cluster-production \
  --service-name mangu-publishing-server-production \
  --desired-status RUNNING \
  --query 'taskArns[0]' \
  --output text)

aws ecs execute-command \
  --cluster mangu-publishing-cluster-production \
  --task $TASK_ARN \
  --container server \
  --interactive \
  --command "/bin/sh"
```

### CloudWatch Logs Insights Queries

```sql
-- Find all errors in last hour
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

-- Slow API requests
fields @timestamp, request_duration, endpoint
| filter request_duration > 1000
| sort request_duration desc
| limit 50

-- Database query performance
fields @timestamp, query, duration
| filter query like /SELECT/
| stats avg(duration), max(duration), count() by query
| sort avg(duration) desc
```

### Health Check Script

Create `scripts/health-check.sh`:
```bash
#!/bin/bash
echo "Health Check Summary"
echo "==================="

# ECS Services
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production mangu-publishing-client-production \
  --query 'services[*].{Name:serviceName,Running:runningCount,Desired:desiredCount}'

# RDS
aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBInstances[0].{Status:DBInstanceStatus,Engine:Engine}'

# Redis
aws elasticache describe-replication-groups \
  --replication-group-id mangu-redis-production \
  --query 'ReplicationGroups[0].{Status:Status,Nodes:NodeGroups[0].NodeGroupMembers[*].CurrentRole}'

# ALB Target Health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn> \
  --query 'TargetHealthDescriptions[*].{Target:Target.Id,Health:TargetHealth.State}'
```

## Escalation Path

1. **Check runbooks**: deployment.md, rollback.md, scaling.md
2. **Check logs**: CloudWatch Logs
3. **Check metrics**: CloudWatch Metrics
4. **Rollback if needed**: See rollback.md
5. **Contact on-call engineer**: [contact info]
6. **AWS Support**: Open support case if AWS service issue

## Related Documentation

- [Deployment Runbook](./deployment.md)
- [Rollback Runbook](./rollback.md)
- [Scaling Runbook](./scaling.md)
- [Infrastructure Documentation](../INFRASTRUCTURE.md)
