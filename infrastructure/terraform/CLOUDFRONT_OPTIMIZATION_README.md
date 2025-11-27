# CloudFront Optimization - Implementation Guide

## Overview

This implementation provides enterprise-grade CloudFront configuration with:
- **WAF Integration** - OWASP Top 10 protection
- **Advanced Caching** - Multiple cache policies for different content types
- **Security Headers** - Comprehensive response headers policy
- **Custom Error Pages** - Branded error and maintenance pages
- **Cache Invalidation** - Automated and manual invalidation strategies
- **Monitoring** - CloudWatch alarms for security and performance

## Architecture

```
User Request
     ↓
CloudFront (WAF Protected)
     ↓
┌────────────────────────────────────┐
│  Cache Behaviors:                  │
│  - /api/*      → ALB (no cache)    │
│  - /assets/*   → S3 (long cache)   │
│  - /static/*   → S3 (versioned)    │
│  - /uploads/*  → S3 (versioned)    │
│  - /*          → S3 (default)      │
└────────────────────────────────────┘
```

## Components Implemented

### 1. WAF Web ACL (`aws_wafv2_web_acl.cloudfront`)

**Managed Rule Sets:**
- AWS Common Rule Set (OWASP Core)
- Known Bad Inputs Rule Set
- SQL Injection Protection
- Linux OS Protection
- Rate Limiting (2000 req/5min per IP)
- Optional Geo-blocking

**Monitoring:**
- CloudWatch metrics enabled
- Sampled requests for analysis
- Custom rate limit response (429)

### 2. Cache Policies

#### Static Assets Policy
- **TTL:** 1 hour - 1 year (default 1 day)
- **Use Cases:** CSS, JS, fonts, immutable assets
- **Compression:** Gzip + Brotli
- **Headers:** Accept, Accept-Encoding

#### Dynamic Content Policy
- **TTL:** 0 - 1 day (default 1 hour)
- **Use Cases:** User uploads, versioned content
- **Compression:** Gzip + Brotli
- **Query Strings:** v, version, timestamp
- **Headers:** Accept, Accept-Encoding, CloudFront-Viewer-Country

### 3. Origin Request Policy

**API Origin Policy:**
- Forward all cookies
- Forward all query strings
- Include CloudFront viewer metadata
- Use for `/api/*` paths

### 4. Response Headers Policy

**Security Headers:**
- Content-Type-Options: nosniff
- Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- HSTS: 1 year with preload
- XSS-Protection: enabled with mode=block
- CSP: Restrictive content security policy
- Permissions-Policy: Restricted permissions

**CORS Configuration:**
- Allowed origins: Primary + www domain
- All methods supported
- Credentials allowed
- Max age: 24 hours

### 5. Cache Behaviors

```javascript
// Priority order (first match wins):
1. /api/*      - No caching, pass all headers/cookies to ALB
2. /assets/*   - Long-term caching from S3 static
3. /static/*   - Medium-term caching from S3 uploads (versioned)
4. /uploads/*  - Medium-term caching from S3 uploads (versioned)
5. /*          - Default behavior from S3 static
```

### 6. Custom Error Responses

| Error Code | Response | Page | TTL |
|------------|----------|------|-----|
| 403 | 200 | /index.html | 10s |
| 404 | 200 | /index.html | 10s |
| 500 | 500 | /error.html | 0s |
| 502 | 502 | /error.html | 0s |
| 503 | 503 | /maintenance.html | 0s |
| 504 | 504 | /error.html | 0s |

### 7. Origin Configuration

**S3 Origins:**
- Origin Access Control (OAC) for security
- Origin Shield (optional, controlled by variable)
- Custom verification header
- Regional domain names

**ALB Origin:**
- HTTPS only
- TLS 1.2 minimum
- 60s keepalive and read timeout
- Origin Shield (optional)
- Custom verification header

### 8. CloudFront Functions

