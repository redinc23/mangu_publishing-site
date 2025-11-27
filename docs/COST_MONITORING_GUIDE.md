# Cost Monitoring & Optimization Guide

Complete guide for AWS billing alerts, budgets, and cost anomaly detection for MANGU Publishing.

## Overview

The Terraform billing configuration provides:
- **Multi-tier budget alerts**: Monthly, ECS, and RDS budgets with threshold notifications (80%, 90% forecasted, 100%)
- **Enhanced anomaly detection**: Real-time cost spike alerts using both absolute ($) and percentage thresholds
- **CloudWatch dashboard**: Visual monitoring of spending trends and resource utilization
- **SNS integration**: Email notifications for all cost-related events with lifecycle protection

## Architecture

```
┌─────────────────┐
│  AWS Budgets    │──┐
├─────────────────┤  │
│ • Monthly       │  │  Notifications at:
│ • ECS Service   │  ├──► SNS Topic ──► Email Alerts  • 80% actual
│ • RDS Service   │  │                                 • 90% forecasted
└─────────────────┘  │                                 • 100% actual
                     │
┌─────────────────┐  │
│ Cost Anomaly    │  │  Dual thresholds:
│ Detection       │──┘  • $50 absolute OR
├─────────────────┤     • 200% impact
│ • Service-level │
│ • Account-level │
└─────────────────┘
```

## Configuration Variables

### Budget Limits (All Parameterized)

| Variable | Default | Production | Development | Description |
|----------|---------|-----------|-------------|-------------|
| `monthly_budget_limit` | 1000 | 5000 | 1000 | Total monthly spend cap (USD) |
| `ecs_budget_limit` | 400 | 2000 | 400 | ECS compute budget (USD) |
| `rds_budget_limit` | 300 | 1500 | 300 | Database budget (USD) |

### Anomaly Detection Thresholds (Enhanced)

| Variable | Default | Production | Development | Description |
|----------|---------|-----------|-------------|-------------|
| `anomaly_absolute_threshold` | 50 | 100 | 25 | Alert if cost spike > $X |
| `anomaly_impact_threshold` | 200 | 200 | 150 | Alert if impact > X% of baseline |
| `budget_time_period_start` | 2024-01-01_00:00 | Auto | Auto | Budget tracking start date |

### Alert Configuration

```hcl
# terraform.tfvars example
budget_alert_emails = [
  "ops@mangu-publishing.com",
  "finance@mangu-publishing.com"
]
cost_center = "engineering"

# Budget Limits (USD)
monthly_budget_limit = 1000  # or 5000 for production
ecs_budget_limit = 400       # or 2000 for production
rds_budget_limit = 300       # or 1500 for production

# Anomaly Detection Thresholds
anomaly_absolute_threshold = 50   # Alert if spike > $50 (or 100 for prod)
anomaly_impact_threshold = 200    # Alert if 200% of baseline
budget_time_period_start = "2024-01-01_00:00"
```

## Setup Checklist

### 1. Initial Deployment

## Alert Notification Levels

### Budget Alerts (Multi-Threshold)

| Threshold | Type | Notification | Action |
|-----------|------|--------------|--------|
| 80% | Actual | ⚠️ Warning | Review spending patterns |
| 90% | Forecasted | ⚠️ Proactive | Projected to exceed budget |
| 100% | Actual | 🚨 Critical | Budget exceeded - immediate action |

**Applied to**: Monthly, ECS, and RDS budgets

### Anomaly Alerts (Dual Threshold)

Triggered when **EITHER** condition is met:
- Cost spike ≥ `$anomaly_absolute_threshold` (default: $50)
- Cost impact ≥ `anomaly_impact_threshold%` (default: 200% of baseline)

**Frequency**: IMMEDIATE (real-time notifications)

**Response**: Investigate in AWS Cost Explorer for root cause identification.

## Cost Allocation Tags

All resources are automatically tagged with:

```hcl
Project     = "MANGU-Publishing"
Environment = "production" | "staging" | "development"
ManagedBy   = "Terraform"
CostCenter  = "engineering"
Component   = "compute" | "database" | "storage" | "monitoring"
```

```bash
cd infrastructure/terraform

# Validate configuration
terraform validate

# Review changes (check all variables)
terraform plan

# Apply billing configuration
terraform apply -target=aws_sns_topic.cost_alerts \
                -target=aws_budgets_budget.monthly \
                -target=aws_budgets_budget.ecs_budget \
                -target=aws_budgets_budget.rds_budget \
                -target=aws_ce_anomaly_monitor.service_monitor \
                -target=aws_ce_anomaly_monitor.account_monitor \
                -target=aws_ce_anomaly_subscription.anomaly_alerts \
                -target=aws_cloudwatch_dashboard.cost_monitoring

# Get outputs for validation
terraform output sns_topic_arn
terraform output cost_dashboard_url
terraform output anomaly_monitor_arns
```

