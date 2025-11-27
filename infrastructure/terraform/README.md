# MANGU Publishing - Terraform Infrastructure

This directory contains the Infrastructure as Code (IaC) for the MANGU Publishing platform using Terraform.

## Overview

The infrastructure includes:
- **VPC**: Multi-AZ network setup with public/private subnets
- **ECS Fargate**: Container orchestration for server and client applications
- **RDS PostgreSQL**: Managed relational database
- **ElastiCache Redis**: Managed caching layer
- **ALB**: Application Load Balancer with SSL termination
- **CloudFront**: CDN for static asset delivery
- **S3**: Object storage for uploads and static files
- **ACM Certificates**: Automated SSL/TLS certificate management with DNS validation ⭐ NEW
- **Cost Monitoring**: AWS Budgets, anomaly detection, and CloudWatch dashboards

## Prerequisites

1. **Terraform**: Install Terraform >= 1.5.0
   ```bash
   brew install terraform  # macOS
   # or download from https://www.terraform.io/downloads
   ```

2. **AWS CLI**: Configure AWS credentials
   ```bash
   aws configure
   # or use environment variables
   export AWS_ACCESS_KEY_ID="your-key"
   export AWS_SECRET_ACCESS_KEY="your-secret"
   export AWS_DEFAULT_REGION="us-east-1"
   ```

3. **S3 Backend**: Create state bucket (one-time setup)
   ```bash
   aws s3 mb s3://mangu-terraform-state --region us-east-1
   aws s3api put-bucket-versioning \
     --bucket mangu-terraform-state \
     --versioning-configuration Status=Enabled
   
   aws dynamodb create-table \
     --table-name mangu-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --region us-east-1
   ```

## Quick Start

### 1. Initialize Terraform

```bash
cd infrastructure/terraform
terraform init
```

### 2. Configure Variables

Copy the example file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
# Required variables
db_username = "mangu_admin"
db_password = "your-secure-password"
budget_alert_emails = ["devops@yourcompany.com"]

# Domain & SSL Configuration
domain_name = "your-domain.com"
create_acm_certificate = true  # Enable automated certificates
route53_zone_id = ""  # Leave empty for manual DNS validation

# Optional: customize resources
monthly_budget_limit = "500"
ecs_server_cpu = 512
ecs_server_memory = 1024
```

**Security Note**: Never commit `terraform.tfvars` with sensitive data. Use environment variables or AWS Secrets Manager for production.

### 3. Plan Infrastructure Changes

```bash
terraform plan
```

Review the execution plan carefully before applying.

### 4. Apply Infrastructure (First Time)

```bash
terraform apply
```

Type `yes` when prompted to create resources.

**⚠️ IMPORTANT - ACM Certificate Validation Required**

On first apply, ACM certificates will be created with status `PENDING_VALIDATION`. Terraform will output DNS validation records:

```bash
# View DNS records to add
terraform output cloudfront_dns_validation_records
terraform output alb_dns_validation_records
```

Add the CNAME records to your DNS provider (Cloudflare, GoDaddy, etc.), then:

```bash
# Re-apply after adding DNS records (5-15 min propagation time)
terraform apply
```

📘 **See detailed instructions**: [ACM_AUTOMATION_GUIDE.md](./ACM_AUTOMATION_GUIDE.md)

**🚀 Automated Deployment Option**

Use the `wait-and-deploy.sh` script from the repository root for a fully automated deployment experience:

```bash
cd /path/to/mangu2-publishing
./wait-and-deploy.sh
```

This script:
- Automatically resolves certificate ARN from `terraform output` or `terraform.tfvars`
- Displays DNS validation records to add
- Polls certificate status every 30 seconds
- Runs `terraform apply` once certificate is ISSUED
- Works portably across machines (no hardcoded paths)

### 5. Confirm SNS Subscriptions

After applying, team members will receive emails to confirm SNS subscriptions for cost alerts. Click the confirmation link to activate.

## File Structure

```
terraform/
├── main.tf                    # VPC, networking, security groups
├── ecs.tf                     # ECS cluster, task definitions, services
├── rds.tf                     # PostgreSQL RDS instance
├── elasticache.tf             # Redis cluster
├── alb.tf                     # Application Load Balancer
├── cloudfront.tf              # CDN configuration
├── s3.tf                      # S3 buckets for storage
├── ecr.tf                     # Container registry
├── secrets.tf                 # Secrets Manager resources
├── acm.tf                     # ACM certificates (automated) ⭐ NEW
├── billing.tf                 # Cost monitoring and budgets
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── terraform.tfvars.example   # Example configuration
├── README.md                  # This file
└── ACM_AUTOMATION_GUIDE.md    # SSL certificate automation guide ⭐ NEW
```

## Cost Monitoring Features

The `billing.tf` module provides comprehensive cost tracking:

### 1. AWS Budgets
- **Monthly Budget**: $500 (configurable)
- **ECS Budget**: $200 for compute resources
- **RDS Budget**: $100 for database

### 2. Alert Thresholds
- **80%**: Warning alert (email + SNS)
- **90%**: Forecasted alert (proactive)
- **100%**: Critical alert

### 3. Cost Anomaly Detection
- Service-level monitoring
- Account-wide tracking
- $50 anomaly threshold
- Immediate notifications

### 4. CloudWatch Dashboard
Real-time dashboard with:
- Estimated monthly charges
- ECS resource utilization
- Cost anomaly logs

### 5. Resource Tagging
All resources automatically tagged:
- `Project`: MANGU-Publishing
- `Environment`: production/staging/dev
- `ManagedBy`: Terraform
- `CostCenter`: engineering
- `Component`: compute/database/storage/monitoring

## Usage Examples

### View Infrastructure Outputs

```bash
terraform output
terraform output -raw cost_dashboard_url
terraform output sns_topic_arn
```

### Update Single Resource

```bash
# Update only ECS service
terraform apply -target=aws_ecs_service.server

