# Security & Compliance Quick Start

Get your MANGU Publishing security infrastructure up and running in minutes.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform installed (v1.5+)
- GitHub repository secrets configured
- Snyk account for dependency scanning

## Step 1: Deploy IAM Infrastructure (5 minutes)

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Review IAM resources
terraform plan -target=module.iam

# Deploy IAM roles and policies
terraform apply -target=aws_iam_role.ecs_task_execution_role \
                -target=aws_iam_role.ecs_task_role \
                -target=aws_iam_role.github_actions_role \
                -target=aws_iam_policy.service_boundary

# Verify deployment
aws iam list-roles --query 'Roles[?contains(RoleName, `mangu-publishing`)].RoleName'
```

**Expected Output:**
```
mangu-publishing-production-ecs-task-execution
mangu-publishing-production-ecs-task
mangu-publishing-production-github-actions
```

## Step 2: Enable CloudTrail Logging (3 minutes)

```bash
# Deploy CloudTrail infrastructure
terraform apply -target=aws_cloudtrail.main \
                -target=aws_s3_bucket.cloudtrail_logs \
                -target=aws_kms_key.cloudtrail

# Verify CloudTrail is active
aws cloudtrail get-trail-status --name mangu-publishing-production-trail

# Check log delivery
aws s3 ls s3://mangu-publishing-production-cloudtrail-logs/AWSLogs/
```

## Step 3: Configure Security Scanning (2 minutes)

```bash
# Add GitHub secrets for security scanning
gh secret set SNYK_TOKEN --body "YOUR_SNYK_TOKEN"
gh secret set AWS_ROTATION_ROLE_ARN --body "ARN_FROM_TERRAFORM_OUTPUT"

# Trigger initial security scan
gh workflow run security.yml

# View scan results
gh run list --workflow=security.yml
```

## Step 4: Set Up Secret Rotation (5 minutes)

```bash
# Create initial secrets in AWS Secrets Manager
aws secretsmanager create-secret \
    --name mangu-publishing-production-jwt-secret \
    --secret-string '{"primary":"'$(openssl rand -base64 64)'","created_at":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'

aws secretsmanager create-secret \
    --name mangu-publishing-production-db-credentials \
    --secret-string '{"username":"dbadmin","password":"'$(openssl rand -base64 32)'"}'

# Test rotation script (dry run)
DRY_RUN=true scripts/rotate-secrets.sh rotate

# Verify secrets exist
aws secretsmanager list-secrets --query 'SecretList[?contains(Name, `mangu-publishing`)].Name'
```

## Step 5: Deploy Compliance Reporting (3 minutes)

```bash
# Deploy Lambda function
cd infrastructure/terraform
terraform apply -target=aws_lambda_function.compliance_report \
                -target=aws_cloudwatch_event_rule.daily_compliance_report

# Test compliance report generation
aws lambda invoke \
    --function-name mangu-publishing-production-compliance-report \
    --payload '{}' \
    response.json

# View report
aws s3 ls s3://mangu-publishing-production-compliance-reports/compliance-reports/production/ --recursive
```

## Step 6: Configure Monitoring (2 minutes)

```bash
# Subscribe to security alerts
aws sns subscribe \
    --topic-arn $(terraform output -raw security_alerts_topic_arn) \
    --protocol email \
    --notification-endpoint security@mangupublishing.com

# Confirm subscription (check email)

# Test alert
aws cloudwatch put-metric-data \
    --namespace mangu-publishing/production/Security \
    --metric-name UnauthorizedAPICalls \
    --value 10
```

## Verification Checklist

Run these commands to verify everything is working:

```bash
# ✅ IAM roles exist
aws iam get-role --role-name mangu-publishing-production-ecs-task-execution

# ✅ CloudTrail is logging
aws cloudtrail get-trail-status --name mangu-publishing-production-trail | jq '.IsLogging'

# ✅ Security scanning workflow exists
gh workflow view security.yml

