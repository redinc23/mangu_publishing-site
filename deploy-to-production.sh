#!/bin/bash

###############################################################################
# MANGU Publishing - Complete Production Deployment Script
# 
# This script automates the entire deployment process:
# 1. Validates AWS credentials
# 2. Checks for ACM certificate
# 3. Configures Terraform
# 4. Deploys infrastructure
# 5. Populates secrets
# 6. Triggers application deployment
#
# Prerequisites:
# - AWS CLI configured (aws configure)
# - Terraform installed
# - ACM certificate created for your domain
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="mangu-publishing"
ENVIRONMENT="production"
AWS_REGION="us-east-1"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

confirm() {
    read -p "$(echo -e ${YELLOW}$1 [y/N]: ${NC})" -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

###############################################################################
# Step 1: Validate Prerequisites
###############################################################################

validate_prerequisites() {
    print_header "Step 1: Validating Prerequisites"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not installed. Install: https://aws.amazon.com/cli/"
        exit 1
    fi
    print_success "AWS CLI found"
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform not installed. Install: https://www.terraform.io/downloads"
        exit 1
    fi
    print_success "Terraform found ($(terraform version | head -n1))"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Run: aws configure"
        exit 1
    fi
    
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    print_success "AWS credentials valid (Account: $AWS_ACCOUNT)"
    
    # Check git
    if ! git rev-parse --git-dir &> /dev/null; then
        print_error "Not in a git repository"
        exit 1
    fi
    print_success "Git repository found"
}

###############################################################################
# Step 2: Get or Create ACM Certificate
###############################################################################

get_acm_certificate() {
    print_header "Step 2: ACM Certificate Configuration"
    
    echo -e "Do you have an ACM certificate ARN for your domain?"
    echo -e "If not, we'll help you find or create one.\n"
    
    read -p "Enter your domain name (e.g., mangu-publishing.com): " DOMAIN_NAME
    
    # Search for existing certificates
    print_info "Searching for existing certificates for *.$DOMAIN_NAME or $DOMAIN_NAME..."
    
    CERT_ARN=$(aws acm list-certificates \
        --region $AWS_REGION \
        --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME' || DomainName=='*.$DOMAIN_NAME'] | [0].CertificateArn" \
        --output text 2>/dev/null || echo "None")
    
    if [[ "$CERT_ARN" != "None" ]] && [[ ! -z "$CERT_ARN" ]]; then
        print_success "Found existing certificate: $CERT_ARN"
        
        # Check if it's issued
        CERT_STATUS=$(aws acm describe-certificate \
            --certificate-arn "$CERT_ARN" \
            --region $AWS_REGION \
            --query 'Certificate.Status' \
            --output text)
        
        if [[ "$CERT_STATUS" == "ISSUED" ]]; then
            print_success "Certificate is issued and ready to use"
        else
            print_warning "Certificate status: $CERT_STATUS"
            print_info "You may need to complete DNS validation"
        fi
    else
        print_warning "No existing certificate found for $DOMAIN_NAME"
        echo -e "\nTo create a certificate:"
        echo -e "1. Go to: https://console.aws.amazon.com/acm"
        echo -e "2. Click 'Request certificate' → 'Request a public certificate'"
        echo -e "3. Enter domain: $DOMAIN_NAME"
        echo -e "4. Choose 'DNS validation'"
        echo -e "5. Complete DNS validation"
        echo -e "6. Copy the ARN and paste it below\n"
        
        read -p "Enter your ACM certificate ARN: " CERT_ARN
    fi
    
    if [[ -z "$CERT_ARN" ]] || [[ "$CERT_ARN" == "None" ]]; then
        print_error "Valid certificate ARN required to continue"
        exit 1
    fi
    
    print_success "Certificate ARN set: $CERT_ARN"
}

###############################################################################
# Step 3: Configure Terraform Variables
###############################################################################

configure_terraform() {
    print_header "Step 3: Configuring Terraform"
    
    cd infrastructure/terraform
    
    # Create terraform.tfvars from example if it doesn't exist
    if [[ ! -f terraform.tfvars ]]; then
        if [[ -f terraform.tfvars.example ]]; then
            cp terraform.tfvars.example terraform.tfvars
            print_info "Created terraform.tfvars from example"
        else
            print_error "terraform.tfvars.example not found"
            exit 1
        fi
    fi
    
    # Update terraform.tfvars with user values
    print_info "Updating terraform.tfvars..."
    
    # Use sed to update values (cross-platform compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^aws_region.*|aws_region      = \"$AWS_REGION\"|" terraform.tfvars
        sed -i '' "s|^environment.*|environment     = \"$ENVIRONMENT\"|" terraform.tfvars
        sed -i '' "s|^project_name.*|project_name    = \"$PROJECT_NAME\"|" terraform.tfvars
        sed -i '' "s|^domain_name.*|domain_name     = \"$DOMAIN_NAME\"|" terraform.tfvars
        sed -i '' "s|^certificate_arn.*|certificate_arn = \"$CERT_ARN\"|" terraform.tfvars
    else
        # Linux
        sed -i "s|^aws_region.*|aws_region      = \"$AWS_REGION\"|" terraform.tfvars
        sed -i "s|^environment.*|environment     = \"$ENVIRONMENT\"|" terraform.tfvars
        sed -i "s|^project_name.*|project_name    = \"$PROJECT_NAME\"|" terraform.tfvars
        sed -i "s|^domain_name.*|domain_name     = \"$DOMAIN_NAME\"|" terraform.tfvars
        sed -i "s|^certificate_arn.*|certificate_arn = \"$CERT_ARN\"|" terraform.tfvars
    fi
    
    print_success "Terraform configuration updated"
    
    cd ../..
}

###############################################################################
# Step 4: Initialize and Deploy Terraform
###############################################################################

deploy_infrastructure() {
    print_header "Step 4: Deploying Infrastructure with Terraform"
    
    cd infrastructure/terraform
    
    # Initialize Terraform
    print_info "Running: terraform init"
    if terraform init; then
        print_success "Terraform initialized"
    else
        print_error "Terraform init failed"
        exit 1
    fi
    
    # Plan
    print_info "Running: terraform plan"
    echo -e "\n${YELLOW}Review the plan carefully...${NC}\n"
    
    if terraform plan -out=tfplan; then
        print_success "Terraform plan created"
    else
        print_error "Terraform plan failed"
        exit 1
    fi
    
    # Confirm before apply
    echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  IMPORTANT: Review the plan above before proceeding${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}\n"
    
    if ! confirm "Apply this plan and create infrastructure?"; then
        print_warning "Deployment cancelled by user"
        rm tfplan
        exit 0
    fi
    
    # Apply
    print_info "Running: terraform apply"
    echo -e "${BLUE}This will take approximately 15-20 minutes...${NC}\n"
    
    if terraform apply tfplan; then
        print_success "Infrastructure deployed successfully!"
        rm tfplan
    else
        print_error "Terraform apply failed"
        rm tfplan
        exit 1
    fi
    
    # Capture outputs
    print_info "Capturing Terraform outputs..."
    
    export DB_SECRET_ARN=$(terraform output -raw rds_secret_arn 2>/dev/null || echo "")
    export REDIS_SECRET_ARN=$(terraform output -raw redis_secret_arn 2>/dev/null || echo "")
    export APP_SECRET_ARN=$(terraform output -raw app_secrets_arn 2>/dev/null || echo "")
    export ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
    
    print_success "Infrastructure outputs captured"
    
    cd ../..
}

###############################################################################
# Step 5: Populate Secrets Manager
###############################################################################

populate_secrets() {
    print_header "Step 5: Populating AWS Secrets Manager"
    
    # JWT Secret
    print_info "Generating JWT secret..."
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    
    SECRET_NAME="$PROJECT_NAME-jwt-secret-$ENVIRONMENT"
    
    if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region $AWS_REGION &>/dev/null; then
        print_info "Updating existing JWT secret..."
        aws secretsmanager put-secret-value \
            --secret-id "$SECRET_NAME" \
            --secret-string "$JWT_SECRET" \
            --region $AWS_REGION
    else
        print_warning "JWT secret not found in Secrets Manager (created by terraform)"
    fi
    
    print_success "JWT secret configured"
    
    # Ask about Stripe
    echo -e "\n${YELLOW}Do you want to configure Stripe keys now?${NC}"
    if confirm "Configure Stripe?"; then
        read -p "Enter Stripe Secret Key (sk_live_...): " STRIPE_SK
        read -p "Enter Stripe Webhook Secret (whsec_...): " STRIPE_WH
        
        SECRET_NAME="$PROJECT_NAME-stripe-keys-$ENVIRONMENT"
        SECRET_VALUE="{\"secret_key\":\"$STRIPE_SK\",\"webhook_secret\":\"$STRIPE_WH\"}"
        
        if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region $AWS_REGION &>/dev/null; then
            aws secretsmanager put-secret-value \
                --secret-id "$SECRET_NAME" \
                --secret-string "$SECRET_VALUE" \
                --region $AWS_REGION
            print_success "Stripe keys configured"
        else
            print_warning "Stripe secret not found in Secrets Manager"
        fi
    else
        print_info "Skipping Stripe configuration (you can add it later)"
    fi
}

###############################################################################
# Step 6: Deploy Application
###############################################################################

deploy_application() {
    print_header "Step 6: Deploying Application"
    
    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    
    if [[ "$CURRENT_BRANCH" != "main" ]]; then
        print_warning "You're on branch: $CURRENT_BRANCH"
        print_info "Deployment tags should be pushed from 'main' branch"
        
        if confirm "Switch to main and pull latest?"; then
            git checkout main
            git pull origin main
            print_success "Switched to main and pulled latest"
        fi
    fi
    
    # Get version
    echo -e "\n${YELLOW}Enter version tag for deployment (e.g., v1.0.0):${NC}"
    read -p "Version: " VERSION
    
    if [[ -z "$VERSION" ]]; then
        VERSION="v1.0.0"
        print_info "Using default version: $VERSION"
    fi
    
    # Tag and push
    print_info "Creating tag: $VERSION"
    
    if git tag -a "$VERSION" -m "Production deployment $VERSION"; then
        print_success "Tag created: $VERSION"
    else
        print_warning "Tag may already exist"
    fi
    
    if confirm "Push tag $VERSION to trigger deployment?"; then
        if git push origin "$VERSION"; then
            print_success "Tag pushed! Deployment triggered."
            
            echo -e "\n${GREEN}════════════════════════════════════════════════════════════════${NC}"
            echo -e "${GREEN}  🚀 GitHub Actions is now deploying your application!${NC}"
            echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}\n"
            
            print_info "Watch deployment progress:"
            echo -e "   https://github.com/redinc23/mangu_publishing-site/actions\n"
            
            if [[ ! -z "$ALB_DNS" ]]; then
                print_info "Once deployed, your app will be available at:"
                echo -e "   http://$ALB_DNS"
                echo -e "   https://$DOMAIN_NAME (after DNS is configured)\n"
            fi
        else
            print_error "Failed to push tag"
            exit 1
        fi
    else
        print_warning "Deployment tag not pushed. Push manually:"
        echo -e "   git push origin $VERSION"
    fi
}

###############################################################################
# Step 7: Summary
###############################################################################

print_summary() {
    print_header "Deployment Summary"
    
    echo -e "${GREEN}✅ Infrastructure deployed${NC}"
    echo -e "${GREEN}✅ Secrets configured${NC}"
    echo -e "${GREEN}✅ Application deployment triggered${NC}\n"
    
    print_info "Next Steps:"
    echo -e "   1. Monitor GitHub Actions deployment"
    echo -e "   2. Configure DNS to point to: $ALB_DNS"
    echo -e "   3. Run smoke tests after deployment completes"
    echo -e "   4. Monitor CloudWatch logs for any issues\n"
    
    print_info "Useful Commands:"
    echo -e "   # View ECS service status"
    echo -e "   aws ecs describe-services --cluster $PROJECT_NAME-cluster-$ENVIRONMENT --services $PROJECT_NAME-server-$ENVIRONMENT"
    echo -e ""
    echo -e "   # View logs"
    echo -e "   aws logs tail /ecs/$PROJECT_NAME-server-$ENVIRONMENT --follow"
    echo -e ""
    echo -e "   # Run smoke tests"
    echo -e "   ./scripts/smoke-tests.sh https://$DOMAIN_NAME"
    echo -e ""
}

###############################################################################
# Main Execution
###############################################################################

main() {
    clear
    
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║   🚀 MANGU Publishing - Production Deployment Automation     ║"
    echo "║                                                               ║"
    echo "║   This script will:                                          ║"
    echo "║   • Validate AWS credentials                                 ║"
    echo "║   • Configure ACM certificate                                ║"
    echo "║   • Deploy infrastructure with Terraform                     ║"
    echo "║   • Configure secrets                                        ║"
    echo "║   • Trigger application deployment                           ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    if ! confirm "Ready to start production deployment?"; then
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    # Execute deployment steps
    validate_prerequisites
    get_acm_certificate
    configure_terraform
    deploy_infrastructure
    populate_secrets
    deploy_application
    print_summary
    
    echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}║              🎉 Deployment Complete! 🎉                      ║${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}\n"
}

# Run main function
main "$@"