### 2. Verify Email Subscriptions

**Important**: Each email address will receive a subscription confirmation.

```bash
# Check pending confirmations
aws sns list-subscriptions-by-topic \
  --topic-arn $(terraform output -raw sns_topic_arn) \
  --query 'Subscriptions[?SubscriptionArn==`PendingConfirmation`]'

# After confirming emails, verify active subscriptions
aws sns list-subscriptions-by-topic \
  --topic-arn $(terraform output -raw sns_topic_arn) \
  --query 'Subscriptions[?contains(SubscriptionArn, `arn:aws`)]'
```

**Action Required**: Check inbox for AWS notification emails and click confirmation links.

### 3. Validate Budget Configuration

```bash
# List all budgets
aws budgets describe-budgets \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --max-results 10

# Check specific budget details
aws budgets describe-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget-name mangu-publishing-monthly-budget-production
```

### 4. Test Anomaly Detection

```bash
# List anomaly monitors
aws ce get-anomaly-monitors --max-results 10

# Get anomaly subscription details
aws ce get-anomaly-subscriptions

# View recent anomalies (if any exist)
aws ce get-anomalies \
  --date-interval Start=$(date -u -d '7 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --max-results 10
```

### 5. Access CloudWatch Dashboard

```bash
# Get dashboard URL (includes region)
echo $(terraform output -raw cost_dashboard_url)
```

Open URL in browser to view:
- Estimated monthly charges
- ECS resource utilization  
- Recent cost anomalies

## Threshold Tuning Recommendations

### Development Environment

```hcl
# terraform.tfvars (dev)
monthly_budget_limit           = 1000
ecs_budget_limit              = 400
rds_budget_limit              = 300
anomaly_absolute_threshold    = 25
anomaly_impact_threshold      = 150
```

**Rationale**: Lower thresholds catch issues early in non-production.

### Staging Environment

```hcl
# terraform.tfvars (staging)
monthly_budget_limit           = 2000
ecs_budget_limit              = 800
rds_budget_limit              = 600
anomaly_absolute_threshold    = 50
anomaly_impact_threshold      = 175
```

**Rationale**: Moderate limits for pre-production testing.

### Production Environment

```hcl
# terraform.tfvars (production)
monthly_budget_limit           = 5000
ecs_budget_limit              = 2000
rds_budget_limit              = 1500
anomaly_absolute_threshold    = 100
anomaly_impact_threshold      = 200
```

**Rationale**: Higher thresholds accommodate production traffic while catching significant anomalies.

## Common Cost Anomalies

### 1. ECS Task Scaling Issues

**Symptom**: ECS budget alert + high cost spike

**Investigation**:
```bash
# Check running tasks
aws ecs list-tasks --cluster mangu-publishing-production

# Review service scaling events
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/mangu-publishing-production/mangu-server
```

**Resolution**: Review auto-scaling policies, check for stuck tasks.

### 2. RDS Storage Growth

**Symptom**: RDS budget alert with gradual increase

**Investigation**:
```bash
# Check RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name FreeStorageSpace \
  --dimensions Name=DBInstanceIdentifier,Value=mangu-publishing-production \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Average
```

**Resolution**: Implement data retention policies, archive old records.

### 3. Data Transfer Spikes

**Symptom**: Anomaly detection alert with no resource change

**Investigation**:
```bash
# Check CloudFront bandwidth
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name BytesDownloaded \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

**Resolution**: Review traffic patterns, optimize caching configurations.

## Cost Optimization Strategies

### Immediate Actions

1. **Right-size ECS Tasks**
   - Monitor CPU/Memory utilization in dashboard
   - Adjust `ecs_server_cpu`, `ecs_server_memory` if underutilized
   - Target 60-80% utilization

2. **RDS Instance Optimization**
   - Use Reserved Instances for 30-40% savings
   - Consider Aurora Serverless v2 for variable workloads

3. **ElastiCache Optimization**
   - Single node for dev/staging
   - Multi-AZ only for production critical paths

### Ongoing Monitoring

```bash
# Review monthly costs by service
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-02-01 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# Check budget status
aws budgets describe-budgets --account-id $(aws sts get-caller-identity --query Account --output text)

