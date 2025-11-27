# ACM Certificate Automation Guide

## Overview

This guide explains the automated ACM certificate workflow for MANGU Publishing infrastructure. Certificates are now **automatically created** by Terraform, eliminating manual ARN copy-paste and enabling infrastructure-as-code certificate management.

## Architecture

### Two Certificate Strategy

1. **CloudFront Certificate** (us-east-1 only)
   - Provider: `aws.us_east_1`
   - Usage: CloudFront distribution viewer certificate
   - Covers: `mangu-publishing.com`, `www.mangu-publishing.com`, `*.mangu-publishing.com`

2. **ALB Certificate** (regional, typically us-east-1)
   - Provider: `aws` (default/main region)
   - Usage: Application Load Balancer HTTPS listener
   - Covers: `mangu-publishing.com`, `www.mangu-publishing.com`, `*.mangu-publishing.com`

### Why Two Certificates?

- **CloudFront Requirement**: CloudFront distributions MUST use certificates from us-east-1
- **Regional ALB**: ALB certificates must be in the same region as the ALB
- **Terraform Best Practice**: Separate certificates prevent cross-region dependency issues

## Quick Start

### Scenario 1: First-Time Setup (No Route53 - Manual DNS)

This is the **recommended workflow** when DNS is managed outside AWS (e.g., Cloudflare, GoDaddy).

```bash
# Step 1: Configure Terraform
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars:
# domain_name = "mangu-publishing.com"
# create_acm_certificate = true
# route53_zone_id = ""  # Empty = manual DNS validation

# Step 2: Initial apply - creates certificate requests
terraform init
terraform apply

# ✅ Expected output:
# - ACM certificates created (status: PENDING_VALIDATION)
# - DNS validation records exposed in outputs

# Step 3: View DNS records to add
terraform output cloudfront_dns_validation_records
terraform output alb_dns_validation_records

# Example output:
# [
#   {
#     "domain_name" = "mangu-publishing.com"
#     "name" = "_abc123.mangu-publishing.com"
#     "type" = "CNAME"
#     "value" = "_xyz456.acm-validations.aws."
#   }
# ]

# Step 4: Add CNAME records to your DNS provider
# - Both certificates often share the same validation record
# - Typical DNS propagation: 5-15 minutes

# Step 5: Verify DNS propagation
dig _abc123.mangu-publishing.com CNAME +short
# Should return: _xyz456.acm-validations.aws.

# Step 6: Re-apply to complete validation and create dependent resources
terraform apply

# ✅ Certificates will validate (status: ISSUED)
# ✅ CloudFront and ALB will be created with valid certificates
```

### Scenario 2: Automated Validation (With Route53)

If Route53 hosted zone is managed in the same AWS account:

```bash
# Configure terraform.tfvars:
domain_name = "mangu-publishing.com"
create_acm_certificate = true
route53_zone_id = "Z1234567890ABC"  # Your Route53 zone ID

# Single apply - fully automated
terraform apply

# ✅ Certificates created
# ✅ DNS records added automatically
# ✅ Validation completes
# ✅ CloudFront/ALB created
```

### Scenario 3: Using Existing Certificates

If you already have ACM certificates and want to use them:

```bash
# Configure terraform.tfvars:
domain_name = "mangu-publishing.com"
create_acm_certificate = false
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/abc-123"

terraform apply
```

## Terraform Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `domain_name` | string | `"mangu-publishing.com"` | Primary domain name |
| `create_acm_certificate` | bool | `true` | Enable automated certificate creation |
| `route53_zone_id` | string | `""` | Route53 zone ID for automatic DNS validation |
| `certificate_arn` | string | `""` | Existing certificate ARN (if `create_acm_certificate = false`) |

## Terraform Outputs

### Certificate ARNs
```hcl
output "certificate_arn"         # CloudFront certificate ARN
output "alb_certificate_arn"     # ALB certificate ARN
```

### Certificate Status
```hcl
output "cloudfront_certificate_status"  # PENDING_VALIDATION | ISSUED | FAILED
output "alb_certificate_status"         # PENDING_VALIDATION | ISSUED | FAILED
```

### DNS Validation Records
```hcl
output "cloudfront_dns_validation_records"  # CNAME records for CloudFront cert
output "alb_dns_validation_records"         # CNAME records for ALB cert
output "acm_validation_instructions"        # Human-readable instructions
```

## DNS Validation Record Format

When `route53_zone_id` is empty, you'll receive output like this:

```json
[
  {
    "domain_name": "mangu-publishing.com",
    "name": "_a1b2c3d4e5f6.mangu-publishing.com",
    "type": "CNAME",
    "value": "_x1y2z3.acm-validations.aws.",
    "instruction": "Add CNAME: _a1b2c3d4e5f6.mangu-publishing.com → _x1y2z3.acm-validations.aws."
  },
  {
    "domain_name": "*.mangu-publishing.com",
    "name": "_a1b2c3d4e5f6.mangu-publishing.com",
    "type": "CNAME",
    "value": "_x1y2z3.acm-validations.aws.",
    "instruction": "Add CNAME: _a1b2c3d4e5f6.mangu-publishing.com → _x1y2z3.acm-validations.aws."
  }
]
```

