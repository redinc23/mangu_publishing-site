# MANGU Publishing - Deployment Guide

## Prerequisites

- AWS Account with appropriate permissions
- Terraform >= 1.5.0
- Docker installed locally
- AWS CLI configured
- GitHub repository with secrets configured

## Quick Deploy

### 1. Configure AWS Credentials

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

### 2. Initialize Terraform

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan
terraform apply
```

### 3. Configure GitHub Secrets

Required secrets in GitHub repository:
- `AWS_ROLE_ARN` - IAM role for GitHub Actions
- `VITE_API_URL` - Production API URL
- `PRODUCTION_URL` - Production frontend URL

### 4. Deploy Application

Push to `main` branch to trigger automatic deployment:

```bash
git push origin main
```

## Manual Deployment

### Build Docker Images

```bash
# Build server
docker build -t mangu-server:latest -f Dockerfile .

# Build client
docker build -t mangu-client:latest \
  --build-arg VITE_API_URL=https://api.mangu-publishing.com \
  -f Dockerfile.client .
```

### Push to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push server
docker tag mangu-server:latest <ecr-url>/mangu-publishing/server:latest
docker push <ecr-url>/mangu-publishing/server:latest

# Tag and push client
docker tag mangu-client:latest <ecr-url>/mangu-publishing/client:latest
docker push <ecr-url>/mangu-publishing/client:latest
```

### Update ECS Services

```bash
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --force-new-deployment

aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-client-production \
  --force-new-deployment
```

## Rollback Procedure

### Option 1: Rollback via GitHub Actions

1. Go to GitHub Actions
2. Find the last successful deployment
3. Click "Re-run jobs"

### Option 2: Manual Rollback

```bash
# List task definitions
aws ecs list-task-definitions --family-prefix mangu-publishing-server

# Update service to previous task definition
aws ecs update-service \
  --cluster mangu-publishing-cluster-production \
  --service mangu-publishing-server-production \
  --task-definition mangu-publishing-server-production:PREVIOUS_REVISION
```

## Monitoring Deployment

### View ECS Service Status

```bash
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production
```

### View CloudWatch Logs

```bash
aws logs tail /ecs/mangu-publishing-server-production --follow
```

### Run Smoke Tests

```bash
./scripts/smoke-tests.sh https://mangu-publishing.com
```

## Troubleshooting

### Deployment Stuck

```bash
# Check service events
aws ecs describe-services \
  --cluster mangu-publishing-cluster-production \
  --services mangu-publishing-server-production \
  --query 'services[0].events[:10]'
```

### Container Failing Health Checks

```bash
# View task logs
aws ecs list-tasks --cluster mangu-publishing-cluster-production
aws ecs describe-tasks --cluster mangu-publishing-cluster-production --tasks <task-arn>
```

### Database Connection Issues

1. Check security group rules
2. Verify database credentials in Secrets Manager
3. Check VPC configuration

## Zero-Downtime Deployment

The deployment is configured for zero-downtime:
- Blue/Green deployment via ECS
- Rolling updates with health checks
- Circuit breaker with automatic rollback
- Load balancer draining period

## Post-Deployment Verification

1. ✅ Check health endpoints
2. ✅ Verify database connectivity
3. ✅ Test API endpoints
4. ✅ Check CloudWatch metrics
5. ✅ Review CloudWatch logs
6. ✅ Test UI functionality

## Support

For issues, check:
1. CloudWatch Logs: `/ecs/mangu-publishing-*`
2. ECS Service Events
3. ALB Target Health
4. RDS Connection Status