**URL Rewrite Function:**
```javascript
// Location: functions/url-rewrite.js
// Purpose: SPA routing support
- Rewrite non-file requests to /index.html
- Add index.html to directory requests
- Normalize URLs (remove trailing slashes)
```

### 9. Lambda Functions

**Cache Invalidation Function:**
```javascript
// Location: lambda/index.js
// Trigger: SNS topic
// Purpose: Automated cache invalidation

// Message format:
{
  "paths": ["/static/*", "/api/books"],
  "type": "selective"  // or "full"
}
```

### 10. Monitoring & Alarms

**WAF Metrics:**
- Blocked requests > 1000 in 5 minutes
- Metric: AWS/WAFV2 BlockedRequests

**CloudFront Metrics:**
- 4xx error rate > 5%
- 5xx error rate > 1%
- Metrics: AWS/CloudFront error rates

## Variables

Add to `terraform.tfvars`:

```hcl
# Optional: Enable geo-blocking
enable_geo_blocking = false
blocked_countries   = ["CN", "RU"]  # ISO 3166-1 alpha-2

# Optional: Enable Origin Shield (additional cost)
enable_origin_shield = false

# Required: Origin verification secret
origin_verify_secret = "your-random-secret-here"
```

## Deployment

### Initial Setup

1. **Generate Origin Secret:**
```bash
export ORIGIN_SECRET=$(openssl rand -base64 32)
echo "origin_verify_secret = \"$ORIGIN_SECRET\"" >> terraform.tfvars
```

2. **Apply Terraform:**
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

3. **Deploy Error Pages:**
```bash
./scripts/deploy-error-pages.sh production
```

### Cache Invalidation Strategies

#### Manual Invalidation

**Full Cache Clear:**
```bash
./scripts/invalidate-cache.sh "/*" production
```

**Selective Invalidation:**
```bash
./scripts/invalidate-cache.sh "/static/*" production
./scripts/invalidate-cache.sh "/api/* /assets/*" production
```

**Via AWS CLI:**
```bash
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

#### Automated Invalidation

**Publish to SNS:**
```bash
aws sns publish \
  --topic-arn $(terraform output -raw cache_invalidation_topic_arn) \
  --message '{
    "paths": ["/static/*", "/uploads/*"],
    "type": "selective"
  }'
```

**From CI/CD:**
```yaml
# GitHub Actions example
- name: Invalidate CloudFront Cache
  run: |
    aws sns publish \
      --topic-arn ${{ secrets.CACHE_INVALIDATION_TOPIC }} \
      --message '{"paths":["/static/*"],"type":"selective"}'
```

### Monitoring

**View WAF Blocked Requests:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name BlockedRequests \
  --dimensions Name=WebACL,Value=mangu-publishing-cloudfront-waf-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

**Check Cache Hit Rate:**
```bash
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name CacheHitRate \
  --dimensions Name=DistributionId,Value=$DISTRIBUTION_ID \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average
```

## Best Practices

### Cache Key Design

**Immutable Assets (max caching):**
```
/assets/app.abc123.js
/assets/style.def456.css
```
- Use content hash in filename
- Set max TTL (1 year)
- Never invalidate (new version = new URL)

**Versioned Uploads (moderate caching):**
```
/static/book-cover.jpg?v=2
/uploads/author-photo.png?version=1234567890
```
- Use query string versioning
- TTL: 1 hour - 1 day
- Invalidate on version change

**Dynamic API (no caching):**
```
/api/books
/api/user/profile
```
- TTL: 0
- Pass all headers/cookies
- Use appropriate HTTP cache headers

### Security Headers Configuration

**Adjust CSP for your needs:**
```hcl
content_security_policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.com; ..."
```

**Customize CORS origins:**
```hcl
access_control_allow_origins {
  items = ["https://example.com", "https://www.example.com", "https://app.example.com"]
}
```

### Cost Optimization

**Origin Shield:**
- Enable for frequently accessed content
- Reduces origin load by 30-50%
- Additional cost per region
- Best for: High traffic sites

**Price Class:**
- Current: `PriceClass_100` (US, Canada, Europe)
- Global: `PriceClass_All`
- Cost vs Coverage tradeoff

**Invalidation Limits:**
- First 1000 paths/month: Free
- Additional: $0.005 per path
- Use versioning instead of invalidation

## Troubleshooting

### Cache Not Working

**Check Cache Policy:**
```bash
aws cloudfront get-cache-policy \
  --id $(aws cloudfront list-cache-policies --type managed --query "CachePolicyList.Items[?CachePolicy.CachePolicyConfig.Name=='Managed-CachingOptimized'].CachePolicy.Id" --output text)
