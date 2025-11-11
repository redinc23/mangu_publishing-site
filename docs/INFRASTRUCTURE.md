# MANGU Publishing Infrastructure

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CloudFront CDN                           │
│                    (Global Edge Locations)                       │
└────────────────┬───────────────────────────┬────────────────────┘
                 │                           │
                 │ Static Assets             │ API/Dynamic
                 ▼                           ▼
        ┌────────────────┐          ┌────────────────┐
        │   S3 Bucket    │          │      ALB       │
        │  (Static Files)│          │ (Load Balancer)│
        └────────────────┘          └───────┬────────┘
                                            │
                    ┌───────────────────────┴─────────────┐
                    │                                     │
                    ▼                                     ▼
            ┌───────────────┐                   ┌───────────────┐
            │  ECS Fargate  │                   │  ECS Fargate  │
            │    Client     │                   │    Server     │
            │  (Nginx/SPA)  │                   │  (Node.js)    │
            └───────────────┘                   └───────┬───────┘
                                                        │
                            ┌───────────────────────────┼─────────┐
                            │                           │         │
                            ▼                           ▼         ▼
                    ┌──────────────┐          ┌──────────────┐ ┌────────┐
                    │     RDS      │          │ ElastiCache  │ │   S3   │
                    │  PostgreSQL  │          │    Redis     │ │Uploads │
                    │  (Multi-AZ)  │          │              │ │        │
                    └──────────────┘          └──────────────┘ └────────┘
