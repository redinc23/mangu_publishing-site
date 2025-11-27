# Terraform Remote State - Quick Start

## 🚀 5-Minute Setup

This is the fastest path to migrate to remote Terraform state with S3 and DynamoDB.

### Prerequisites

```bash
# Verify AWS CLI is configured
aws sts get-caller-identity

# Verify Terraform is installed
terraform version
```

### Step 1: Bootstrap Backend (2 minutes)

```bash
cd infrastructure/bootstrap-backend
terraform init
terraform apply  # Type 'yes'
```

### Step 2: Attach IAM Policy (1 minute)

```bash
# Replace YOUR_USERNAME with your AWS IAM username
export IAM_USER="YOUR_USERNAME"
export POLICY_ARN=$(terraform output -raw iam_policy_arn)

aws iam attach-user-policy --user-name $IAM_USER --policy-arn $POLICY_ARN
```

### Step 3: Migrate State (2 minutes)

```bash
cd ../terraform

# Backup existing state
[ -f terraform.tfstate ] && cp terraform.tfstate terraform.tfstate.backup

# Migrate to S3
terraform init -migrate-state  # Type 'yes'

# Verify
terraform state list
aws s3 ls s3://mangu-terraform-state/production/
```

### ✅ Done!

You're now using remote state with:
- ✅ S3 backend with encryption
- ✅ DynamoDB state locking
- ✅ Versioning enabled
- ✅ Public access blocked

## Verification

```bash
# Test that state is remote
cd infrastructure/terraform
terraform plan

# Check S3
aws s3 ls s3://mangu-terraform-state/production/terraform.tfstate

# Check DynamoDB
aws dynamodb describe-table --table-name mangu-terraform-locks
```

## Team Members Setup

```bash
# 1. Pull latest code
git pull origin main

# 2. Attach IAM policy (one-time)
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/TerraformStateAccess

# 3. Initialize Terraform
cd infrastructure/terraform
terraform init
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Bucket already exists" | Change `state_bucket_name` in `bootstrap-backend/variables.tf` |
| "Access Denied" | Run the IAM attach-user-policy command above |
| "State lock timeout" | `terraform force-unlock LOCK_ID` |

## What Was Created?

| Resource | Name | Purpose |
|----------|------|---------|
| S3 Bucket | `mangu-terraform-state` | Stores state files |
| DynamoDB Table | `mangu-terraform-locks` | Prevents concurrent modifications |
| IAM Policy | `TerraformStateAccess` | Grants access to state resources |

## Configuration Files

- `infrastructure/bootstrap-backend/` - Bootstrap configuration
- `infrastructure/terraform/main.tf` - Already configured with S3 backend
- `infrastructure/TERRAFORM_STATE_MIGRATION.md` - Detailed guide

## Security Features

- 🔒 Encryption at rest (AES256)
- 🔒 Encryption in transit (HTTPS enforced)
- 🔒 Public access blocked
- 🔒 Versioning enabled
- 🔒 State locking via DynamoDB
- 🔒 Least-privilege IAM policies

## Cost

Approximately **$0.74/month** for:
- S3 storage (~10 MB)
- S3 requests
- DynamoDB pay-per-request

## Next Steps

- [ ] Update team documentation
- [ ] Configure CI/CD with remote state
- [ ] Set up monitoring/alerts
- [ ] Review `infrastructure/TERRAFORM_STATE_MIGRATION.md` for advanced topics

## Need Help?

- 📖 **Detailed Guide**: `infrastructure/TERRAFORM_STATE_MIGRATION.md`
- 📖 **Bootstrap README**: `infrastructure/bootstrap-backend/README.md`
- 🐛 **Troubleshooting**: See TERRAFORM_STATE_MIGRATION.md
- 📚 **Terraform Docs**: https://www.terraform.io/docs/language/settings/backends/s3.html
