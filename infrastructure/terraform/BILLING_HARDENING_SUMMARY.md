# Billing & Cost Monitoring Hardening - Complete

## Summary

Completed comprehensive hardening of AWS billing and cost anomaly monitoring configuration for MANGU Publishing.

## Changes Delivered

### 1. ✅ Parameterization (All Hard-Coded Values Removed)

**New Variables Added to `variables.tf`:**

```hcl
variable "monthly_budget_limit"         # Default: 1000 (was: 500)
variable "ecs_budget_limit"            # Default: 400 (was: 200)  
variable "rds_budget_limit"            # Default: 300 (was: 100)
variable "anomaly_absolute_threshold"  # Default: 50
variable "anomaly_impact_threshold"    # Default: 200
variable "budget_time_period_start"    # Default: "2024-01-01_00:00"
```

**Type Changes:**
- `monthly_budget_limit`: Changed from `string` to `number` for proper arithmetic operations
- Added `tostring()` conversions in `billing.tf` where AWS API requires string format

### 2. ✅ Enhanced Anomaly Detection

**Dual Threshold Configuration:**
```hcl
threshold_expression {
  or {
    dimension {
      key    = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      values = [tostring(var.anomaly_absolute_threshold)]  # $50 default
    }
  }
  or {
    dimension {
      key    = "ANOMALY_TOTAL_IMPACT_PERCENTAGE"
      values = [tostring(var.anomaly_impact_threshold)]   # 200% default
    }
  }
}
```

**Features:**
- Alerts trigger on **EITHER** absolute ($) OR percentage (%) thresholds
- `frequency = "IMMEDIATE"` for real-time notifications (already configured)
- Multi-dimensional monitoring: SERVICE + LINKED_ACCOUNT (already configured)

### 3. ✅ Improved Budget Notifications

**Enhanced All Three Budgets:**
- Monthly budget
- ECS service budget  
- RDS service budget

**Notification Levels (Applied to All):**
- 80% actual spending → Warning alert
- 90% forecasted spending → Proactive alert
- 100% actual spending → Critical alert

### 4. ✅ Lifecycle Protection

**Added to All Critical Resources:**
```hcl
lifecycle {
  prevent_destroy = true
}
```

**Protected Resources:**
- `aws_budgets_budget.monthly`
- `aws_budgets_budget.ecs_budget`
- `aws_budgets_budget.rds_budget`
- `aws_ce_anomaly_monitor.service_monitor`
- `aws_ce_anomaly_monitor.account_monitor`
- `aws_ce_anomaly_subscription.anomaly_alerts`

### 5. ✅ Enhanced Outputs for Automation

**New Outputs Added:**
```hcl
output "cost_anomaly_subscription_arn"  # For subscription management
output "billing_alert_email_count"      # Verify subscriptions
```

**Fixed Output:**
```hcl
output "cost_dashboard_url" {
  # Now includes region variable: https://${var.aws_region}.console...
}
```

**Existing Outputs (Preserved):**
- `sns_topic_arn`
- `budget_name`, `ecs_budget_name`, `rds_budget_name`
- `anomaly_monitor_arns` (service + account)

### 6. ✅ Comprehensive Documentation

**Created: `docs/COST_MONITORING_GUIDE.md`**

Includes:
- Architecture diagrams
- Configuration variable reference with environment-specific recommendations
- Complete setup checklist with AWS CLI validation commands
- Alert notification levels and response procedures
- Threshold tuning for dev/staging/production
- Common cost anomaly troubleshooting scenarios
- CI/CD integration examples (GitHub Actions)
- Lifecycle protection documentation
- Best practices and optimization checklists

### 7. ✅ Validation Script

**Created: `infrastructure/terraform/scripts/validate-billing.sh`**

Features:
- Terraform syntax validation
- Required variables check
- SNS subscription status (pending vs confirmed)
- AWS Budgets validation
- Anomaly monitor verification
- CloudWatch dashboard check
- Lifecycle protection verification
- Terraform plan drift detection

## File Changes

### Modified Files

1. **`infrastructure/terraform/variables.tf`**
   - Replaced `monthly_budget_limit` string with number type
   - Added 5 new variables for parameterization
   - Updated default values to safe production levels

2. **`infrastructure/terraform/billing.tf`**
   - Replaced all hard-coded values with variables
   - Added dual threshold expression for anomaly detection
   - Added forecast notifications to ECS and RDS budgets
   - Added lifecycle protection to 6 resources
   - Added 2 new outputs
   - Fixed dashboard URL to include region variable

