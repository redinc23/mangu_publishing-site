# Terraform Remote State Bootstrap

This directory contains the Terraform configuration to bootstrap the remote state backend infrastructure for the MANGU Publishing platform.

## Overview

The bootstrap configuration creates:
- **S3 Bucket** (`mangu-terraform-state`): Stores Terraform state files with versioning and encryption
- **DynamoDB Table** (`mangu-terraform-locks`): Provides state locking to prevent concurrent modifications
- **IAM Policies**: Defines access controls for Terraform operations
- **Security Controls**: Enforces encryption at rest and in transit, blocks public access

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Terraform >= 1.5.0** installed
3. **IAM permissions** to create S3 buckets, DynamoDB tables, and IAM policies

## Initial Setup (First Time Only)

### Step 1: Initialize Bootstrap Configuration

```bash
cd infrastructure/bootstrap-backend
terraform init
```

### Step 2: Review the Plan

```bash
terraform plan
```

Review the resources that will be created:
- S3 bucket with versioning, encryption, and public access blocking
- DynamoDB table for state locking
- IAM policy for Terraform state access
- S3 bucket policy for security enforcement

### Step 3: Apply Bootstrap Configuration

```bash
terraform apply
```

Type `yes` to confirm and create the resources.

### Step 4: Note the Outputs

After successful application, note the output values:

```bash
terraform output
```

You should see:
- `state_bucket_name`: Name of the S3 bucket (mangu-terraform-state)
- `dynamodb_table_name`: Name of the DynamoDB table (mangu-terraform-locks)
- `iam_policy_arn`: ARN of the IAM policy for state access
- `backend_config`: Complete backend configuration for main Terraform

### Step 5: Attach IAM Policy

Attach the IAM policy to your Terraform execution user/role:

```bash
# For IAM User
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn $(terraform output -raw iam_policy_arn)

# For IAM Role
aws iam attach-role-policy \
  --role-name YOUR_ROLE_NAME \
  --policy-arn $(terraform output -raw iam_policy_arn)
```

## Migrating Existing Local State

If you have existing Terraform state locally that needs to be migrated:

### Step 1: Backup Local State

```bash
cd ../terraform
cp terraform.tfstate terraform.tfstate.backup
```

### Step 2: Initialize Backend

The main Terraform configuration (`infrastructure/terraform/main.tf`) is already configured with the S3 backend:

```hcl
backend "s3" {
  bucket         = "mangu-terraform-state"
  key            = "production/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "mangu-terraform-locks"
}
```

Initialize and migrate:

```bash
cd ../terraform
terraform init -migrate-state
```

Terraform will prompt you to migrate the existing state. Type `yes` to confirm.

### Step 3: Verify Migration

```bash
# Check that state is now remote
terraform state list

# Verify state in S3
aws s3 ls s3://mangu-terraform-state/production/

# Check DynamoDB table exists
aws dynamodb describe-table --table-name mangu-terraform-locks
```

### Step 4: Remove Local State Files

After successful migration and verification:

```bash
cd ../terraform
rm -f terraform.tfstate terraform.tfstate.backup
```

## Architecture Details

### S3 Bucket Configuration

- **Versioning**: Enabled for state history and recovery
- **Encryption**: AES256 server-side encryption
- **Public Access**: Completely blocked
- **Force Destroy**: Disabled to prevent accidental deletion
- **Bucket Policy**: Enforces HTTPS and encryption

### DynamoDB Table Configuration

- **Billing Mode**: PAY_PER_REQUEST (scales automatically)
- **Hash Key**: `LockID` (String)
- **Purpose**: Prevents concurrent state modifications

### Security Features

1. **Encryption at Rest**: S3 bucket uses AES256 encryption
2. **Encryption in Transit**: Bucket policy denies non-HTTPS requests
3. **Public Access Blocking**: All four public access settings enabled
4. **State Locking**: DynamoDB prevents concurrent modifications
5. **IAM Policy**: Least-privilege access to state resources

