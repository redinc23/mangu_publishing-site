# Billing Configuration Quick Reference

## 🚀 Quick Deploy

```bash
cd infrastructure/terraform

# 1. Validate
terraform validate  # (ignore security group cycle - unrelated)
./scripts/validate-billing.sh

# 2. Review changes
terraform plan -target=aws_budgets_budget.monthly \
               -target=aws_budgets_budget.ecs_budget \
               -target=aws_budgets_budget.rds_budget \
               -target=aws_ce_anomaly_subscription.anomaly_alerts

# 3. Apply
terraform apply --auto-approve

# 4. Verify
terraform output sns_topic_arn
aws sns list-subscriptions-by-topic --topic-arn $(terraform output -raw sns_topic_arn)
```

## 📊 Default Configuration

| Resource | Default Limit | Alert Thresholds |
|----------|---------------|------------------|
| Monthly Budget | $1,000 | 80%, 90% forecast, 100% |
| ECS Budget | $400 | 80%, 90% forecast, 100% |
| RDS Budget | $300 | 80%, 90% forecast, 100% |
| Anomaly Detection | $50 OR 200% | Immediate notification |

## 🔧 Environment Overrides

### Development
```hcl
monthly_budget_limit = 1000
ecs_budget_limit = 400
rds_budget_limit = 300
anomaly_absolute_threshold = 25
```

### Production
```hcl
monthly_budget_limit = 5000
ecs_budget_limit = 2000
rds_budget_limit = 1500
anomaly_absolute_threshold = 100
```

Add to `terraform.tfvars` and run `terraform apply`.

## ✅ Verification Commands

```bash
# Test SNS
aws sns publish --topic-arn $(terraform output -raw sns_topic_arn) \
  --subject "Test" --message "Test alert"

# Check budgets
aws budgets describe-budgets \
  --account-id $(aws sts get-caller-identity --query Account --output text)

# View anomalies
aws ce get-anomalies \
  --date-interval Start=$(date -u -d '7 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d)

# Dashboard
echo $(terraform output -raw cost_dashboard_url)
```

## 📧 Email Confirmation Required

After deployment, team members must:
1. Check inbox for AWS notification emails
2. Click confirmation link
3. Verify: `./scripts/validate-billing.sh`

## 🛡️ Protected Resources

All billing resources have `lifecycle { prevent_destroy = true }`:
- Monthly, ECS, RDS budgets
- Service and account anomaly monitors
- Anomaly subscription

Safe to run `terraform apply` - no risk of deletion.

## 📚 Full Documentation

- **Setup Guide**: `docs/COST_MONITORING_GUIDE.md`
- **Summary**: `BILLING_HARDENING_SUMMARY.md`
- **Variables**: `variables.tf` (lines 140-167)
- **Configuration**: `billing.tf`

## 🚨 Alert Response

### Budget Alert (80%)
→ Review Cost Explorer → Scale down if needed

### Anomaly Alert
→ Check AWS Cost Explorer Anomaly page → Investigate spike cause

### Dashboard
→ CloudWatch → Dashboards → `mangu-publishing-cost-dashboard-{env}`

## 🔍 Troubleshooting

```bash
# Run comprehensive validation
./scripts/validate-billing.sh

# Check SNS subscriptions
aws sns list-subscriptions-by-topic \
  --topic-arn $(terraform output -raw sns_topic_arn)

# Verify budgets exist
aws budgets describe-budgets \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  | jq '.Budgets[] | {name: .BudgetName, limit: .BudgetLimit.Amount}'
```

## 📞 Support

| Issue | Action |
|-------|--------|
| No email alerts | Check spam, verify SNS confirmation |
| Budget not tracking | Verify resource tags (Project=MANGU-Publishing) |
| Anomaly silence | Wait 7-10 days for baseline learning |
| Validation errors | Run `./scripts/validate-billing.sh` for diagnosis |

---

**Last Updated**: 2024-11-11  
**Terraform**: >= 1.5.0 | **AWS Provider**: ~> 5.0
