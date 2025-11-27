# Terraform Remote State Migration Guide

## Quick Start - Complete Migration in 5 Minutes

This guide walks you through migrating from local Terraform state to a secure S3 backend with DynamoDB locking.

## Prerequisites Checklist

- [ ] AWS CLI configured (`aws sts get-caller-identity` works)
- [ ] Terraform >= 1.5.0 installed (`terraform version`)
- [ ] IAM permissions to create S3 buckets, DynamoDB tables, and IAM policies
- [ ] Backup of existing state files (if any)

## Step-by-Step Migration

### Phase 1: Bootstrap Remote Backend (5-10 minutes)

#### 1. Navigate to Bootstrap Directory

```bash
cd infrastructure/bootstrap-backend
```

#### 2. Review Configuration

```bash
# Check what will be created
cat variables.tf
```

Default configuration:
- S3 Bucket: `mangu-terraform-state`
- DynamoDB Table: `mangu-terraform-locks`
- Region: `us-east-1`

#### 3. Initialize Terraform

```bash
terraform init
```

#### 4. Plan and Review

```bash
terraform plan
```

Expected resources to be created:
- 1 S3 bucket
- 1 S3 bucket versioning configuration
- 1 S3 bucket encryption configuration
- 1 S3 bucket public access block
- 1 S3 bucket policy
- 1 DynamoDB table
- 1 IAM policy

#### 5. Apply Bootstrap Configuration

```bash
terraform apply
```

Type `yes` when prompted.

#### 6. Verify Creation

```bash
# Get outputs
terraform output

# Verify S3 bucket
aws s3 ls | grep mangu-terraform-state

# Verify DynamoDB table
aws dynamodb describe-table --table-name mangu-terraform-locks --query 'Table.TableStatus'
```

#### 7. Attach IAM Policy

```bash
# Get your IAM username
aws sts get-caller-identity --query 'Arn' --output text

# Attach policy to your user
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn $(terraform output -raw iam_policy_arn)

# Verify attachment
aws iam list-attached-user-policies --user-name YOUR_USERNAME
```

### Phase 2: Migrate Main Terraform State (2-5 minutes)

#### 1. Backup Existing State

```bash
cd ../terraform

# Backup local state if it exists
if [ -f terraform.tfstate ]; then
  cp terraform.tfstate terraform.tfstate.backup.$(date +%Y%m%d-%H%M%S)
  echo "✓ Backup created"
else
  echo "✓ No existing state to backup"
fi
```

#### 2. Review Backend Configuration

The backend is already configured in `main.tf`:

```hcl
backend "s3" {
  bucket         = "mangu-terraform-state"
  key            = "production/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "mangu-terraform-locks"
}
```

#### 3. Initialize with Backend Migration

```bash
# This will prompt to migrate existing state
terraform init -migrate-state
```

When prompted:
```
Do you want to copy existing state to the new backend?
```

Type `yes` to migrate.

#### 4. Verify Migration

```bash
# List resources (should work as before)
terraform state list

# Verify state is in S3
aws s3 ls s3://mangu-terraform-state/production/

# Check state file exists
aws s3 ls s3://mangu-terraform-state/production/terraform.tfstate
```

#### 5. Test State Locking

```bash
# In one terminal
terraform plan

# In another terminal (should fail with lock error)
terraform plan
```

If locking works, you'll see:
```
Error: Error acquiring the state lock
```

#### 6. Clean Up Local State Files

```bash
# Only after verifying remote state works!
rm -f terraform.tfstate terraform.tfstate.backup

# Keep timestamped backups for a while
ls -la terraform.tfstate.backup.*
```

### Phase 3: Team Setup (Per Team Member)

Each team member needs to:

#### 1. Pull Latest Code

```bash
git pull origin main
```

#### 2. Ensure IAM Policy is Attached

```bash
# Check if policy is attached
aws iam list-attached-user-policies --user-name YOUR_USERNAME

# If not attached, attach it
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/TerraformStateAccess
```

#### 3. Initialize Terraform

```bash
cd infrastructure/terraform
terraform init
```

#### 4. Verify Access

```bash
# Should list all resources
terraform state list

# Should work without errors
terraform plan
```

## CI/CD Integration

### GitHub Actions Setup

Add these secrets to your GitHub repository:

1. `AWS_ACCESS_KEY_ID`
2. `AWS_SECRET_ACCESS_KEY`
3. `AWS_REGION` (us-east-1)

Create IAM user for CI/CD:

```bash
# Create CI/CD user
aws iam create-user --user-name github-actions-terraform

# Attach state access policy
aws iam attach-user-policy \
  --user-name github-actions-terraform \
  --policy-arn $(cd infrastructure/bootstrap-backend && terraform output -raw iam_policy_arn)

# Create access keys
aws iam create-access-key --user-name github-actions-terraform
```

### Example GitHub Actions Workflow

```yaml
name: Terraform

on:
  push:
    branches: [main]
    paths:
      - 'infrastructure/terraform/**'
  pull_request:
    branches: [main]
    paths:
      - 'infrastructure/terraform/**'

jobs:
  terraform:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0
      
      - name: Terraform Init
        working-directory: infrastructure/terraform
        run: terraform init
      
      - name: Terraform Plan
        working-directory: infrastructure/terraform
        run: terraform plan -no-color
      
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        working-directory: infrastructure/terraform
        run: terraform apply -auto-approve
```

