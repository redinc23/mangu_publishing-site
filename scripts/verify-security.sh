#!/bin/bash
# Security Infrastructure Verification Script
# Validates that all security components are properly configured

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "================================================"
echo "Security Infrastructure Verification"
echo "================================================"
echo ""

# Configuration
PROJECT_NAME="${PROJECT_NAME:-mangu-publishing}"
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "Configuration:"
echo "  Project: $PROJECT_NAME"
echo "  Environment: $ENVIRONMENT"
echo "  Region: $AWS_REGION"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
for cmd in aws jq terraform gh; do
    if command -v $cmd &> /dev/null; then
        check_pass "$cmd installed"
    else
        check_fail "$cmd not installed"
    fi
done
echo ""

# Check AWS credentials
echo "Checking AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    check_pass "AWS credentials configured (Account: $ACCOUNT_ID)"
else
    check_fail "AWS credentials not configured"
fi
echo ""

# Check IAM roles
echo "Checking IAM roles..."
IAM_ROLES=(
    "${PROJECT_NAME}-${ENVIRONMENT}-ecs-task-execution"
    "${PROJECT_NAME}-${ENVIRONMENT}-ecs-task"
    "${PROJECT_NAME}-${ENVIRONMENT}-github-actions"
)

for role in "${IAM_ROLES[@]}"; do
    if aws iam get-role --role-name "$role" &> /dev/null; then
        check_pass "IAM role exists: $role"
    else
        check_fail "IAM role missing: $role"
    fi
done
echo ""

# Check CloudTrail
echo "Checking CloudTrail..."
TRAIL_NAME="${PROJECT_NAME}-${ENVIRONMENT}-trail"
if aws cloudtrail get-trail-status --name "$TRAIL_NAME" --region "$AWS_REGION" &> /dev/null; then
    IS_LOGGING=$(aws cloudtrail get-trail-status --name "$TRAIL_NAME" --region "$AWS_REGION" --query 'IsLogging' --output text)
    if [ "$IS_LOGGING" = "true" ]; then
        check_pass "CloudTrail is logging: $TRAIL_NAME"
    else
        check_fail "CloudTrail exists but not logging: $TRAIL_NAME"
    fi
else
    check_fail "CloudTrail not found: $TRAIL_NAME"
fi
echo ""

# Check S3 buckets
echo "Checking S3 buckets..."
S3_BUCKETS=(
    "${PROJECT_NAME}-${ENVIRONMENT}-cloudtrail-logs"
    "${PROJECT_NAME}-${ENVIRONMENT}-access-logs"
    "${PROJECT_NAME}-${ENVIRONMENT}-compliance-reports"
)

for bucket in "${S3_BUCKETS[@]}"; do
    if aws s3 ls "s3://$bucket" &> /dev/null; then
        check_pass "S3 bucket exists: $bucket"
        
        # Check encryption
        if aws s3api get-bucket-encryption --bucket "$bucket" &> /dev/null; then
            check_pass "  └─ Encryption enabled"
        else
            check_fail "  └─ Encryption not enabled"
        fi
        
        # Check versioning
        VERSIONING=$(aws s3api get-bucket-versioning --bucket "$bucket" --query 'Status' --output text 2>/dev/null || echo "Disabled")
        if [ "$VERSIONING" = "Enabled" ]; then
            check_pass "  └─ Versioning enabled"
        else
            check_warn "  └─ Versioning not enabled"
        fi
    else
        check_fail "S3 bucket missing: $bucket"
    fi
done
echo ""

# Check Secrets Manager
echo "Checking Secrets Manager..."
SECRETS=(
    "${PROJECT_NAME}-${ENVIRONMENT}-jwt-secret"
    "${PROJECT_NAME}-${ENVIRONMENT}-db-credentials"
)

