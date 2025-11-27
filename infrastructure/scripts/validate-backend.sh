#!/bin/bash

# Terraform Remote State Backend Validation Script
# Validates that the S3 backend and DynamoDB table are properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="mangu-terraform-state"
DYNAMODB_TABLE="mangu-terraform-locks"
AWS_REGION="us-east-1"
STATE_KEY="production/terraform.tfstate"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Terraform Backend Validation${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to print info
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check AWS CLI is installed
echo -e "\n${BLUE}1. Checking Prerequisites${NC}"
if command -v aws &> /dev/null; then
    success "AWS CLI is installed"
else
    error "AWS CLI is not installed"
    exit 1
fi

# Check Terraform is installed
if command -v terraform &> /dev/null; then
    success "Terraform is installed"
else
    error "Terraform is not installed"
    exit 1
fi

# Check AWS credentials
echo -e "\n${BLUE}2. Checking AWS Credentials${NC}"
if aws sts get-caller-identity &> /dev/null; then
    success "AWS credentials are configured"
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    info "Account: $ACCOUNT_ID"
else
    error "AWS credentials are not configured"
    exit 1
fi

# Check S3 bucket exists
echo -e "\n${BLUE}3. Validating S3 Bucket${NC}"
if aws s3api head-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION" 2>/dev/null; then
    success "S3 bucket exists: $BUCKET_NAME"
else
    error "S3 bucket does not exist: $BUCKET_NAME"
    exit 1
fi

# Check DynamoDB table exists
echo -e "\n${BLUE}4. Validating DynamoDB Table${NC}"
if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" &>/dev/null; then
    success "DynamoDB table exists: $DYNAMODB_TABLE"
else
    error "DynamoDB table does not exist: $DYNAMODB_TABLE"
    exit 1
fi

# Check S3 bucket configuration details
echo -e "\n${BLUE}5. Validating S3 Bucket Configuration${NC}"

# Check versioning
VERSIONING=$(aws s3api get-bucket-versioning --bucket "$BUCKET_NAME" --region "$AWS_REGION" 2>/dev/null | jq -r '.Status // "Disabled"')
if [ "$VERSIONING" = "Enabled" ]; then
    success "S3 versioning is enabled"
else
    warning "S3 versioning is not enabled"
fi

# Check encryption
ENCRYPTION=$(aws s3api get-bucket-encryption --bucket "$BUCKET_NAME" --region "$AWS_REGION" 2>/dev/null | jq -r '.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm // "None"')
if [ "$ENCRYPTION" = "AES256" ]; then
    success "S3 encryption is enabled (AES256)"
else
    warning "S3 encryption is not properly configured"
fi

# Check public access block
PUBLIC_ACCESS=$(aws s3api get-public-access-block --bucket "$BUCKET_NAME" --region "$AWS_REGION" 2>/dev/null | jq -r '.PublicAccessBlockConfiguration.BlockPublicAcls // false')
if [ "$PUBLIC_ACCESS" = "true" ]; then
    success "Public access is blocked"
else
    warning "Public access is not fully blocked"
fi

# Check DynamoDB table configuration
echo -e "\n${BLUE}6. Validating DynamoDB Table Configuration${NC}"

TABLE_STATUS=$(aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" 2>/dev/null | jq -r '.Table.TableStatus // "UNKNOWN"')
if [ "$TABLE_STATUS" = "ACTIVE" ]; then
    success "DynamoDB table is active"
else
    warning "DynamoDB table status: $TABLE_STATUS"
fi

# Check key schema
KEY_SCHEMA=$(aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" 2>/dev/null | jq -r '.Table.KeySchema[0].AttributeName // "UNKNOWN"')
if [ "$KEY_SCHEMA" = "LockID" ]; then
    success "DynamoDB key schema is correct (LockID)"
else
    error "DynamoDB key schema is incorrect: $KEY_SCHEMA"
fi

# Check for active locks
echo -e "\n${BLUE}7. Checking Active State Locks${NC}"
LOCK_COUNT=$(aws dynamodb scan --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" --select COUNT 2>/dev/null | jq -r '.Count // 0')
if [ "$LOCK_COUNT" -eq 0 ]; then
    success "No active locks"
else
    warning "Found $LOCK_COUNT active lock(s)"
    info "View locks: aws dynamodb scan --table-name $DYNAMODB_TABLE"
fi

# Check state migration status
echo -e "\n${BLUE}8. Checking State Migration Status${NC}"

# Check if state exists locally
if [ -f "infrastructure/terraform/terraform.tfstate" ] && [ -s "infrastructure/terraform/terraform.tfstate" ]; then
    warning "Local state file exists and is not empty"
    info "Migration needed: cd infrastructure/terraform && terraform init -migrate-state"
else
    success "No local state file (already migrated or clean install)"
fi

# Check if state exists in S3
if aws s3 ls "s3://$BUCKET_NAME/$STATE_KEY" --region "$AWS_REGION" &>/dev/null; then
    success "Remote state exists in S3"
    STATE_SIZE=$(aws s3 ls "s3://$BUCKET_NAME/$STATE_KEY" --region "$AWS_REGION" --human-readable | awk '{print $3, $4}')
    info "State file size: $STATE_SIZE"
    
    # Check when last modified
    LAST_MODIFIED=$(aws s3 ls "s3://$BUCKET_NAME/$STATE_KEY" --region "$AWS_REGION" | awk '{print $1, $2}')
    info "Last modified: $LAST_MODIFIED"
else
    warning "No state file found in S3"
    if [ -f "infrastructure/terraform/terraform.tfstate.backup" ]; then
        info "Local backup exists - migration recommended"
        info "Run: cd infrastructure/terraform && terraform init -migrate-state"
    else
        info "Clean installation - no migration needed"
    fi
fi

# Check IAM policy
echo -e "\n${BLUE}9. Validating IAM Permissions${NC}"
CURRENT_USER=$(aws sts get-caller-identity --query 'Arn' --output text 2>/dev/null | cut -d'/' -f2)
if [ -n "$CURRENT_USER" ]; then
    info "Current user: $CURRENT_USER"
    
    # Check if policy is attached
    POLICY_CHECK=$(aws iam list-attached-user-policies --user-name "$CURRENT_USER" 2>/dev/null | grep -c "TerraformStateAccess" || echo "0")
    if [ "$POLICY_CHECK" -gt 0 ]; then
        success "TerraformStateAccess policy is attached"
    else
        warning "TerraformStateAccess policy is NOT attached"
        info "Attach with: aws iam attach-user-policy --user-name $CURRENT_USER --policy-arn <ARN>"
    fi
fi

# Summary
echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}======================================${NC}\n"

if aws s3 ls "s3://$BUCKET_NAME/$STATE_KEY" --region "$AWS_REGION" &>/dev/null && [ "$LOCK_COUNT" -eq 0 ] && [ "$TABLE_STATUS" = "ACTIVE" ]; then
    echo -e "${GREEN}✓ All backend resources validated successfully${NC}"
    echo -e "${GREEN}✓ Remote state is operational${NC}\n"
else
    echo -e "${YELLOW}⚠ Backend resources exist but require attention${NC}"
    echo -e "${YELLOW}⚠ Review warnings above${NC}\n"
fi
