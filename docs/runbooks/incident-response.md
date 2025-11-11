# Incident Response Runbook

## Severity Levels

- **P0 (Critical)**: Complete service outage, data loss
- **P1 (High)**: Major feature broken, significant degradation
- **P2 (Medium)**: Minor feature broken, workaround available
- **P3 (Low)**: Cosmetic issues, minimal impact

## Incident Response Process

### 1. Detection & Triage (0-5 minutes)

#### Identify the Issue

```bash
# Check overall health
curl https://api.mangu-publishing.com/api/health

# Check CloudWatch alarms
aws cloudwatch describe-alarms \
  --state-value ALARM \
  --query 'MetricAlarms[?Namespace==`AWS/ECS`]'

# Check recent deployments
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query 'services[0].events[0:5]'
```

#### Severity Assessment

1. **Is the main site accessible?**
   - No → P0
   - Yes, degraded → P1
   - Yes, partial features down → P2

2. **Are transactions processing?**
   - No → P0
   - Delayed → P1
   - Some failing → P2

3. **Data loss occurring?**
   - Yes → P0 (IMMEDIATE ACTION)
   - No → Assess based on functionality

### 2. Initial Response (5-15 minutes)

#### P0: Critical Incident

```bash
# Immediate notification
echo "P0 INCIDENT - Send to all on-call staff"

# Quick health check
./scripts/smoke-tests.sh https://api.mangu-publishing.com

# Check recent changes
git log -5 --oneline main

# If recent deployment, rollback immediately
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --task-definition <previous-version>
```

#### P1: High Priority

```bash
# Gather diagnostics
aws logs tail /ecs/mangu-publishing-server-production --since 15m > incident-logs.txt

# Check error rates
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_Target_5XX_Count \
  --dimensions Name=LoadBalancer,Value=<alb-name> \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum
```

### 3. Common Incidents

#### 3.1 Database Connection Failure

**Symptoms**:
- Health endpoint shows database: "disconnected"
- 503 errors on all API endpoints
- Logs show "connection timeout" or "too many connections"

**Diagnosis**:
```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]'

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
psql $DATABASE_URL -c "
  SELECT pid, now() - query_start as duration, query 
  FROM pg_stat_activity 
  WHERE state = 'active' 
  ORDER BY duration DESC 
  LIMIT 10;"
```

**Resolution**:
```bash
# If too many connections, restart ECS tasks
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --force-new-deployment

# If long-running queries, terminate them
psql $DATABASE_URL -c "SELECT pg_terminate_backend(<pid>);"

# If RDS is down, check for maintenance or failover to standby
aws rds describe-events \
  --source-identifier mangu-publishing-db-production \
  --duration 60
```

#### 3.2 Memory/CPU Exhaustion

**Symptoms**:
- Slow response times
- Tasks restarting frequently
- High CloudWatch metrics

**Diagnosis**:
```bash
# Check ECS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=mangu-publishing-server-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# Check for memory leaks in logs
aws logs filter-pattern "heap" \
  --log-group-name /ecs/mangu-publishing-server-production \
  --start-time $(date -d '1 hour ago' +%s)000
```

**Resolution**:
```bash
# Scale up service temporarily
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --desired-count 4

# Or increase task resources (update task definition)
# Then investigate root cause (memory leak, inefficient queries, etc.)
```

#### 3.3 Redis Cache Failure

**Symptoms**:
- Slow response times
- Health shows cache: "disconnected"
- Increased database load

**Diagnosis**:
```bash
# Check ElastiCache status
aws elasticache describe-cache-clusters \
  --cache-cluster-id mangu-publishing-cache-production \
  --show-cache-node-info

# Test Redis connection
redis-cli -h <redis-endpoint> -p 6379 PING
```

**Resolution**:
```bash
# Redis is optional - service should degrade gracefully
# If needed, restart Redis cluster
aws elasticache reboot-cache-cluster \
  --cache-cluster-id mangu-publishing-cache-production \
  --cache-node-ids-to-reboot <node-id>

# Or bypass Redis temporarily by setting environment variable
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --task-definition <task-def-with-DISABLE_REDIS=1>
```