# List cost anomalies
aws ce get-anomalies --max-results 10
```

### Cost Allocation Report

Enable in AWS Cost Explorer:
1. Go to AWS Billing → Cost Allocation Tags
2. Activate tags: `Project`, `Environment`, `CostCenter`, `Component`
3. Wait 24 hours for data
4. Create custom Cost Explorer reports

## Alert Response Procedures

### Budget Alert (80% threshold)

1. **Review current spend**:
   ```bash
   aws ce get-cost-and-usage --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) --granularity DAILY --metrics BlendedCost
   ```

2. **Identify cost drivers**:
   - Check CloudWatch dashboard
   - Review ECS task counts
   - Analyze S3/CloudFront bandwidth

3. **Take action**:
   - Scale down non-production environments
   - Review and delete unused resources
   - Optimize data transfer patterns

### Cost Anomaly Alert

1. **Investigate anomaly**:
   - Check SNS alert details
   - Review Cost Explorer anomaly page
   - Correlate with recent deployments

2. **Common causes**:
   - Unexpected traffic spike
   - Misconfigured auto-scaling
   - Data transfer from new feature
   - Failed jobs retrying indefinitely

3. **Mitigation**:
   - Scale down if issue confirmed
   - Add rate limiting
   - Implement circuit breakers
   - Review and fix root cause

## CI/CD Integration

### Terraform Outputs for Automation

```bash
# Export all outputs
terraform output -json

# Specific outputs
terraform output sns_topic_arn                    # For publishing custom alerts
terraform output cost_dashboard_url                # Dashboard link in notifications
terraform output anomaly_monitor_arns             # Service and account monitor ARNs
terraform output cost_anomaly_subscription_arn    # Subscription management
terraform output billing_alert_email_count        # Verify subscription count
```

### GitHub Actions Secrets

```bash
# Export outputs for GitHub Actions
terraform output -json | jq -r 'to_entries[] | "TERRAFORM_\(.key | ascii_upcase)=\(.value.value)"'