# Update cost monitoring
terraform apply -target=aws_budgets_budget.monthly
```

### Check Current State

```bash
terraform show
terraform state list
terraform state show aws_budgets_budget.monthly
```

### Destroy Resources (Careful!)

```bash
# Destroy specific resource
terraform destroy -target=aws_budgets_budget.ecs_budget

# Destroy all infrastructure (use with caution)
terraform destroy
```

## Cost Management

### Daily Monitoring

Run the cost optimization script:

```bash
../../scripts/cost-optimization.sh
```

### Access Cost Dashboard

```bash
# Get dashboard URL
terraform output cost_dashboard_url

# Or manually visit
open "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards"
```

### Check Budget Status

```bash
aws budgets describe-budgets \
  --account-id $(aws sts get-caller-identity --query Account --output text)
```

### Review Cost Anomalies

```bash
aws ce get-anomalies --max-results 10
```

### Optimize Costs

See [Cost Monitoring Guide](../../docs/COST_MONITORING_GUIDE.md) for detailed strategies.

## Common Operations

### Scaling ECS Tasks

Edit `terraform.tfvars`:

```hcl
ecs_server_cpu = 1024  # Increase from 512
ecs_server_memory = 2048  # Increase from 1024
```

Apply changes:

```bash
terraform apply -target=aws_ecs_task_definition.server
```

### Updating Database Instance

```hcl
db_instance_class = "db.t3.small"  # Upgrade from micro
db_allocated_storage = 50  # Increase storage
```

Apply:

```bash
terraform apply -target=aws_db_instance.main
```

### Adjusting Cost Budgets

```hcl
monthly_budget_limit = "750"  # Increase budget
```

Apply:

```bash
terraform apply -target=aws_budgets_budget.monthly
```

## Environment Management

### Multiple Environments

Create workspace or separate directories:

```bash
# Using workspaces
terraform workspace new staging
terraform workspace select staging
terraform apply -var="environment=staging"

# Or separate tfvars files
terraform apply -var-file="staging.tfvars"
```

### Production Best Practices

1. **Always use remote state** (S3 backend)
2. **Enable state locking** (DynamoDB)
3. **Use separate AWS accounts** for environments
4. **Require MFA** for sensitive operations
5. **Review plans** before applying
6. **Tag all resources** consistently
7. **Monitor costs** daily
8. **Set up alerts** for anomalies

## Outputs Reference

| Output | Description |
|--------|-------------|
| `vpc_id` | VPC identifier |
| `ecs_cluster_name` | ECS cluster name |
| `alb_dns_name` | Load balancer DNS |
| `rds_endpoint` | Database endpoint |
| `redis_endpoint` | Redis cache endpoint |
| `cloudfront_domain` | CloudFront distribution domain |
| `certificate_arn` | CloudFront ACM certificate ARN ⭐ NEW |
| `alb_certificate_arn` | ALB ACM certificate ARN ⭐ NEW |
| `cloudfront_dns_validation_records` | DNS records for certificate validation ⭐ NEW |
| `alb_dns_validation_records` | DNS records for ALB certificate validation ⭐ NEW |
| `sns_topic_arn` | Cost alerts SNS topic ARN |
| `cost_dashboard_url` | CloudWatch cost dashboard URL |
| `budget_name` | Monthly budget name |
| `anomaly_monitor_arns` | Cost anomaly monitor ARNs |

## Troubleshooting

### Terraform Init Fails

```bash
# Clear cache and reinitialize
rm -rf .terraform .terraform.lock.hcl
terraform init -upgrade
```

### State Lock Issues

```bash
# Force unlock (use with caution)
terraform force-unlock <lock-id>
```

### Resource Already Exists

```bash
# Import existing resource
terraform import aws_budgets_budget.monthly mangu-publishing-monthly-budget-production
```

### Cost Alerts Not Working

1. Check SNS subscriptions:
   ```bash
   aws sns list-subscriptions-by-topic \
     --topic-arn $(terraform output -raw sns_topic_arn)
   ```

2. Verify email confirmations were clicked

3. Test notification:
   ```bash
   aws sns publish \
     --topic-arn $(terraform output -raw sns_topic_arn) \
     --message "Test alert"
   ```

### Budget Not Tracking Costs

- Wait 24 hours for tags to propagate
- Verify resources have correct tags
- Enable cost allocation tags in AWS Console

## Security Considerations

1. **Never commit secrets** to version control
2. **Use AWS Secrets Manager** for sensitive data
3. **Rotate credentials** regularly
4. **Use IAM roles** instead of access keys when possible
5. **Enable CloudTrail** for audit logging
6. **Review security groups** regularly
7. **Enable encryption** at rest and in transit
8. **Use least privilege** IAM policies

## CI/CD Integration

GitHub Actions workflow checks cost status:

```bash
# See .github/workflows/cost-check.yml
# Runs daily and on infrastructure PRs
# Posts budget status as PR comments
# Creates issues if budget critical
```

## Additional Resources

- [ACM Automation Guide](./ACM_AUTOMATION_GUIDE.md) ⭐ SSL certificate automation
- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Cost Management](https://aws.amazon.com/aws-cost-management/)
- [Cost Monitoring Guide](../../docs/COST_MONITORING_GUIDE.md)
- [Infrastructure Overview](../../docs/INFRASTRUCTURE.md)

## Support

For infrastructure issues:
- DevOps Team: devops@mangu-publishing.com
- Slack: #infrastructure
- On-call: Check PagerDuty schedule

## License

Copyright © 2025 MANGU Publishing. All rights reserved.