## Configuration Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `us-east-1` | AWS region for backend resources |
| `state_bucket_name` | `mangu-terraform-state` | S3 bucket name |
| `dynamodb_table_name` | `mangu-terraform-locks` | DynamoDB table name |
| `default_tags` | See variables.tf | Tags applied to all resources |

## Customization

To customize the configuration, create a `terraform.tfvars` file:

```hcl
aws_region            = "us-west-2"
state_bucket_name     = "my-company-terraform-state"
dynamodb_table_name   = "my-company-terraform-locks"

default_tags = {
  Project     = "MANGU-Publishing"
  Environment = "Production"
  ManagedBy   = "Terraform"
  CostCenter  = "Engineering"
}
```

## State Management Best Practices

1. **Never commit state files**: State files contain sensitive data
2. **Use state locking**: Always enable DynamoDB locking
3. **Enable versioning**: S3 versioning allows state recovery
4. **Restrict access**: Use IAM policies to limit who can modify state
5. **Regular backups**: S3 versioning provides automatic backups
6. **Separate environments**: Use different state files for dev/staging/prod

## Troubleshooting

### Issue: "Error acquiring the state lock"

**Cause**: Another Terraform process is running, or a previous run was interrupted.

**Solution**: 
```bash
# List locks
aws dynamodb scan --table-name mangu-terraform-locks

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### Issue: "Access Denied" when accessing state

**Cause**: IAM policy not attached or insufficient permissions.

**Solution**:
```bash
# Verify policy is attached
aws iam list-attached-user-policies --user-name YOUR_USERNAME

# Attach the policy
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn $(cd infrastructure/bootstrap-backend && terraform output -raw iam_policy_arn)
```

### Issue: "Bucket already exists"

**Cause**: S3 bucket names are globally unique.

**Solution**: Change `state_bucket_name` in `terraform.tfvars` to a unique name.

## Team Collaboration

For teams using this backend:

1. **Share backend configuration**: Ensure all team members use the same backend config
2. **Consistent AWS credentials**: Use the same AWS account/credentials
3. **State locking**: DynamoDB automatically prevents conflicts
4. **Communication**: Communicate before running destructive operations
5. **IAM policies**: Ensure all team members have the required IAM policy attached

## CI/CD Integration

For GitHub Actions or other CI/CD systems:

1. **Store AWS credentials** as secrets (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
2. **Attach IAM policy** to the CI/CD service account/role
3. **Use workspaces** for different environments:
   ```bash
   terraform workspace select production
   terraform plan
   ```

## Maintenance

### Viewing State History

```bash
# List all versions
aws s3api list-object-versions \
  --bucket mangu-terraform-state \
  --prefix production/terraform.tfstate

# Download a specific version
aws s3api get-object \
  --bucket mangu-terraform-state \
  --key production/terraform.tfstate \
  --version-id <VERSION_ID> \
  terraform.tfstate.old
```

### Cost Optimization

- **S3 costs**: ~$0.023/GB/month for standard storage
- **DynamoDB costs**: Pay-per-request, typically <$1/month for small teams
- **Total estimated cost**: <$5/month for typical usage

## Security Considerations

- ✅ Encryption at rest (S3 AES256)
- ✅ Encryption in transit (HTTPS enforced)
- ✅ Public access blocked
- ✅ Versioning enabled for recovery
- ✅ State locking prevents corruption
- ✅ IAM policies enforce least privilege
- ⚠️ State files may contain sensitive data - restrict access

## References

- [Terraform S3 Backend Documentation](https://www.terraform.io/docs/language/settings/backends/s3.html)
- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [Terraform State Best Practices](https://www.terraform.io/docs/language/state/index.html)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs for S3/DynamoDB
3. Verify IAM permissions are correctly configured
4. Contact the infrastructure team