```

**Verify Headers:**
```bash
curl -I https://your-domain.com/assets/app.js
# Look for: X-Cache: Hit from cloudfront
```

### WAF Blocking Legitimate Traffic

**Check WAF logs:**
```bash
aws wafv2 get-sampled-requests \
  --web-acl-arn $(terraform output -raw waf_web_acl_arn) \
  --rule-metric-name RateLimitRuleMetric \
  --scope CLOUDFRONT \
  --time-window StartTime=$(date -u -d '1 hour ago' +%s),EndTime=$(date -u +%s) \
  --max-items 100
```

**Adjust rate limit:**
```hcl
# In cloudfront.tf
rate_based_statement {
  limit              = 5000  # Increase from 2000
  aggregate_key_type = "IP"
}
```

### Origin Access Issues

**Verify OAC permissions:**
```bash
aws s3api get-bucket-policy --bucket mangu-publishing-static-production
```

**Test origin verification header:**
```bash
curl -H "X-Origin-Verify: your-secret" https://bucket.s3.amazonaws.com/path
```

## Outputs

After deployment, access these values:

```bash
# CloudFront Distribution ID
terraform output cloudfront_distribution_id

# CloudFront Domain Name
terraform output cloudfront_domain_name

# WAF Web ACL ARN
terraform output waf_web_acl_arn

# Cache Invalidation Topic
terraform output cache_invalidation_topic_arn

# Logs Bucket
terraform output cloudfront_logs_bucket
```

## Integration with CI/CD

**Deploy Flow:**
```yaml
1. Build assets with content hashing
2. Upload to S3 static bucket
3. Deploy error pages (if changed)
4. Update CloudFront (automatically picks up new files)
5. (Optional) Invalidate specific paths
```

**Example GitHub Actions:**
```yaml
- name: Deploy to CloudFront
  run: |
    # Upload assets
    aws s3 sync ./dist s3://${{ secrets.STATIC_BUCKET }}/assets/ --delete
    
    # Deploy error pages
    ./infrastructure/terraform/scripts/deploy-error-pages.sh
    
    # Invalidate if needed
    ./infrastructure/terraform/scripts/invalidate-cache.sh "/index.html /error.html"
```

## Maintenance Mode

**Enable maintenance mode:**
```bash
# Create temporary CloudFront behavior or update origin to serve maintenance.html
# Or update DNS to point to maintenance page
```

**Automated:**
```bash
# Create S3 file that triggers maintenance
echo "maintenance" > /tmp/maintenance-mode
aws s3 cp /tmp/maintenance-mode s3://bucket/.maintenance
```

## Additional Resources

- [CloudFront Developer Guide](https://docs.aws.amazon.com/cloudfront/)
- [WAF Developer Guide](https://docs.aws.amazon.com/waf/)
- [CloudFront Functions](https://docs.aws.amazon.com/cloudfront/latest/developerguide/cloudfront-functions.html)
- [Cache Key Best Practices](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html)

## Support

For issues or questions:
1. Check CloudWatch Logs
2. Review WAF sampled requests
3. Test with curl/browser dev tools
4. Contact DevOps team
