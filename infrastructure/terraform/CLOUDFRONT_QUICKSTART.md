# CloudFront Optimization - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
```bash
# AWS CLI configured
aws configure

# Terraform installed
terraform version  # v1.6+

# OpenSSL for secret generation
openssl version
```

### Step 1: Configure Variables (2 min)

```bash
cd infrastructure/terraform

# Generate origin verification secret
export ORIGIN_SECRET=$(openssl rand -base64 32)

# Add to terraform.tfvars
cat >> terraform.tfvars << EOF

# CloudFront Configuration
enable_geo_blocking = false
blocked_countries = []
enable_origin_shield = false
origin_verify_secret = "$ORIGIN_SECRET"
EOF
```

### Step 2: Deploy Infrastructure (3 min)

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan | grep -A 5 "cloudfront\|waf"

# Apply changes
terraform apply -auto-approve
```

### Step 3: Deploy Error Pages (30 sec)

```bash
# Deploy custom error pages
./scripts/deploy-error-pages.sh production
```

### Step 4: Test Configuration (1 min)

```bash
# Run comprehensive tests
./scripts/test-cloudfront.sh production

# Quick manual test
DOMAIN=$(terraform output -raw cloudfront_domain_name)
curl -I "https://$DOMAIN/" | grep -i "x-cache\|strict-transport"
```

## ✅ Verification Checklist

- [ ] CloudFront distribution deployed
- [ ] WAF Web ACL attached
- [ ] Security headers present
- [ ] Cache policies configured
- [ ] Error pages accessible
- [ ] HTTPS redirect working
- [ ] Compression enabled

## 📊 Quick Monitoring

### Cache Hit Rate
```bash
DIST_ID=$(terraform output -raw cloudfront_distribution_id)
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name CacheHitRate \
  --dimensions Name=DistributionId,Value=$DIST_ID \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### WAF Blocked Requests
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name BlockedRequests \
  --dimensions Name=WebACL,Value=mangu-publishing-cloudfront-waf-production Name=Region,Value=us-east-1 Name=Rule,Value=ALL \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

## 🔥 Common Operations

### Invalidate Cache

**Full site:**
```bash
./scripts/invalidate-cache.sh "/*" production
```

**Specific paths:**
```bash
./scripts/invalidate-cache.sh "/static/* /index.html" production
```

**Via SNS (automated):**
```bash
aws sns publish \
  --topic-arn $(terraform output -raw cache_invalidation_topic_arn) \
  --message '{"paths":["/static/*"],"type":"selective"}'
```

### View Logs

**CloudFront access logs:**
```bash
LOGS_BUCKET=$(terraform output -raw cloudfront_logs_bucket)
aws s3 ls "s3://$LOGS_BUCKET/cloudfront/" --recursive | tail -10
```

**Download recent logs:**
```bash
aws s3 cp "s3://$LOGS_BUCKET/cloudfront/" ./logs/ --recursive --exclude "*" --include "$(date +%Y-%m-%d)*"
```

### Update WAF Rules

**Adjust rate limit:**
```hcl
# In cloudfront.tf, find RateLimitRule
limit = 5000  # Increase from 2000
```

**Enable geo-blocking:**
```bash
# In terraform.tfvars
enable_geo_blocking = true
blocked_countries = ["CN", "RU", "KP"]

terraform apply
```

## 🐛 Troubleshooting

### Issue: Cache not working

**Check cache headers:**
```bash
curl -I "https://$(terraform output -raw cloudfront_domain_name)/assets/app.js"
# Look for: X-Cache: Hit from cloudfront
```

**Force bypass cache:**
```bash
curl -H "Cache-Control: no-cache" "https://your-domain.com/"
```

### Issue: WAF blocking legitimate traffic

**View blocked requests:**
```bash
aws wafv2 get-sampled-requests \
  --web-acl-arn $(terraform output -raw waf_web_acl_arn) \
  --rule-metric-name RateLimitRuleMetric \
  --scope CLOUDFRONT \
  --time-window StartTime=$(date -u -d '1 hour ago' +%s),EndTime=$(date -u +%s) \
  --max-items 100
```

**Temporarily disable rule:**
```hcl
# In cloudfront.tf, change action to count
action {
  count {}  # Instead of block
}
```

### Issue: Origin errors

**Check origin access:**
```bash
# Verify S3 bucket policy
aws s3api get-bucket-policy --bucket $(terraform output -raw static_assets_bucket_name)

# Test direct S3 access (should fail without CloudFront)
curl -I "https://$(terraform output -raw static_assets_bucket_name).s3.amazonaws.com/index.html"
```

## 📈 Performance Optimization

### Enable Origin Shield (reduces origin load 30-50%)
```hcl
# In terraform.tfvars
enable_origin_shield = true
```
💰 Cost: ~$0.01 per 10,000 requests

### Use versioned URLs (avoid invalidations)
```javascript
// Instead of invalidating
/static/book-cover.jpg → /static/book-cover.jpg?v=2

// With build tools
/assets/app.abc123.js  // Content hash in filename
```

### Optimize cache policies
```hcl
# For frequently updated content
default_ttl = 300  # 5 minutes

# For immutable assets
max_ttl = 31536000  # 1 year
```

## 🔐 Security Best Practices

### 1. Rotate origin verification secret regularly
```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Update terraform.tfvars
echo "origin_verify_secret = \"$NEW_SECRET\"" >> terraform.tfvars

# Apply changes
terraform apply
```

### 2. Monitor WAF alerts
```bash
# Set up SNS notifications for WAF
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:waf-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### 3. Review security headers
```bash
# Test security headers
curl -I "https://your-domain.com/" | grep -i "security\|content-security\|frame\|xss"
```

## 📚 Additional Resources

- [Full Documentation](./CLOUDFRONT_OPTIMIZATION_README.md)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [CloudFront Best Practices](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/best-practices.html)
- [WAF Managed Rules](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups.html)

## 🆘 Support

**Check logs:**
```bash
# CloudWatch Logs for Lambda
aws logs tail /aws/lambda/mangu-publishing-cache-invalidation-production --follow

# CloudFront access logs
./scripts/download-logs.sh
```

**Get help:**
- Slack: #devops-support
- Email: devops@mangu-publishing.com
- On-call: PagerDuty escalation

---

**Last Updated:** 2024-11-11  
**Version:** 1.0.0  
**Maintainer:** DevOps Team