3. **`docs/COST_MONITORING_GUIDE.md`**
   - Completely updated with new architecture
   - Added environment-specific threshold recommendations
   - Added detailed troubleshooting section
   - Added CI/CD integration examples
   - Added lifecycle protection documentation

### New Files

1. **`infrastructure/terraform/scripts/validate-billing.sh`** (executable)
   - Comprehensive validation script
   - AWS CLI integration for live checks
   - Color-coded output for easy scanning

## Deployment Instructions

### 1. Review Configuration

```bash
cd infrastructure/terraform

# Check current variable values
grep -A 1 "monthly_budget_limit\|ecs_budget_limit\|rds_budget_limit" terraform.tfvars
```

### 2. Update Variables (If Needed)

Edit `terraform.tfvars` to set environment-specific values:

```hcl
# Production example
monthly_budget_limit           = 5000
ecs_budget_limit              = 2000
rds_budget_limit              = 1500
anomaly_absolute_threshold    = 100
anomaly_impact_threshold      = 200

# Development example  
monthly_budget_limit           = 1000
ecs_budget_limit              = 400
rds_budget_limit              = 300
anomaly_absolute_threshold    = 25
anomaly_impact_threshold      = 150
```

### 3. Validate Configuration

```bash
# Run validation script
./scripts/validate-billing.sh

# Or manually validate
terraform validate
terraform fmt -check billing.tf variables.tf
```

### 4. Plan Changes

```bash
terraform plan -target=aws_budgets_budget.monthly \
               -target=aws_budgets_budget.ecs_budget \
               -target=aws_budgets_budget.rds_budget \
               -target=aws_ce_anomaly_subscription.anomaly_alerts

# Expected changes:
# - Budget limit values updated to use variables
# - Time period start updated to use variable
# - Anomaly threshold expression updated to dual threshold
# - Lifecycle blocks added (no resource recreation)
```

### 5. Apply Changes

```bash
# Apply billing updates
terraform apply -target=aws_budgets_budget.monthly \
                -target=aws_budgets_budget.ecs_budget \
                -target=aws_budgets_budget.rds_budget \
                -target=aws_ce_anomaly_subscription.anomaly_alerts

# Or apply all changes
terraform apply --auto-approve
```

**Note:** Lifecycle protection prevents accidental destruction of existing resources.

### 6. Verify Deployment

```bash
# Check outputs
terraform output sns_topic_arn
terraform output cost_dashboard_url
terraform output cost_anomaly_subscription_arn
terraform output billing_alert_email_count

# Validate SNS subscriptions
aws sns list-subscriptions-by-topic \
  --topic-arn $(terraform output -raw sns_topic_arn)

# Check budget configuration
aws budgets describe-budgets \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --max-results 10

# Verify anomaly monitors
aws ce get-anomaly-monitors --max-results 10
```

### 7. Confirm Email Subscriptions

**Important:** Team members must confirm SNS email subscriptions.

1. Check inbox for AWS notification emails
2. Click confirmation link in each email
3. Verify with: `./scripts/validate-billing.sh`

## Testing Procedure

### 1. Test SNS Notification

```bash
aws sns publish \
  --topic-arn $(terraform output -raw sns_topic_arn) \
  --subject "Test Cost Alert" \
  --message "This is a test notification from Terraform billing monitoring"
```

**Expected:** Email received within 1-2 minutes.

### 2. Monitor Cost Explorer

```bash
# Check current month spending
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '1 month ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost

# View by service
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '7 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

### 3. Simulate Budget Alert (Optional)

**Warning:** This creates actual AWS charges.

```bash
# Create a small EC2 instance to trigger alerts if near threshold
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.small \
  --count 1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Project,Value=MANGU-Publishing},{Key=Environment,Value=test}]'

# Monitor budget after 1 hour
aws budgets describe-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget-name mangu-publishing-monthly-budget-production

