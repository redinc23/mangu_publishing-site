#!/bin/bash

# Terraform Remote State Migration Script
# Automates the migration from local to S3 remote state

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

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Terraform Remote State Migration - Automated Script       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"

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

# Function to prompt for confirmation
confirm() {
    read -p "$(echo -e ${YELLOW}$1${NC}) [y/N]: " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Check prerequisites
echo -e "${BLUE}═══ Phase 1: Prerequisites Check ═══${NC}\n"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    error "AWS CLI is not installed"
    info "Install from: https://aws.amazon.com/cli/"
    exit 1
fi
success "AWS CLI is installed"

# Check Terraform
if ! command -v terraform &> /dev/null; then
    error "Terraform is not installed"
    info "Install from: https://www.terraform.io/downloads"
    exit 1
fi
success "Terraform is installed ($(terraform version -json | jq -r '.terraform_version'))"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    error "AWS credentials are not configured"
    info "Run: aws configure"
    exit 1
fi
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
IAM_USER=$(aws sts get-caller-identity --query 'Arn' --output text | cut -d'/' -f2)
success "AWS credentials configured"
info "Account: $ACCOUNT_ID"
info "User: $IAM_USER"

# Check jq is installed
if ! command -v jq &> /dev/null; then
    warning "jq is not installed (optional but recommended)"
    info "Install from: https://stedolan.github.io/jq/"
fi

echo ""

# Check if bootstrap was already applied
echo -e "${BLUE}═══ Phase 2: Bootstrap Backend ═══${NC}\n"

BUCKET_EXISTS=$(aws s3 ls | grep -c "$BUCKET_NAME" || echo "0")
TABLE_EXISTS=$(aws dynamodb list-tables | grep -c "$DYNAMODB_TABLE" || echo "0")

if [ "$BUCKET_EXISTS" -gt 0 ] && [ "$TABLE_EXISTS" -gt 0 ]; then
    success "Bootstrap resources already exist"
    info "S3 Bucket: $BUCKET_NAME"
    info "DynamoDB Table: $DYNAMODB_TABLE"
else
    warning "Bootstrap resources not found"
    
    if confirm "Do you want to run bootstrap now?"; then
        echo -e "\n${BLUE}Running bootstrap...${NC}\n"
        
        cd infrastructure/bootstrap-backend
        
        terraform init
        
        echo ""
        terraform plan
        echo ""
        
        if confirm "Apply bootstrap configuration?"; then
            terraform apply -auto-approve
            success "Bootstrap complete!"
        else
            error "Bootstrap cancelled by user"
            exit 1
        fi
        
        cd ../..
    else
        error "Bootstrap is required before migration"
        info "Run manually: cd infrastructure/bootstrap-backend && terraform init && terraform apply"
        exit 1
    fi
fi

# Get policy ARN
cd infrastructure/bootstrap-backend
if [ ! -d .terraform ]; then
    terraform init -backend=false > /dev/null 2>&1
fi
POLICY_ARN=$(terraform output -raw iam_policy_arn 2>/dev/null || echo "")
cd ../..

if [ -z "$POLICY_ARN" ]; then
    error "Could not retrieve IAM policy ARN"
    info "Check bootstrap outputs: cd infrastructure/bootstrap-backend && terraform output"
    exit 1
fi

echo ""

# IAM Policy attachment
echo -e "${BLUE}═══ Phase 3: IAM Policy Attachment ═══${NC}\n"

POLICY_ATTACHED=$(aws iam list-attached-user-policies --user-name "$IAM_USER" 2>/dev/null | grep -c "TerraformStateAccess" || echo "0")

if [ "$POLICY_ATTACHED" -gt 0 ]; then
    success "IAM policy already attached"
else
    warning "IAM policy not attached to user: $IAM_USER"
    
    if confirm "Attach TerraformStateAccess policy now?"; then
        aws iam attach-user-policy --user-name "$IAM_USER" --policy-arn "$POLICY_ARN"
        success "IAM policy attached successfully"
    else
        error "IAM policy must be attached before migration"
        info "Run: aws iam attach-user-policy --user-name $IAM_USER --policy-arn $POLICY_ARN"
        exit 1
    fi
fi

info "Policy ARN: $POLICY_ARN"

echo ""

# Check current state
echo -e "${BLUE}═══ Phase 4: State Migration ═══${NC}\n"

cd infrastructure/terraform

# Check if state already exists in S3
if aws s3 ls "s3://$BUCKET_NAME/production/terraform.tfstate" &>/dev/null; then
    success "Remote state already exists in S3"
    
    STATE_SIZE=$(aws s3 ls "s3://$BUCKET_NAME/production/terraform.tfstate" --human-readable | awk '{print $3, $4}')
    info "State file size: $STATE_SIZE"
    
    if confirm "Do you want to re-initialize with remote backend?"; then
        terraform init
        success "Terraform re-initialized"
    fi
else
    warning "Remote state does not exist yet"
    
    # Check for local state
    if [ -f terraform.tfstate.backup ] && [ -s terraform.tfstate.backup ]; then
        info "Local state backup found ($(du -h terraform.tfstate.backup | cut -f1))"
        
        # Create timestamped backup
        BACKUP_NAME="terraform.tfstate.backup.$(date +%Y%m%d-%H%M%S)"
        cp terraform.tfstate.backup "$BACKUP_NAME"
        success "Created backup: $BACKUP_NAME"
        
        echo ""
        warning "This will migrate local state to S3"
        info "Current backend: Local"
        info "Target backend: s3://$BUCKET_NAME/production/terraform.tfstate"
        echo ""
        
        if confirm "Proceed with state migration?"; then
            echo ""
            terraform init -migrate-state
            
            # Verify migration
            if aws s3 ls "s3://$BUCKET_NAME/production/terraform.tfstate" &>/dev/null; then
                success "State successfully migrated to S3!"
            else
                error "State migration failed - state not found in S3"
                exit 1
            fi
        else
            warning "Migration cancelled by user"
            exit 0
        fi
    else
        info "No local state found - performing fresh initialization"
        terraform init
        success "Terraform initialized with remote backend"
    fi
fi

cd ../..

echo ""

# Validation
echo -e "${BLUE}═══ Phase 5: Validation ═══${NC}\n"

info "Running validation script..."
echo ""

if [ -f infrastructure/scripts/validate-backend.sh ]; then
    bash infrastructure/scripts/validate-backend.sh
else
    warning "Validation script not found"
    
    # Manual validation
    echo -e "\n${BLUE}Manual Validation:${NC}\n"
    
    # Check S3
    if aws s3 ls "s3://$BUCKET_NAME/production/terraform.tfstate" &>/dev/null; then
        success "State file exists in S3"
    else
        error "State file NOT found in S3"
    fi
    
    # Check DynamoDB
    TABLE_STATUS=$(aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --query 'Table.TableStatus' --output text 2>/dev/null || echo "UNKNOWN")
    if [ "$TABLE_STATUS" = "ACTIVE" ]; then
        success "DynamoDB table is active"
    else
        error "DynamoDB table status: $TABLE_STATUS"
    fi
    
    # Check state list
    cd infrastructure/terraform
    if terraform state list &>/dev/null; then
        success "Terraform state is accessible"
        RESOURCE_COUNT=$(terraform state list 2>/dev/null | wc -l)
        info "Resources in state: $RESOURCE_COUNT"
    else
        error "Cannot access Terraform state"
    fi
    cd ../..
fi

echo ""

# Cleanup suggestions
echo -e "${BLUE}═══ Phase 6: Cleanup (Optional) ═══${NC}\n"

cd infrastructure/terraform

if [ -f terraform.tfstate ] && [ ! -s terraform.tfstate ]; then
    info "Empty local state file can be removed"
    if confirm "Remove empty terraform.tfstate?"; then
        rm terraform.tfstate
        success "Removed empty local state file"
    fi
fi

if ls terraform.tfstate.backup.* 1> /dev/null 2>&1; then
    BACKUP_COUNT=$(ls terraform.tfstate.backup.* | wc -l)
    info "Found $BACKUP_COUNT timestamped backup(s)"
    echo ""
    ls -lh terraform.tfstate.backup.*
    echo ""
    warning "Keep these backups for at least 30 days"
    info "Remove after: $(date -v+30d '+%Y-%m-%d' 2>/dev/null || date -d '+30 days' '+%Y-%m-%d' 2>/dev/null || echo '30 days from now')"
fi

cd ../..

echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Migration Summary                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}✓ Migration Complete!${NC}\n"

echo "Next Steps:"
echo "  1. Test Terraform operations: cd infrastructure/terraform && terraform plan"
echo "  2. Notify team members to attach IAM policy:"
echo "     aws iam attach-user-policy --user-name USERNAME --policy-arn $POLICY_ARN"
echo "  3. Set up CI/CD pipeline (see TERRAFORM_REMOTE_BACKEND_ANALYSIS.md)"
echo "  4. Monitor costs (expected: ~\$0.74/month)"
echo ""

echo "Documentation:"
echo "  - Full analysis: TERRAFORM_REMOTE_BACKEND_ANALYSIS.md"
echo "  - Migration guide: infrastructure/TERRAFORM_STATE_MIGRATION.md"
echo "  - Checklist: infrastructure/MIGRATION_CHECKLIST.md"
echo ""

echo -e "${GREEN}Migration completed successfully at $(date)${NC}"
