# CloudFront Origin Hardening & Lambda Build Automation

## Summary

Successfully hardened CloudFront S3 origins using OAC (Origin Access Control) and migrated Lambda function from committed binary to Terraform-managed build process.

## Changes Made

### 1. S3 Bucket Policy Hardening (`s3.tf`)

**Before**: Bucket policies only validated `AWS:SourceArn` from CloudFront distribution.

**After**: Enhanced security with dual-statement policy:
- **Allow Statement**: CloudFront service principal can access objects via OAC when `AWS:SourceArn` matches the distribution ARN
- **Deny Statement**: Explicitly denies direct access from any principal that doesn't match the distribution ARN (unless via AWS service)

Applied to both:
- `aws_s3_bucket.uploads` (user content)
- `aws_s3_bucket.static_assets` (application bundles)

### 2. CloudFront Origin Configuration (`cloudfront.tf`)

**Before**: Origins included custom header `X-Origin-Verify` sent to S3.

**After**: Removed custom headers from S3 origins (kept for ALB origin).

**Rationale**: S3 bucket policies cannot validate custom HTTP headers. OAC with `AWS:SourceArn` condition provides sufficient security.

### 3. Lambda Build Automation (`cloudfront.tf`)

**Before**: Committed binary `lambda/cache-invalidation.zip` in version control.

**After**: Terraform-managed build with `archive_file` data source:
```hcl
data "archive_file" "cache_invalidation" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda/.build/cache-invalidation.zip"
  excludes    = ["cache-invalidation.zip", ".build"]
}
```

## Deployment Workflow

### One-Time Setup
```bash
cd infrastructure/terraform/lambda
npm install --production
```

### Terraform Apply
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## Files Modified

1. `s3.tf` - Enhanced bucket policies with explicit deny statements
2. `cloudfront.tf` - Removed S3 origin headers, added archive_file, updated Lambda
3. `lambda/.gitignore` - Excludes build artifacts
4. `lambda/README.md` - Build instructions

## Files Deleted

- `lambda/cache-invalidation.zip` - Removed committed binary

---

**Status**: ✅ Ready for Production
