# Scaling Runbook

## Auto-Scaling Configuration

ECS services are configured with auto-scaling based on CPU utilization (70% target).

### View Current Scaling Status

```bash
# Check current task count
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query 'services[0].{Running:runningCount,Desired:desiredCount,Pending:pendingCount}'

# Check auto-scaling target
aws application-autoscaling describe-scalable-targets \
  --service-namespace ecs \
  --resource-ids service/mangu-publishing-cluster-production/mangu-publishing-server-production

# Check scaling policies
aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id service/mangu-publishing-cluster-production/mangu-publishing-server-production
```

## Manual Scaling

### Scale ECS Service

```bash
# Scale server to 4 tasks
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --desired-count 4

# Scale client to 4 tasks
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-client-production \
  --desired-count 4

# Verify scaling
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query 'services[0].{Running:runningCount,Desired:desiredCount}'
```

### Temporary Scaling for High Traffic

```bash
# Disable auto-scaling temporarily
aws application-autoscaling deregister-scalable-target \
  --service-namespace ecs \
  --resource-id service/mangu-publishing-cluster-production/mangu-publishing-server-production \
  --scalable-dimension ecs:service:DesiredCount

# Scale to handle high traffic
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --desired-count 10

# After traffic normalizes, re-enable auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/mangu-publishing-cluster-production/mangu-publishing-server-production \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

## Database Scaling

### Vertical Scaling (Resize Instance)

**⚠️ Requires brief downtime (Multi-AZ minimizes this)**

```bash
# Modify instance class
aws rds modify-db-instance \
  --db-instance-identifier mangu-publishing-db-production \
  --db-instance-class db.t3.medium \
  --apply-immediately

# Monitor modification
aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBInstances[0].DBInstanceStatus'
```

### Horizontal Scaling (Read Replicas)

```bash
# Create read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier mangu-db-read-replica-1 \
  --source-db-instance-identifier mangu-publishing-db-production \
  --db-instance-class db.t3.small

# Wait for replica to be available
aws rds wait db-instance-available \
  --db-instance-identifier mangu-db-read-replica-1

# Update application to use read replica for queries
# (requires code changes to route read traffic)
```

### Increase Storage

```bash
# Increase allocated storage (no downtime)
aws rds modify-db-instance \
  --db-instance-identifier mangu-publishing-db-production \
  --allocated-storage 100 \
  --apply-immediately
```

## Redis Scaling

### Vertical Scaling (Change Node Type)

```bash
# Modify node type
aws elasticache modify-replication-group \
  --replication-group-id mangu-redis-production \
  --cache-node-type cache.t3.small \
  --apply-immediately

# Monitor modification
aws elasticache describe-replication-groups \
  --replication-group-id mangu-redis-production \
  --query 'ReplicationGroups[0].Status'
```

### Horizontal Scaling (Add Nodes)

```bash
# Add cache nodes
aws elasticache increase-replica-count \
  --replication-group-id mangu-redis-production \
  --new-replica-count 2 \
  --apply-immediately
```

## Task Resource Scaling

### Increase Task CPU/Memory

1. Update task definition in Terraform:

```hcl
# infrastructure/terraform/variables.tf
variable "ecs_server_cpu" {
  default     = 1024  # Increased from 512
}

variable "ecs_server_memory" {
  default     = 2048  # Increased from 1024
}
```

2. Apply Terraform changes:

```bash
cd infrastructure/terraform
terraform plan
terraform apply
```

3. Deploy new task definition:

```bash
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --force-new-deployment
```

## Monitoring Scaling Events

### ECS Scaling Events

```bash
# View recent scaling events
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query 'services[0].events[:10]'

# View auto-scaling activities
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/mangu-publishing-cluster-production/mangu-publishing-server-production
```

### CloudWatch Metrics

```bash
# CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=mangu-publishing-server-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# Memory utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=mangu-publishing-server-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# Request count
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=<load-balancer-name> \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## Scaling for Specific Scenarios

### Black Friday / High Traffic Event

**1 week before:**
```bash
# Increase RDS instance size
aws rds modify-db-instance \
  --db-instance-identifier mangu-publishing-db-production \
  --db-instance-class db.t3.medium \
  --apply-immediately

# Increase Redis node type
aws elasticache modify-replication-group \
  --replication-group-id mangu-redis-production \
  --cache-node-type cache.t3.small \
  --apply-immediately
```

**1 day before:**
```bash
# Pre-warm ECS services
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --desired-count 6

# Update auto-scaling limits
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/mangu-publishing-cluster-production/mangu-publishing-server-production \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 6 \
  --max-capacity 20
```

**During event:**
```bash
# Monitor continuously
watch -n 30 'aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query "services[0].{Running:runningCount,Desired:desiredCount}"'
```

**After event:**
```bash
# Scale down
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --desired-count 2

# Reset auto-scaling limits
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/mangu-publishing-cluster-production/mangu-publishing-server-production \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

### Gradual User Growth

**Monthly review:**
1. Check average resource utilization
2. Adjust baseline capacity if consistently above 60%
3. Update auto-scaling thresholds

```bash
# Get average CPU over last month
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=mangu-publishing-server-production \
  --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Average
```

## Cost Optimization

### Right-Sizing

```bash
# Analyze actual usage
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Identify over-provisioned resources
# - Tasks with consistently low CPU/memory
# - Database with low connection count
# - Redis with low memory usage
```

### Spot Instances

ECS is configured to use Fargate Spot (80% cost savings):

```hcl
# Already configured in infrastructure/terraform/ecs.tf
default_capacity_provider_strategy {
  capacity_provider = "FARGATE"
  weight            = 1
  base              = 1
}

default_capacity_provider_strategy {
  capacity_provider = "FARGATE_SPOT"
  weight            = 4
}
```

## Scaling Limits

### Current Limits
- **ECS Tasks**: 2-10 (auto-scaling)
- **RDS**: db.t3.small (can scale to db.r5.4xlarge)
- **Redis**: cache.t3.micro (can scale to cache.r5.4xlarge)
- **ALB**: Automatic scaling by AWS

### AWS Service Quotas

```bash
# Check current quotas
aws service-quotas list-service-quotas \
  --service-code ecs \
  --query 'Quotas[?QuotaName==`Tasks per service`]'

# Request quota increase if needed
aws service-quotas request-service-quota-increase \
  --service-code ecs \
  --quota-code L-xxxxxxxx \
  --desired-value 50
```

## Related Documentation

- [Deployment Runbook](./deployment.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Infrastructure Documentation](../INFRASTRUCTURE.md)