# Add to GitHub repository secrets:
# - TERRAFORM_SNS_TOPIC_ARN
# - TERRAFORM_COST_DASHBOARD_URL  
# - TERRAFORM_ANOMALY_MONITOR_ARNS
```

### Example Workflow Step

```yaml
- name: Check Cost Anomalies Before Deploy
  run: |
    ANOMALIES=$(aws ce get-anomalies \
      --date-interval Start=$(date -u -d '1 day ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
      --max-results 5 \
      --query 'Anomalies[?Impact.MaxImpact > `50`]' \
      --output json)
    
    if [ "$(echo "$ANOMALIES" | jq 'length')" -gt 0 ]; then
      echo "::warning::Cost anomalies detected in the last 24 hours"
      echo "$ANOMALIES" | jq .
      echo "Review before proceeding with deployment"
    fi

- name: Validate Monthly Budget
  run: |
    CURRENT_SPEND=$(aws ce get-cost-and-usage \
      --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
      --granularity MONTHLY \
      --metrics BlendedCost \
      --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
      --output text)
    
    BUDGET_LIMIT=1000
    THRESHOLD=800
    
    if (( $(echo "$CURRENT_SPEND > $THRESHOLD" | bc -l) )); then
      echo "::warning::Monthly spend at \$$CURRENT_SPEND, approaching \$$BUDGET_LIMIT budget"
    fi
```

## Lifecycle Protection

All billing resources include `lifecycle { prevent_destroy = true }` to prevent accidental deletion:
- ✅ Monthly budget configuration
- ✅ ECS budget configuration  
- ✅ RDS budget configuration
- ✅ Anomaly monitors (service and account)
- ✅ Anomaly subscription

**To modify protected resources**:
1. Update Terraform code with desired changes
2. Run `terraform plan` to verify changes
3. Run `terraform apply` - lifecycle blocks prevent destruction
4. To remove protection: temporarily comment out lifecycle block, apply, then destroy

## Best Practices

1. **Set realistic budgets**: Base on historical spending + 20% buffer
2. **Use environment-specific thresholds**: Production should have higher limits than staging/dev
3. **Review alerts weekly**: Adjust thresholds based on false positive rate
4. **Tag all resources**: Budgets depend on accurate cost allocation tags
5. **Monitor anomaly trends**: Use Cost Explorer to understand spending patterns over time
6. **Archive old data**: Implement data retention policies to control RDS storage costs
7. **Optimize caching**: Reduce CloudFront/ECS costs with proper TTL settings
8. **Enable cost allocation tags**: Activate tags in Billing console for detailed reports

## Cost Optimization Checklist

### Immediate Actions
- [ ] Confirm SNS email subscriptions (check inbox)
- [ ] Validate initial budget alerts in Cost Explorer
- [ ] Test anomaly detection with small spend spike
- [ ] Configure GitHub Actions secrets for output ARNs
- [ ] Enable AWS cost allocation tags in Billing console

### Monthly Reviews
- [ ] Analyze Cost Explorer for top 5 services by spend
- [ ] Review anomaly detection history for patterns
- [ ] Validate resource tagging completeness (>95% tagged)
- [ ] Check for unused resources (idle ECS tasks, old snapshots, unattached EBS volumes)
- [ ] Review and adjust budget thresholds based on growth

### Quarterly Audits
- [ ] Re-evaluate budget limits for all environments
- [ ] Review Reserved Instance utilization and coverage
- [ ] Assess CloudFront vs ALB traffic patterns for optimization
- [ ] Consider Savings Plans for committed spend
- [ ] Implement S3 lifecycle policies for old data
- [ ] Enable RDS storage autoscaling if not enabled
- [ ] Archive CloudWatch logs >90 days to S3

## Troubleshooting

### Email Notifications Not Received

1. **Check subscription status**:
   ```bash
   aws sns list-subscriptions-by-topic \
     --topic-arn $(terraform output -raw sns_topic_arn)
   ```

2. **Verify email confirmations**: Check spam folders for AWS notification emails from `no-reply@sns.amazonaws.com`.

3. **Test SNS topic manually**:
   ```bash
   aws sns publish \
     --topic-arn $(terraform output -raw sns_topic_arn) \
     --subject "Test Cost Alert" \
     --message "This is a test notification from Terraform billing monitoring"
   ```

### Budget Not Triggering Alerts

1. **Verify time period**: Ensure `budget_time_period_start` is in the past.

2. **Check cost filters**: Budgets filter by Project tag - confirm resources are tagged correctly:
   ```bash
   # List resources with Project tag
   aws resourcegroupstaggingapi get-resources \
     --tag-filters Key=Project,Values=MANGU-Publishing \
     --resource-type-filters
   ```

3. **Review actual costs**:
   ```bash
   aws ce get-cost-and-usage \
     --time-period Start=$(date -u -d '1 month ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
     --granularity MONTHLY \
     --metrics BlendedCost \
     --filter file://<(echo '{"Tags":{"Key":"Project","Values":["MANGU-Publishing"]}}')
   ```

4. **Verify budget configuration**:
   ```bash
   aws budgets describe-budget \
     --account-id $(aws sts get-caller-identity --query Account --output text) \
     --budget-name mangu-publishing-monthly-budget-production
   ```

### Anomaly Detection Not Alerting

**Expected Behavior**: Anomaly detection requires 7-10 days to establish baseline spending patterns.

**Validation**:
```bash
# Check monitor status
aws ce get-anomaly-monitors \
  --monitor-arn-list $(terraform output -json anomaly_monitor_arns | jq -r '.service')

# View historical anomalies (may be empty initially)
aws ce get-anomalies \
  --date-interval Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --max-results 20

# Check subscription threshold configuration
aws ce get-anomaly-subscriptions | jq '.AnomalySubscriptions[] | {name, threshold_expression}'
```

**Note**: If no anomalies exist after 10 days, spending patterns are stable.

### Dashboard Not Showing Data

- CloudWatch metrics have 5-15 min delay for infrastructure metrics
- Billing metrics update every 4-6 hours
- Cost anomaly logs require CloudWatch Logs configuration (optional)
- Ensure viewing correct region: billing metrics in `us-east-1`, infrastructure metrics in `var.aws_region`

### Terraform Apply Fails with "Resource Already Exists"

```bash
# Import existing resource if manually created
terraform import aws_sns_topic.cost_alerts arn:aws:sns:us-east-1:ACCOUNT_ID:mangu-publishing-cost-alerts-production

# Or remove from state and let Terraform recreate
terraform state rm aws_sns_topic.cost_alerts
terraform apply
```

## Additional Resources

- [AWS Cost Management](https://aws.amazon.com/aws-cost-management/)
- [Cost Optimization Best Practices](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html)
- [AWS Budgets Documentation](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
- [Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/getting-started-ad.html)

## Related Documentation

- [Backup & Disaster Recovery](./runbooks/backup-and-dr.md) - DR cost implications and RTO/RPO targets
- [CI/CD Pipeline](./ci-cd-pipeline-upgrade.md) - GitHub Actions cost optimization
- [Deployment Guide](./DEPLOYMENT.md) - Infrastructure deployment

## Support

For cost-related questions or issues:
- DevOps Team: devops@mangu-publishing.com
- Finance Team: finance@mangu-publishing.com
- On-call: Check PagerDuty schedule