#### 3.4 Application Error Spike

**Symptoms**:
- Increased 500 errors
- Specific endpoint failing
- Recent deployment

**Diagnosis**:
```bash
# Get recent error logs
aws logs filter-pattern "ERROR" \
  --log-group-name /ecs/mangu-publishing-server-production \
  --start-time $(date -d '15 minutes ago' +%s)000 \
  | head -50

# Check ALB error rates by target
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=<alb-name> \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum
```

**Resolution**:
```bash
# If recent deployment, rollback
# See deployment runbook for rollback procedure

# If specific endpoint, disable it temporarily via feature flag
# Or apply hotfix
```

#### 3.5 S3 Upload Failure

**Symptoms**:
- Users can't upload images
- Logs show S3 access denied or timeout

**Diagnosis**:
```bash
# Check S3 bucket status
aws s3api head-bucket --bucket mangu-uploads-production

# Test IAM permissions
aws s3 ls s3://mangu-uploads-production/

# Check for service issues
aws health describe-events \
  --filter eventTypeCategories=issue \
  --query 'events[?service==`S3`]'
```

**Resolution**:
```bash
# Check IAM role permissions
aws iam get-role-policy \
  --role-name mangu-ecs-task-role-production \
  --policy-name S3Access

# If permissions issue, update policy
# If S3 down, wait for AWS resolution or use alternative region
```

### 4. Communication

#### Internal Communication

```
INCIDENT ALERT - [P0/P1/P2]

Summary: [One line description]
Impact: [What's affected]
Status: [Investigating/Identified/Monitoring/Resolved]
Started: [Timestamp]
ETA: [If known]

Current Actions:
- [Action 1]
- [Action 2]

Next Update: [Time]
```

#### External Communication (if needed)

For P0/P1 incidents affecting users:

```
We're currently experiencing issues with [service/feature].
Our team is actively working on a resolution.
Updates: https://status.mangu-publishing.com
```

### 5. Resolution & Post-Incident

#### Verify Resolution

```bash
# Run full smoke test suite
./scripts/smoke-tests.sh https://api.mangu-publishing.com

# Check metrics have normalized
# Monitor for 30 minutes before declaring resolved
```

#### Post-Incident Report

Create within 24-48 hours:

1. **Timeline**: Chronological events
2. **Root Cause**: What actually happened
3. **Impact**: Users/systems affected, duration
4. **Resolution**: How it was fixed
5. **Action Items**: Prevent recurrence

Template: `docs/incidents/YYYY-MM-DD-incident-name.md`

### 6. Monitoring & Alerts

#### Key Metrics to Monitor

```bash
# Health check status
# Error rates (5xx responses)
# Response times (p95, p99)
# Database connection pool usage
# Memory/CPU utilization
# Task restart count
```

#### Alert Thresholds

- 5xx errors > 1% for 5 minutes → P1
- Response time p99 > 3s for 10 minutes → P2
- Health check failures > 3 consecutive → P0
- Memory usage > 85% for 15 minutes → P2
- Task restart count > 3 in 10 minutes → P1

## Quick Reference

### Critical Commands

```bash
# Rollback deployment
./scripts/rollback.sh production

# Scale up services
aws ecs update-service --desired-count 6

# Check logs
aws logs tail /ecs/mangu-publishing-server-production --follow

# Restart service
aws ecs update-service --force-new-deployment

# Database connection count
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

### Emergency Contacts

- **On-Call Engineer**: [Pager/Phone]
- **DevOps Lead**: [Contact]
- **CTO**: [Contact]
- **AWS Support**: [Support Plan Number]

## Related Documentation

- [Deployment Runbook](./deployment.md)
- [Database Operations](./database-operations.md)
- [Infrastructure Docs](../INFRASTRUCTURE.md)
