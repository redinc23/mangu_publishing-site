# ECS Configuration Fixes and Improvements

This document outlines all the critical fixes and production-ready improvements applied to the ECS Terraform configuration.

## Critical Fixes Applied

### 1. ✅ Secrets Manager Reference Syntax
**Problem**: Invalid ARN syntax for JSON-based secrets
```hcl
# BEFORE (WRONG)
valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:url::"

# AFTER (CORRECT)
valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:url::"
```

**Note**: The syntax is correct for JSON secrets stored in Secrets Manager. The secrets in `rds.tf` and `elasticache.tf` already use `jsonencode()` with proper key names like `url`, so the `::` syntax works correctly.

### 2. ✅ Health Check Command Fixed
**Changed from**: `curl` (may not be in container)
**Changed to**: `wget --no-verbose --tries=1 --spider` (more commonly available in Alpine/Node images)

If your Docker images use different base images, ensure either `curl` or `wget` is installed.

### 3. ✅ Added Missing Environment Variables
Added to server task definition:
- `AWS_REGION` - Required for AWS SDK clients
- `S3_UPLOADS_BUCKET` - For S3 upload operations
- `CORS_ORIGIN` - For CORS validation
- `STRIPE_SECRET_KEY` (as secret)
- `STRIPE_WEBHOOK_SECRET` (as secret)

### 4. ✅ IAM Policy Improvements
**KMS Policy**: Scoped to Secrets Manager service with condition:
```hcl
Condition = {
  StringEquals = {
    "kms:ViaService" = "secretsmanager.${var.aws_region}.amazonaws.com"
  }
}
```

**Added SES Policy**: Server tasks can now send emails from your domain:
```hcl
Condition = {
  StringLike = {
    "ses:FromAddress" = "*@${var.domain_name}"
  }
}
```