**Important Notes:**
- All domains (apex, www, wildcard) often share **one validation record**
- CloudFront and ALB certificates may use **the same validation record**
- You typically only need to add **one CNAME** to validate everything

## Adding DNS Records by Provider

### Cloudflare
```
1. Log in to Cloudflare dashboard
2. Select your domain
3. Go to DNS → Records
4. Click "Add record"
5. Type: CNAME
6. Name: _a1b2c3d4e5f6 (remove domain suffix)
7. Target: _x1y2z3.acm-validations.aws.
8. TTL: Auto
9. Proxy status: DNS only (gray cloud)
10. Save
```

### GoDaddy
```
1. Log in to GoDaddy
2. My Products → DNS
3. Select domain
4. Add → CNAME
5. Host: _a1b2c3d4e5f6
6. Points to: _x1y2z3.acm-validations.aws.
7. TTL: 1 Hour
8. Save
```

### Google Domains
```
1. Log in to Google Domains
2. Select domain → DNS
3. Custom records → Manage custom records
4. Create new record
5. Host name: _a1b2c3d4e5f6
6. Type: CNAME
7. Data: _x1y2z3.acm-validations.aws.
8. Save
```

### Route53 (Manual)
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_a1b2c3d4e5f6.mangu-publishing.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "_x1y2z3.acm-validations.aws."}]
      }
    }]
  }'
```

## Validation Timeline

| Stage | Duration | Status |
|-------|----------|--------|
| Certificate request | Instant | `PENDING_VALIDATION` |
| DNS record addition | Manual (5-10 min) | `PENDING_VALIDATION` |
| DNS propagation | 5-15 minutes | `PENDING_VALIDATION` |
| ACM validation check | 5-10 minutes | `ISSUED` ✅ |
| **Total time** | **15-35 minutes** | |

## Troubleshooting

### Issue: Certificates Stuck in PENDING_VALIDATION

**Cause:** DNS records not added or not propagated

**Solution:**
```bash
# Check DNS propagation
dig _a1b2c3d4e5f6.mangu-publishing.com CNAME +short

# Verify ACM is checking
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT:certificate/ID \
  --region us-east-1

# Re-apply Terraform (safe to run multiple times)
terraform apply
```

### Issue: Validation Timeout After 30 Minutes

**Cause:** DNS records incorrect or still propagating

**Solution:**
```bash
# Verify exact record values match
terraform output cloudfront_dns_validation_records

# Check DNS with multiple resolvers
dig @8.8.8.8 _abc.mangu-publishing.com CNAME
dig @1.1.1.1 _abc.mangu-publishing.com CNAME

# Increase timeout and re-apply
terraform apply
```

### Issue: "Error creating CloudFront Distribution: InvalidViewerCertificate"

**Cause:** Certificate not in us-east-1 or not ISSUED

**Solution:**
```bash
# Check certificate region
terraform output certificate_arn
# Must be: arn:aws:acm:us-east-1:...

# Check certificate status
terraform output cloudfront_certificate_status
# Must be: ISSUED

# Wait for validation, then re-apply
terraform apply
```

### Issue: Different Validation Records for CloudFront vs ALB

**Cause:** ACM generates unique validation tokens per certificate request

**Solution:**
```bash
# Add ALL unique records shown in outputs
terraform output cloudfront_dns_validation_records
terraform output alb_dns_validation_records

# If records differ, add both to DNS
# This is normal and expected behavior
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Terraform Apply with ACM

on:
  push:
    branches: [main]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      
      - name: Terraform Init
        run: |
          cd infrastructure/terraform
          terraform init
      
      - name: Terraform Plan
        id: plan
        run: |
          cd infrastructure/terraform
          terraform plan -out=tfplan
      
      - name: Check Certificate Status
        id: cert_check
        run: |
          cd infrastructure/terraform
          STATUS=$(terraform output -raw cloudfront_certificate_status || echo "NONE")
          echo "status=$STATUS" >> $GITHUB_OUTPUT
      
      - name: Terraform Apply (Phase 1 - Certificate Request)
        if: steps.cert_check.outputs.status == 'PENDING_VALIDATION'
        run: |
          cd infrastructure/terraform
          terraform apply tfplan
          
          # Output DNS validation records
          echo "::group::CloudFront DNS Validation"
          terraform output cloudfront_dns_validation_records
          echo "::endgroup::"
          
          echo "::group::ALB DNS Validation"
          terraform output alb_dns_validation_records
          echo "::endgroup::"
          
          echo "::warning::DNS validation required. Add CNAME records and re-run workflow."
          exit 1  # Pause workflow
      
      - name: Terraform Apply (Phase 2 - Full Deploy)
        if: steps.cert_check.outputs.status == 'ISSUED' || steps.cert_check.outputs.status == 'NONE'
        run: |
          cd infrastructure/terraform
          terraform apply tfplan
