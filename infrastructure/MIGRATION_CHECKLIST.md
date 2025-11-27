# Terraform State Migration Checklist

Use this checklist to ensure complete migration to remote state.

## Pre-Migration

- [ ] AWS CLI configured and authenticated
  ```bash
  aws sts get-caller-identity
  ```

- [ ] Terraform >= 1.5.0 installed
  ```bash
  terraform version
  ```

- [ ] IAM permissions verified (can create S3, DynamoDB, IAM)
  ```bash
  aws iam get-user
  ```

- [ ] Local state backed up
  ```bash
  cd infrastructure/terraform
  cp terraform.tfstate.backup terraform.tfstate.backup.$(date +%Y%m%d-%H%M%S)
  ```

## Bootstrap Phase

- [ ] Navigate to `infrastructure/bootstrap-backend`
  ```bash
  cd infrastructure/bootstrap-backend
  ```

- [ ] Run `terraform init`
  ```bash
  terraform init
  ```

- [ ] Run `terraform plan` and review
  ```bash
  terraform plan
  ```

- [ ] Run `terraform apply`
  ```bash
  terraform apply
  ```

- [ ] Verify S3 bucket created
  ```bash
  aws s3 ls | grep mangu-terraform-state
  ```

- [ ] Verify DynamoDB table created
  ```bash
  aws dynamodb describe-table --table-name mangu-terraform-locks --query 'Table.TableStatus'
  ```

- [ ] Note IAM policy ARN from outputs
  ```bash
  terraform output iam_policy_arn
  ```

## IAM Configuration

- [ ] Get IAM username/role
  ```bash
  aws sts get-caller-identity --query 'Arn' --output text
  ```

- [ ] Attach `TerraformStateAccess` policy
  ```bash
  export IAM_USER=$(aws sts get-caller-identity --query 'Arn' --output text | cut -d'/' -f2)
  export POLICY_ARN=$(terraform output -raw iam_policy_arn)
  aws iam attach-user-policy --user-name "$IAM_USER" --policy-arn "$POLICY_ARN"
  ```

- [ ] Verify policy attachment
  ```bash
  aws iam list-attached-user-policies --user-name "$IAM_USER"
  ```

## State Migration

- [ ] Navigate to `infrastructure/terraform`
  ```bash
  cd ../terraform
  ```

- [ ] Create timestamped backup of existing state
  ```bash
  if [ -f terraform.tfstate.backup ]; then
    cp terraform.tfstate.backup terraform.tfstate.backup.$(date +%Y%m%d-%H%M%S)
  fi
  ```

- [ ] Run `terraform init -migrate-state`
  ```bash
  terraform init -migrate-state
  ```

- [ ] Confirm migration when prompted (type `yes`)

- [ ] Verify state uploaded to S3
  ```bash
  aws s3 ls s3://mangu-terraform-state/production/
  ```

## Validation

- [ ] Run validation script
  ```bash
  ../../scripts/validate-backend.sh
  ```

- [ ] Run `terraform state list` (should work)
  ```bash
  terraform state list
  ```

- [ ] Run `terraform plan` (should work)
  ```bash
  terraform plan
  ```

- [ ] Verify state locking works
  ```bash
  # In one terminal:
  terraform plan
  # In another terminal (should fail):
  terraform plan
  ```

- [ ] Check S3 for state file
  ```bash
  aws s3 ls s3://mangu-terraform-state/production/terraform.tfstate --human-readable
  ```

- [ ] Check DynamoDB table is active
  ```bash
  aws dynamodb describe-table --table-name mangu-terraform-locks --query 'Table.TableStatus'
  ```

## Cleanup

- [ ] Remove local `terraform.tfstate`
  ```bash
  rm -f terraform.tfstate
  ```

- [ ] Keep timestamped backups for 30 days
  ```bash
  ls -lh terraform.tfstate.backup.*
  ```

- [ ] Document migration completion date
  ```bash
  echo "Migration completed: $(date)" >> MIGRATION_LOG.txt
  ```

- [ ] Notify team members

## Team Onboarding

- [ ] Share IAM policy ARN with team
  ```bash
  cd infrastructure/bootstrap-backend
  echo "Policy ARN: $(terraform output -raw iam_policy_arn)"
  ```

- [ ] Update team documentation

- [ ] Ensure all team members attach policy
  ```bash
  # Each team member runs:
  aws iam attach-user-policy \
    --user-name THEIR_USERNAME \
    --policy-arn <POLICY_ARN>
  ```

- [ ] Verify team members can run `terraform init`
  ```bash
  cd infrastructure/terraform
  terraform init
  ```

## CI/CD Integration (Optional)

- [ ] Create GitHub Actions workflow
  - See `.github/workflows/terraform.yml` template in analysis doc

- [ ] Configure AWS credentials in GitHub Secrets
  - `AWS_TERRAFORM_ROLE_ARN` (recommended - OIDC)
  - OR `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`

- [ ] Test workflow on PR
  - Create a test PR with Terraform changes

- [ ] Verify auto-apply on main branch
  - Merge PR and check workflow runs

## Post-Migration Verification

- [ ] State file size is reasonable
  ```bash
  aws s3 ls s3://mangu-terraform-state/production/terraform.tfstate --human-readable
  ```

- [ ] No local state files remain
  ```bash
  find . -name "terraform.tfstate" -not -path "*/\.terraform/*"
  ```

- [ ] Versioning is enabled on S3 bucket
  ```bash
  aws s3api get-bucket-versioning --bucket mangu-terraform-state
  ```

- [ ] Encryption is enabled on S3 bucket
  ```bash
  aws s3api get-bucket-encryption --bucket mangu-terraform-state
  ```

- [ ] Public access is blocked
  ```bash
  aws s3api get-public-access-block --bucket mangu-terraform-state
  ```

---

## Migration Details

**Migration Completed By:** _____________

**Date:** _____________

**Verified By:** _____________

**State File Size:** _____________ KB

**Number of Resources:** _____________

**Issues Encountered:** 
- 
- 
- 

**Resolution:**
- 
- 
- 

---

## Rollback Plan (Emergency Only)

If migration fails and you need to rollback to local state:

1. Download state from S3:
   ```bash
   aws s3 cp s3://mangu-terraform-state/production/terraform.tfstate terraform.tfstate
   ```

2. Comment out backend block in `main.tf`

3. Reinitialize:
   ```bash
   terraform init -migrate-state -reconfigure
   ```

---

## Support Contacts

- **Infrastructure Lead:** _____________
- **AWS Account Admin:** _____________
- **Emergency Contact:** _____________

## Useful Links

- [Terraform S3 Backend Docs](https://www.terraform.io/docs/language/settings/backends/s3.html)
- [Migration Guide](TERRAFORM_STATE_MIGRATION.md)
- [Bootstrap README](bootstrap-backend/README.md)
- [Validation Script](scripts/validate-backend.sh)