for secret in "${SECRETS[@]}"; do
    if aws secretsmanager describe-secret --secret-id "$secret" --region "$AWS_REGION" &> /dev/null; then
        check_pass "Secret exists: $secret"
        
        # Check last rotation
        LAST_CHANGED=$(aws secretsmanager describe-secret --secret-id "$secret" --region "$AWS_REGION" --query 'LastChangedDate' --output text)
        check_info "  └─ Last changed: $LAST_CHANGED"
    else
        check_fail "Secret missing: $secret"
    fi
done
echo ""

# Check CloudWatch Alarms
echo "Checking CloudWatch Alarms..."
ALARMS=(
    "${PROJECT_NAME}-${ENVIRONMENT}-unauthorized-api-calls"
    "${PROJECT_NAME}-${ENVIRONMENT}-root-account-usage"
    "${PROJECT_NAME}-${ENVIRONMENT}-iam-policy-changes"
    "${PROJECT_NAME}-${ENVIRONMENT}-console-login-failures"
)

for alarm in "${ALARMS[@]}"; do
    if aws cloudwatch describe-alarms --alarm-names "$alarm" --region "$AWS_REGION" --query 'MetricAlarms[0]' --output text &> /dev/null; then
        check_pass "CloudWatch alarm exists: $alarm"
    else
        check_fail "CloudWatch alarm missing: $alarm"
    fi
done
echo ""

# Check Lambda functions
echo "Checking Lambda functions..."
LAMBDA_FUNCTIONS=(
    "${PROJECT_NAME}-${ENVIRONMENT}-compliance-report"
)

for func in "${LAMBDA_FUNCTIONS[@]}"; do
    if aws lambda get-function --function-name "$func" --region "$AWS_REGION" &> /dev/null; then
        check_pass "Lambda function exists: $func"
        
        # Check last update
        LAST_MODIFIED=$(aws lambda get-function --function-name "$func" --region "$AWS_REGION" --query 'Configuration.LastModified' --output text)
        check_info "  └─ Last modified: $LAST_MODIFIED"
    else
        check_fail "Lambda function missing: $func"
    fi
done
echo ""

# Check GitHub workflows
echo "Checking GitHub workflows..."
WORKFLOWS=(
    "security.yml"
    "secret-rotation.yml"
)

for workflow in "${WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        check_pass "Workflow exists: $workflow"
    else
        check_fail "Workflow missing: $workflow"
    fi
done
echo ""

# Check GitHub secrets
echo "Checking GitHub secrets..."
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    REQUIRED_SECRETS=(
        "SNYK_TOKEN"
        "AWS_ROTATION_ROLE_ARN"
    )
    
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if gh secret list | grep -q "$secret"; then
            check_pass "GitHub secret configured: $secret"
        else
            check_warn "GitHub secret missing: $secret (may not be required)"
        fi
    done
else
    check_warn "GitHub CLI not authenticated - skipping secret check"
fi
echo ""

# Check Terraform files
echo "Checking Terraform files..."
TERRAFORM_FILES=(
    "infrastructure/terraform/iam.tf"
    "infrastructure/terraform/cloudtrail.tf"
)

for file in "${TERRAFORM_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "Terraform file exists: $file"
    else
        check_fail "Terraform file missing: $file"
    fi
done
echo ""

# Check scripts
echo "Checking scripts..."
SCRIPTS=(
    "scripts/rotate-secrets.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            check_pass "Script exists and executable: $script"
        else
            check_warn "Script exists but not executable: $script"
        fi
    else
        check_fail "Script missing: $script"
    fi
done
echo ""

# Check documentation
echo "Checking documentation..."
DOCS=(
    "docs/SECURITY_COMPLIANCE.md"
    "docs/SECURITY_QUICKSTART.md"
    "SECURITY_IMPLEMENTATION_COMPLETE.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "Documentation exists: $doc"
    else
        check_fail "Documentation missing: $doc"
    fi
done
echo ""

# Summary
echo "================================================"
echo "Verification Summary"
echo "================================================"
echo ""
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All security infrastructure verified successfully!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please review and fix the issues.${NC}"
    exit 1
fi