# Clean up test instance
aws ec2 terminate-instances --instance-ids <instance-id>
```

## Configuration Comparison

### Before (Hard-Coded)

```hcl
limit_amount      = "500"              # ❌ Hard-coded
time_period_start = "2025-01-01_00:00" # ❌ Hard-coded
threshold_expression {
  dimension {
    values = ["50"]                    # ❌ Hard-coded
  }
}
# ❌ No lifecycle protection
# ❌ Only 80% notification threshold
```

### After (Parameterized & Hardened)

```hcl
limit_amount      = tostring(var.monthly_budget_limit)  # ✅ Variable
time_period_start = var.budget_time_period_start        # ✅ Variable
threshold_expression {
  or {
    dimension { values = [tostring(var.anomaly_absolute_threshold)] }  # ✅ Variable
  }
  or {
    dimension { values = [tostring(var.anomaly_impact_threshold)] }    # ✅ Variable
  }
}
lifecycle {
  prevent_destroy = true  # ✅ Protected
}
# ✅ 80%, 90% forecasted, 100% notifications
```

## Environment-Specific Recommendations

### Development

```hcl
monthly_budget_limit           = 1000
ecs_budget_limit              = 400
rds_budget_limit              = 300
anomaly_absolute_threshold    = 25   # Catch issues early
anomaly_impact_threshold      = 150
```

### Staging

```hcl
monthly_budget_limit           = 2000
ecs_budget_limit              = 800
rds_budget_limit              = 600
anomaly_absolute_threshold    = 50
anomaly_impact_threshold      = 175
```

### Production

```hcl
monthly_budget_limit           = 5000
ecs_budget_limit              = 2000
rds_budget_limit              = 1500
anomaly_absolute_threshold    = 100  # Reduce false positives
anomaly_impact_threshold      = 200
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Cost Monitoring Check

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM
  workflow_dispatch:

jobs:
  check-costs:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          
      - name: Check Recent Anomalies
        run: |
          ANOMALIES=$(aws ce get-anomalies \
            --date-interval Start=$(date -u -d '1 day ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
            --max-results 5 \
            --query 'Anomalies[?Impact.MaxImpact > `50`]')
          
          if [ "$(echo "$ANOMALIES" | jq 'length')" -gt 0 ]; then
            echo "::warning::Cost anomalies detected"
            echo "$ANOMALIES" | jq .
          fi
      
      - name: Check Budget Status
        run: |
          ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
          aws budgets describe-budgets --account-id $ACCOUNT_ID | \
            jq '.Budgets[] | {name: .BudgetName, limit: .BudgetLimit.Amount, calculated: .CalculatedSpend.ActualSpend.Amount}'
```

## Maintenance

### Monthly Tasks

- [ ] Review anomaly detection patterns in Cost Explorer
- [ ] Adjust budget limits based on growth trends
- [ ] Verify all SNS subscriptions are active
- [ ] Review top 5 cost-driving services
- [ ] Update documentation with new patterns

### Quarterly Tasks

- [ ] Re-evaluate threshold values for all environments
- [ ] Review lifecycle protection requirements
- [ ] Update terraform.tfvars with new budget projections
- [ ] Archive old Cost Explorer data
- [ ] Conduct cost optimization review

## Rollback Procedure

If issues occur, revert using Git:

```bash
# View changes
git diff HEAD infrastructure/terraform/billing.tf
git diff HEAD infrastructure/terraform/variables.tf

# Revert specific files
git checkout HEAD~1 infrastructure/terraform/billing.tf
git checkout HEAD~1 infrastructure/terraform/variables.tf

# Apply old configuration
terraform plan
terraform apply
```

**Note:** Lifecycle protection prevents accidental resource deletion during rollback.

## Support

### Documentation References

- **Setup Guide**: `docs/COST_MONITORING_GUIDE.md`
- **Variable Reference**: `infrastructure/terraform/variables.tf`
- **Validation Script**: `infrastructure/terraform/scripts/validate-billing.sh`

### AWS Resources

- [AWS Budgets Documentation](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
- [Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html)
- [SNS Documentation](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)

### Troubleshooting

Run validation script for comprehensive diagnostics:

```bash
cd infrastructure/terraform
./scripts/validate-billing.sh
```

For specific issues, see **Troubleshooting** section in `docs/COST_MONITORING_GUIDE.md`.

## Completion Checklist

- [x] Parameterize all hard-coded values (6 new variables)
- [x] Enhance anomaly detection (dual thresholds: absolute + percentage)
- [x] Add lifecycle protection (6 resources protected)
- [x] Improve budget notifications (3-tier: 80%, 90% forecast, 100%)
- [x] Add automation outputs (2 new outputs)
- [x] Fix dashboard URL (include region variable)
- [x] Create comprehensive documentation (COST_MONITORING_GUIDE.md)
- [x] Create validation script (validate-billing.sh)
- [x] Test Terraform syntax (terraform validate ✓)
- [x] Test Terraform formatting (terraform fmt -check ✓)

## Next Steps

1. **Immediate**: Review and apply Terraform changes
2. **Within 24 hours**: Confirm SNS email subscriptions
3. **Within 7 days**: Monitor anomaly detection baseline establishment
4. **Within 30 days**: Review first month's cost patterns and adjust thresholds
5. **Ongoing**: Run `./scripts/validate-billing.sh` weekly

---

**Deployment Status**: ✅ Ready for Production

**Last Updated**: 2024-11-11

**Terraform Version**: >= 1.5.0  
**AWS Provider Version**: ~> 5.0