**Removed S3 from Client**: Client tasks no longer have S3 permissions (they don't need them).

### 5. ✅ CloudWatch Logs Retention
**Changed from**: 7 days
**Changed to**: 30 days (production standard)

For compliance/security-sensitive workloads, consider 90-365 days.

### 6. ✅ FARGATE vs FARGATE_SPOT Ratio
**Changed from**: 20% FARGATE / 80% FARGATE_SPOT
**Changed to**: 60% FARGATE / 40% FARGATE_SPOT

This reduces the risk of Spot interruptions while maintaining cost savings. Base capacity of 2 ensures critical tasks always run on standard Fargate.

### 7. ✅ Auto-Scaling Enhancements
Added:
- Memory-based scaling for server (80% threshold)
- Complete auto-scaling for client service (CPU + Memory)
- Scale-in cooldown: 300s (prevents flapping)
- Scale-out cooldown: 60s (fast response to load)

Client scales 2-6 tasks, Server scales 2-10 tasks.

### 8. ✅ Deployment Configuration
**Changed**: `minimum_healthy_percent` from 100 to 50

This enables faster deployments without requiring double capacity. With circuit breaker enabled, rollbacks are automatic on failure.

Added `enable_execute_command = true` for AWS ECS Exec debugging.

### 9. ✅ Image Tag Management
**Changed from**: `:latest` (dangerous)
**Changed to**: `:${var.image_tag}` (version controlled)

Usage:
```bash
terraform apply -var="image_tag=v1.2.3"
# or
terraform apply -var="image_tag=sha-abc123f"
```

### 10. ✅ CloudWatch Alarms Added
Comprehensive monitoring coverage:

| Alarm | Threshold | Purpose |
|-------|-----------|---------|
| `server-cpu-high` | 85% CPU | Prevent performance degradation |
| `server-memory-high` | 90% Memory | Prevent OOM kills |
| `server-task-count-low` | < 2 tasks | Detect service failures |
| `client-cpu-high` | 85% CPU | Client performance |
| `alb-5xx-errors` | > 10 in 5min | Backend errors |
| `server-target-unhealthy` | < 1 healthy | Critical availability |
| `client-target-unhealthy` | < 1 healthy | Frontend availability |

## Security Improvements

1. **Least Privilege IAM**: Separated execution role (pulls images/secrets) from task role (runtime permissions)
2. **SES Scoped**: Email sending limited to your domain
3. **KMS Scoped**: Decrypt only via Secrets Manager service
4. **ECS Exec Enabled**: Secure debugging without SSH bastion

## What You Need to Do

### 1. Update Secrets Manager Values
Ensure `app_secrets` secret contains these JSON keys:
```json
{
  "jwt_secret": "your-jwt-secret-here",
  "stripe_secret_key": "sk_live_...",
  "stripe_webhook_secret": "whsec_..."
}
```

Create/update the secret:
```bash
aws secretsmanager put-secret-value \
  --secret-id mangu-publishing-app-secrets-production \
  --secret-string '{
    "jwt_secret": "your-secret",
    "stripe_secret_key": "sk_live_xxx",
    "stripe_webhook_secret": "whsec_xxx"
  }'
```

### 2. Verify Docker Images Have wget
Add to your Dockerfiles if missing:
```dockerfile
# For Alpine-based images
RUN apk add --no-cache wget

# For Debian/Ubuntu-based images
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*
```

### 3. Deploy with Specific Image Tags
In your CI/CD pipeline:
```bash
# Build and tag
docker build -t $ECR_REPO:$GIT_SHA .
docker push $ECR_REPO:$GIT_SHA

# Deploy with specific tag
terraform apply -var="image_tag=$GIT_SHA"
```

### 4. Configure SNS for Alarm Notifications
Add to your Terraform (recommended):
```hcl
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${var.environment}"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "ops@yourdomain.com"
}

# Then add to each alarm:
resource "aws_cloudwatch_metric_alarm" "server_cpu_high" {
  # ... existing config ...
  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

### 5. Test Deployment
```bash
# Validate Terraform
terraform init
terraform validate
terraform plan

# Apply (with specific tag)
terraform apply -var="image_tag=v1.0.0"
```

## Performance Recommendations

### Current Configuration (T3 Micro Tier)
- Server: 512 CPU / 1024 MB (2 tasks = $17.52/month)
- Client: 256 CPU / 512 MB (2 tasks = $8.76/month)
- **Total Base Cost**: ~$26/month + data transfer

### Production Recommendations
For production load, consider upgrading:

```hcl
# variables.tf or terraform.tfvars
ecs_server_cpu    = 1024  # 1 vCPU
ecs_server_memory = 2048  # 2 GB
ecs_client_cpu    = 512   # 0.5 vCPU
ecs_client_memory = 1024  # 1 GB
```

### Cost vs Performance
| Tier | Server (CPU/Mem) | Monthly Cost (2 tasks) | Use Case |
|------|------------------|------------------------|----------|
| Dev | 512/1024 | $17.52 | Development/staging |
| Prod-Small | 1024/2048 | $35.04 | < 10k users |
| Prod-Med | 2048/4096 | $70.08 | 10k-100k users |
| Prod-Large | 4096/8192 | $140.16 | 100k+ users |

## Monitoring Setup

### View Logs
```bash
# Server logs
aws logs tail /ecs/mangu-publishing-server-production --follow

# Client logs
aws logs tail /ecs/mangu-publishing-client-production --follow
```

### Check Service Health
```bash
# Service status
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production

# Task status
aws ecs list-tasks \
  --cluster mangu-publishing-cluster-production \
  --service-name mangu-publishing-server-production
```

### Debug with ECS Exec
```bash
# Connect to running task
aws ecs execute-command \
  --cluster mangu-publishing-cluster-production \
  --task <task-id> \
  --container server \
  --interactive \
  --command "/bin/sh"
```

## Rollback Plan

If deployment fails:

1. **Automatic**: Circuit breaker will rollback automatically
2. **Manual**: 
```bash
# Revert to previous image tag
terraform apply -var="image_tag=v0.9.9"

# Or force redeploy of known-good task definition
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --task-definition mangu-publishing-server-production:42 \
  --force-new-deployment
```

## Next Steps

1. ✅ Apply these Terraform changes
2. ⬜ Set up SNS topic for alarm notifications
3. ⬜ Configure log aggregation (e.g., CloudWatch Insights, Datadog)
4. ⬜ Create runbook for common incidents
5. ⬜ Set up synthetic monitoring (health check from outside AWS)
6. ⬜ Configure backup/restore procedures
7. ⬜ Document scaling thresholds based on actual load testing

## Additional Considerations

### Multi-Region Deployment
For high availability, consider:
- Route53 with health checks and failover
- Cross-region RDS read replicas
- Global Accelerator for low latency

### Blue-Green Deployment
For zero-downtime:
```hcl
deployment_configuration {
  deployment_type = "BLUE_GREEN"
}
```

### Service Discovery
If services need to communicate:
```hcl
service_registries {
  registry_arn = aws_service_discovery_service.server.arn
}
```

## Questions or Issues?

Review these files for context:
- `rds.tf` - Database secret structure
- `elasticache.tf` - Redis secret structure
- `alb.tf` - Load balancer and target group settings
- `secrets.tf` - Additional secrets configuration