## Rollback Procedure

If you need to rollback to local state:

### 1. Download State from S3

```bash
cd infrastructure/terraform

aws s3 cp s3://mangu-terraform-state/production/terraform.tfstate \
  terraform.tfstate
```

### 2. Remove Backend Configuration

Edit `main.tf` and comment out the backend block:

```hcl
# backend "s3" {
#   bucket         = "mangu-terraform-state"
#   key            = "production/terraform.tfstate"
#   region         = "us-east-1"
#   encrypt        = true
#   dynamodb_table = "mangu-terraform-locks"
# }
```

### 3. Reinitialize

```bash
terraform init -migrate-state
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Bucket already exists" (owned by another account)

**Solution**: Change bucket name in `bootstrap-backend/variables.tf`:

```hcl
variable "state_bucket_name" {
  default = "mangu-terraform-state-YOUR-ACCOUNT-ID"
}
```

#### Issue: "Access Denied" errors

**Solution**: Verify IAM policy attachment:

```bash
# Check current user
aws sts get-caller-identity

# List attached policies
aws iam list-attached-user-policies --user-name YOUR_USERNAME

# Verify policy permissions
aws iam get-policy-version \
  --policy-arn $(cd infrastructure/bootstrap-backend && terraform output -raw iam_policy_arn) \
  --version-id v1
```

#### Issue: State lock timeout

**Solution**: Force unlock (use with caution):

```bash
# Get lock ID from error message
terraform force-unlock <LOCK_ID>

# Or check DynamoDB directly
aws dynamodb scan --table-name mangu-terraform-locks
```

#### Issue: State file not found after migration

**Solution**: Verify S3 upload:

```bash
# List all objects in bucket
aws s3 ls s3://mangu-terraform-state/ --recursive

# Check specific state file
aws s3 ls s3://mangu-terraform-state/production/terraform.tfstate

# Download and verify
aws s3 cp s3://mangu-terraform-state/production/terraform.tfstate - | head
```

#### Issue: "Error locking state" with DynamoDB

**Solution**: Verify DynamoDB table configuration:

```bash
# Check table status
aws dynamodb describe-table --table-name mangu-terraform-locks

# Verify key schema (should have LockID as hash key)
aws dynamodb describe-table \
  --table-name mangu-terraform-locks \
  --query 'Table.KeySchema'
```

## Security Best Practices

### ✅ Implemented

- [x] Encryption at rest (S3 AES256)
- [x] Encryption in transit (HTTPS enforced via bucket policy)
- [x] Public access blocked on S3 bucket
- [x] Versioning enabled for state recovery
- [x] State locking via DynamoDB
- [x] Least-privilege IAM policies

### 🔒 Additional Recommendations

1. **Enable MFA Delete** (optional, for production):
   ```bash
   aws s3api put-bucket-versioning \
     --bucket mangu-terraform-state \
     --versioning-configuration Status=Enabled,MFADelete=Enabled \
     --mfa "arn:aws:iam::ACCOUNT_ID:mfa/USER MFACODE"
   ```

2. **Enable S3 Access Logging**:
   ```bash
   aws s3api put-bucket-logging \
     --bucket mangu-terraform-state \
     --bucket-logging-status file://logging.json
   ```

3. **Enable CloudTrail** for audit logging

4. **Rotate access keys** regularly

5. **Use IAM roles** instead of access keys where possible

## Verification Checklist

After migration, verify:

- [ ] `terraform state list` works
- [ ] `terraform plan` executes successfully
- [ ] State file exists in S3: `aws s3 ls s3://mangu-terraform-state/production/`
- [ ] DynamoDB table is active: `aws dynamodb describe-table --table-name mangu-terraform-locks`
- [ ] Concurrent runs are blocked (state locking works)
- [ ] Local state files are removed
- [ ] Team members can access remote state
- [ ] CI/CD pipeline works with remote state
- [ ] IAM policies are attached to all users/roles

## Cost Estimate

Monthly costs for remote state backend:

| Service | Usage | Cost |
|---------|-------|------|
| S3 Storage | ~10 MB state file | $0.23 |
| S3 Requests | ~100 requests/month | $0.01 |
| DynamoDB | Pay-per-request | $0.50 |
| **Total** | | **~$0.74/month** |

Very low cost for enterprise-grade state management!

## Next Steps

After successful migration:

1. [ ] Update team documentation
2. [ ] Configure CI/CD pipeline
3. [ ] Set up state file monitoring/alerts
4. [ ] Schedule regular state backups (S3 versioning provides this)
5. [ ] Document rollback procedures for your team
6. [ ] Consider using Terraform workspaces for multiple environments

## Resources

- [Terraform S3 Backend Docs](https://www.terraform.io/docs/language/settings/backends/s3.html)
- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [Terraform State Management](https://www.terraform.io/docs/language/state/index.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

## Support

Questions or issues? Check:
1. This troubleshooting section
2. `infrastructure/bootstrap-backend/README.md`
3. AWS CloudWatch logs
4. Terraform debug logs: `TF_LOG=DEBUG terraform plan`
