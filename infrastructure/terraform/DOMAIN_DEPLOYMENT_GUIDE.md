# Domain Deployment Guide

This guide walks you through deploying the domain setup with Route53 DNS and ACM SSL certificates.

## Prerequisites

- Domain name configured in `terraform.tfvars` (currently: `publishing.mangu.com`)
- AWS credentials configured with appropriate permissions
- Terraform initialized and state backend configured

## Deployment Steps

### Step 1: Review Configuration

Verify your domain name in `terraform.tfvars`:
```hcl
domain_name = "publishing.mangu.com"
```

Ensure `create_acm_certificate = true` (default) to create new certificates.

### Step 2: Initialize Terraform (if needed)

```bash
cd infrastructure/terraform
terraform init
```

### Step 3: Plan Changes

Review what Terraform will create:
```bash
terraform plan
```

Expected changes:
- Create Route53 hosted zone
- Request ACM certificates (CloudFront and ALB)
- Create DNS validation records in Route53
- Create DNS A records pointing to CloudFront
- Update ECS task definitions with new environment variables

### Step 4: Apply Infrastructure

```bash
terraform apply
```

This will:
1. Create Route53 hosted zone for your domain
2. Request ACM certificates for CloudFront (us-east-1) and ALB
3. Automatically create DNS validation records in Route53
4. Wait for certificate validation (usually 5-30 minutes)
5. Create DNS A records (Alias) for root domain and www pointing to CloudFront
6. Update ECS task definitions with production domain URLs

**Note**: Certificate validation may take 5-30 minutes. Terraform will wait automatically.

### Step 5: Get Route53 Name Servers

After successful apply, get the name servers:
```bash
terraform output route53_name_servers
```

You'll see output like:
```
route53_name_servers = [
  "ns-123.awsdns-12.com",
  "ns-456.awsdns-45.net",
  "ns-789.awsdns-78.org",
  "ns-012.awsdns-01.co.uk"
]
```

### Step 6: Update Domain Registrar

1. Log in to your domain registrar (where you purchased the domain)
2. Navigate to DNS/Nameserver settings
3. Replace existing name servers with the Route53 name servers from Step 5
4. Save changes

**Important**: DNS propagation can take 24-48 hours globally.

### Step 7: Verify DNS Propagation

Check DNS resolution:
```bash
dig publishing.mangu.com +short
dig www.publishing.mangu.com +short
```

Or use online tools:
- https://dnschecker.org/
- https://www.whatsmydns.net/

### Step 8: Verify SSL Certificates

Test HTTPS access:
```bash
curl -I https://publishing.mangu.com
curl -I https://www.publishing.mangu.com
```

Check certificate details:
```bash
openssl s_client -connect publishing.mangu.com:443 -servername publishing.mangu.com
```

### Step 9: Run Verification Script

Test all endpoints:
```bash
cd /path/to/project/root
BASE_URL=https://publishing.mangu.com ./verify-tool.sh
```

### Step 10: Verify Application

1. Visit `https://publishing.mangu.com` in browser
2. Test API endpoints: `https://publishing.mangu.com/api/health`
3. Verify CORS is working (check browser console)
4. Test authentication flows

## Troubleshooting

### Certificate Validation Taking Too Long

If certificate validation is stuck:
1. Check Route53 validation records exist:
   ```bash
   aws route53 list-resource-record-sets --hosted-zone-id $(terraform output -raw route53_zone_id) | grep acm
   ```
2. Verify DNS validation records are correct
3. Check ACM certificate status:
   ```bash
   aws acm list-certificates --region us-east-1
   ```

### DNS Not Resolving

1. Verify name servers updated at registrar
2. Wait 24-48 hours for full propagation
3. Check Route53 hosted zone status:
   ```bash
   aws route53 get-hosted-zone --id $(terraform output -raw route53_zone_id)
   ```

### CloudFront Not Accessible

1. Check CloudFront distribution status:
   ```bash
   aws cloudfront get-distribution --id $(terraform output -raw cloudfront_distribution_id)
   ```
2. Verify aliases match domain name
3. Check WAF rules aren't blocking traffic
4. CloudFront changes take 15-30 minutes to deploy

### CORS Errors

1. Verify ECS task has correct CORS_ORIGINS environment variable
2. Check server logs for CORS errors
3. Ensure domain matches exactly (including https://)

## Post-Deployment

1. Monitor CloudWatch logs for errors
2. Set up DNS health checks in Route53 (optional)
3. Configure monitoring alerts
4. Document DNS configuration for team
5. Update any CI/CD pipelines with new domain

## Rollback

If you need to rollback:
1. Remove DNS records: `terraform destroy -target=aws_route53_record.root -target=aws_route53_record.www`
2. Remove Route53 zone: `terraform destroy -target=aws_route53_zone.main`
3. Note: ACM certificates will remain (can be reused)

## Key Outputs

After deployment, useful outputs:
- `route53_zone_id` - Route53 hosted zone ID
- `route53_name_servers` - Name servers for domain registrar
- `cloudfront_distribution_id` - CloudFront distribution ID
- `cloudfront_domain_name` - CloudFront distribution domain
- `certificate_arn` - ACM certificate ARN for CloudFront
- `alb_certificate_arn` - ACM certificate ARN for ALB

View all outputs:
```bash
terraform output
```