```

## Components

### 1. VPC Configuration

- **CIDR Block**: 10.0.0.0/16
- **Public Subnets**: 2 (Multi-AZ)
- **Private Subnets**: 2 (Multi-AZ)
- **NAT Gateways**: 2 (High Availability)
- **Internet Gateway**: 1

### 2. Compute (ECS Fargate)

#### Server Service
- **CPU**: 512 units (0.5 vCPU)
- **Memory**: 1024 MB (1 GB)
- **Desired Count**: 2
- **Max Count**: 10 (Auto-scaling)
- **Health Check**: `/api/health`

#### Client Service
- **CPU**: 256 units (0.25 vCPU)
- **Memory**: 512 MB
- **Desired Count**: 2
- **Health Check**: `/`

### 3. Database (RDS PostgreSQL 16)

- **Instance Type**: db.t3.small
- **Storage**: 50 GB (gp3, auto-scaling to 100 GB)
- **Multi-AZ**: Enabled
- **Backup Retention**: 7 days
- **Encryption**: At rest (AES-256)
- **Performance Insights**: Enabled
- **Connection Pooling**: Managed by application

### 4. Cache (ElastiCache Redis 7)

- **Node Type**: cache.t3.micro
- **Cluster Mode**: Single node (can scale to multi-node)
- **Encryption**: At rest and in transit
- **Auth Token**: Required
- **Automatic Failover**: Enabled (multi-node)

### 5. Load Balancer (ALB)

- **Type**: Application Load Balancer
- **Scheme**: Internet-facing
- **SSL/TLS**: TLS 1.3
- **Health Checks**: Enabled
- **Cross-Zone Load Balancing**: Enabled
- **WAF**: Enabled with rate limiting

### 6. CDN (CloudFront)

- **Price Class**: PriceClass_100 (US, Canada, Europe)
- **Cache Behavior**: Static assets cached at edge
- **API Requests**: Forwarded to ALB
- **SSL Certificate**: AWS ACM
- **Compression**: Gzip and Brotli

### 7. Storage (S3)

#### Uploads Bucket
- **Versioning**: Enabled
- **Encryption**: AES-256
- **Public Access**: Blocked
- **Lifecycle**: Archive to Glacier after 90 days

#### Static Assets Bucket
- **Versioning**: Enabled
- **CloudFront Access**: OAC (Origin Access Control)
- **Public Access**: Blocked

### 8. Container Registry (ECR)

- **Repositories**: 2 (server, client)
- **Scan on Push**: Enabled
- **Lifecycle Policy**: Keep last 10 tagged images
- **Encryption**: AES-256

### 9. Security (WAF)

- **Rate Limiting**: 2000 requests per 5 minutes per IP
- **AWS Managed Rules**: 
  - Common Rule Set
  - Known Bad Inputs
- **Logging**: CloudWatch

### 10. Secrets Management

- **AWS Secrets Manager**: Database, Redis, Application secrets
- **Rotation**: Manual (can be automated)
- **Access**: IAM role-based

## Network Architecture

### Security Groups

#### ALB Security Group
- **Inbound**: Port 80, 443 from 0.0.0.0/0
- **Outbound**: All traffic

#### ECS Tasks Security Group
- **Inbound**: Port 3000, 5173 from ALB
- **Outbound**: All traffic

#### RDS Security Group
- **Inbound**: Port 5432 from ECS Tasks
- **Outbound**: None required

#### Redis Security Group
- **Inbound**: Port 6379 from ECS Tasks
- **Outbound**: None required

### Route Tables

#### Public Route Table
- 0.0.0.0/0 → Internet Gateway

#### Private Route Tables (2)
- 0.0.0.0/0 → NAT Gateway (AZ-specific)

## Monitoring & Logging

### CloudWatch Logs

- `/ecs/mangu-publishing-server-production`
- `/ecs/mangu-publishing-client-production`
- `/aws/rds/instance/mangu-publishing-db-production`
- `/aws/elasticache/mangu-publishing-redis-production`

### CloudWatch Metrics

- ECS Service CPU/Memory utilization
- ALB request count, latency
- RDS connections, IOPS
- Redis cache hit/miss rate

### Alarms

- ECS Service unhealthy targets
- Database connection failures
- High error rates
- Memory/CPU above 80%

## Scaling Strategy

### Horizontal Scaling (ECS)

- **Metric**: CPU Utilization
- **Target**: 70%
- **Scale Out**: Add 1 task when above 70%
- **Scale In**: Remove 1 task when below 40%
- **Cooldown**: 60 seconds

### Vertical Scaling

- **Database**: Manual resize during maintenance window
- **Redis**: Manual node type change
- **ECS Tasks**: Update task definition

## Disaster Recovery

### Backup Strategy

- **RDS**: Automated daily backups (7 days retention)
- **S3**: Versioning enabled
- **Infrastructure**: Terraform state in S3

### Recovery Procedures

1. **Database Failure**: Automatic failover to standby (Multi-AZ)
2. **Region Failure**: Manual restore in different region
3. **Data Loss**: Restore from automated backups

### RTO/RPO

- **RTO**: 1 hour
- **RPO**: 5 minutes (transaction log backups)

## Cost Optimization

1. **ECS**: Fargate Spot for 80% of workload
2. **RDS**: Reserved Instance pricing (1-year term)
3. **ElastiCache**: Right-sized node type
4. **S3**: Lifecycle policies to Glacier
5. **CloudWatch**: Log retention limited to 7 days

## Estimated Monthly Cost

- **ECS Fargate**: ~$50-100
- **RDS**: ~$50-80
- **ElastiCache**: ~$15-30
- **ALB**: ~$20-30
- **CloudFront**: ~$10-50 (traffic dependent)
- **S3**: ~$5-20
- **Secrets Manager**: ~$5
- **Total**: ~$155-315/month

## Infrastructure Updates

### Terraform Workflow

```bash
# Plan changes
terraform plan -out=tfplan

# Review plan
terraform show tfplan

# Apply changes
terraform apply tfplan

# Verify
terraform output
```

### Zero-Downtime Updates

1. Update task definition
2. Deploy new revision
3. ECS performs rolling update
4. Health checks ensure stability
5. Old tasks drained after new tasks healthy

## Security Hardening

- ✅ All data encrypted at rest
- ✅ All data encrypted in transit (TLS 1.3)
- ✅ Private subnets for compute and data layers
- ✅ Security groups with least privilege
- ✅ IAM roles with minimal permissions
- ✅ Secrets in AWS Secrets Manager
- ✅ WAF protecting ALB
- ✅ VPC Flow Logs enabled
- ✅ CloudTrail logging all API calls
- ✅ Regular security scans (Trivy)