# ✅ Secrets are created
aws secretsmanager list-secrets | jq '.SecretList[] | select(.Name | contains("mangu-publishing")) | .Name'

# ✅ Compliance reports are generated
aws s3 ls s3://mangu-publishing-production-compliance-reports/

# ✅ Alarms are configured
aws cloudwatch describe-alarms --alarm-name-prefix mangu-publishing-production
```

## Quick Reference Commands

### View Security Posture
```bash
# Recent security events
aws logs tail /aws/cloudtrail/mangu-publishing-production --follow

# Active alarms
aws cloudwatch describe-alarms --state-value ALARM

# Latest compliance report
aws s3 cp s3://mangu-publishing-production-compliance-reports/compliance-reports/production/$(date +%Y-%m-%d)/report.json - | jq '.summary'
```

### Trigger Manual Operations
```bash
# Run security scan
gh workflow run security.yml

# Rotate secrets
gh workflow run secret-rotation.yml -f environment=production -f dry_run=false

# Generate compliance report
aws lambda invoke --function-name mangu-publishing-production-compliance-report response.json
```

### Emergency Procedures
```bash
# Rollback secret rotation
scripts/rotate-secrets.sh rollback mangu-publishing-production-jwt-secret

# Disable compromised IAM role
aws iam attach-role-policy --role-name COMPROMISED_ROLE --policy-arn arn:aws:iam::aws:policy/AWSDenyAll

# Review recent API calls
aws cloudtrail lookup-events --lookup-attributes AttributeKey=Username,AttributeValue=SUSPICIOUS_USER --max-results 50
```

## Troubleshooting

### Issue: Security scan fails

**Solution:**
```bash
# Check SNYK_TOKEN is set
gh secret list | grep SNYK_TOKEN

# Verify Docker builds
docker build -t test -f Dockerfile .

# Check workflow logs
gh run view --log
```

### Issue: Secret rotation fails

**Solution:**
```bash
# Check IAM permissions
aws sts get-caller-identity

# Verify secrets exist
aws secretsmanager describe-secret --secret-id SECRET_NAME

# Check rotation logs
tail -f /var/log/mangu-publishing/secret-rotation.log
```

### Issue: CloudTrail not logging

**Solution:**
```bash
# Verify trail status
aws cloudtrail get-trail-status --name mangu-publishing-production-trail

# Check S3 bucket policy
aws s3api get-bucket-policy --bucket mangu-publishing-production-cloudtrail-logs

# Test log delivery
aws cloudtrail lookup-events --max-results 10
```

## Cost Estimate

Monthly costs for security infrastructure:

| Service | Usage | Cost |
|---------|-------|------|
| CloudTrail | Multi-region | $5 |
| S3 (Logs) | 50GB | $1 |
| CloudWatch Logs | 10GB | $5 |
| Secrets Manager | 5 secrets | $2 |
| Lambda | 100 invocations | $0.20 |
| SNS | 1000 notifications | $0.50 |
| **Total** | | **~$14/month** |

## Next Steps

1. **Review Documentation**: Read [SECURITY_COMPLIANCE.md](./SECURITY_COMPLIANCE.md) for detailed information
2. **Schedule Audits**: Set up quarterly security reviews
3. **Train Team**: Conduct security awareness training
4. **Test Procedures**: Run incident response drills
5. **Monitor Continuously**: Set up dashboards for security metrics

## Support

- **Documentation**: `/docs/SECURITY_COMPLIANCE.md`
- **Issues**: Create GitHub issue with `security` label
- **Emergency**: security@mangupublishing.com
- **On-Call**: PagerDuty integration

## Resources

- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [GitHub Security Features](https://docs.github.com/en/code-security)
- [Terraform Security](https://developer.hashicorp.com/terraform/cloud-docs/policy-enforcement)
- [OWASP Guidelines](https://owasp.org/www-project-top-ten/)