```

### Manual CI/CD Workflow

**Step 1: Initial Deploy (Creates Certificates)**
```bash
# CI/CD Pipeline Step 1
cd infrastructure/terraform
terraform init
terraform apply -auto-approve

# Pipeline should FAIL/PAUSE here with output showing DNS records
terraform output acm_validation_instructions
```

**Step 2: Human Adds DNS Records**
```bash
# Manual step (ops team)
terraform output -json cloudfront_dns_validation_records | jq
# Add records to DNS provider
```

**Step 3: Re-run Deploy (Validates & Creates Resources)**
```bash
# CI/CD Pipeline Step 2 (after DNS records added)
cd infrastructure/terraform
terraform apply -auto-approve

# Success: All resources created with validated certificates
```

## Security Best Practices

### Certificate Lifecycle
- **Auto-renewal**: ACM automatically renews certificates before expiration
- **Validation persistence**: Keep DNS validation records in place indefinitely
- **No private keys exposed**: ACM manages private keys internally

### Terraform State Security
```hcl
# backend.tf - ensure state is encrypted
terraform {
  backend "s3" {
    bucket         = "mangu-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true  # ✅ Encrypt state
    kms_key_id     = "arn:aws:kms:..."  # Optional: use KMS key
    dynamodb_table = "mangu-terraform-locks"
  }
}
```

### Sensitive Outputs
```bash
# Certificate ARNs and validation records are marked sensitive
# View with explicit command
terraform output certificate_arn
terraform output -json cloudfront_dns_validation_records
```

## Migration from Manual Certificates

If you previously used manually-created certificates:

```bash
# Step 1: Import existing certificates (optional)
terraform import aws_acm_certificate.main[0] arn:aws:acm:us-east-1:ACCOUNT:certificate/ID
terraform import aws_acm_certificate.alb[0] arn:aws:acm:REGION:ACCOUNT:certificate/ID

# Step 2: Or switch to automated (recommended)
# Edit terraform.tfvars:
create_acm_certificate = true
certificate_arn = ""  # Remove old ARN

# Step 3: Apply (creates new certificates)
terraform apply

# Step 4: Wait for validation, re-apply
terraform apply

# Step 5: Delete old manual certificates from AWS console
```

## Cost Considerations

- **ACM Certificates**: FREE ✅
- **CloudFront with ACM**: No additional cost ✅
- **ALB with ACM**: No additional cost ✅
- **Route53 DNS queries**: ~$0.40/million queries (if using Route53)

**Total cost impact: $0 for certificates** 🎉

## Advanced Scenarios

### Multi-Region Deployments

```hcl
# Create certificates in each region where ALBs exist
resource "aws_acm_certificate" "alb_us_west_2" {
  provider = aws.us_west_2
  # ...
}

resource "aws_acm_certificate" "alb_eu_west_1" {
  provider = aws.eu_west_1
  # ...
}

# CloudFront still uses us-east-1 certificate
```

### Multiple Domains

```hcl
variable "additional_domains" {
  type    = list(string)
  default = ["blog.mangu-publishing.com", "api.mangu-publishing.com"]
}

resource "aws_acm_certificate" "main" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = concat(
    ["www.${var.domain_name}", "*.${var.domain_name}"],
    var.additional_domains
  )
  validation_method = "DNS"
}
```

### Certificate Replacement/Rotation

```bash
# Terraform handles this automatically with lifecycle
# Old certificate is NOT deleted until new one is ISSUED
# Zero-downtime certificate rotation

terraform apply  # Creates new cert
# Add DNS validation records
terraform apply  # Validates new cert, updates resources, deletes old cert
```

## Summary

✅ **Before**: Manual certificate creation, ARN copy-paste, error-prone
✅ **After**: Automated certificate creation, DNS validation, infrastructure-as-code

Key benefits:
- **No more manual ARN hunting** in AWS Console
- **Reproducible infrastructure** across environments
- **Version-controlled certificates** in Terraform
- **Automatic renewal** handled by ACM
- **Zero-downtime rotation** with lifecycle policies

## Support

For issues or questions:
1. Check Terraform outputs: `terraform output acm_validation_instructions`
2. Verify DNS propagation: `dig _abc.mangu-publishing.com CNAME`
3. Review CloudWatch Logs for certificate validation events
4. See [Troubleshooting](#troubleshooting) section above

## Related Documentation

- [AWS ACM User Guide](https://docs.aws.amazon.com/acm/)
- [CloudFront Certificate Requirements](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)
- [Terraform AWS ACM Certificate](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/acm_certificate)
