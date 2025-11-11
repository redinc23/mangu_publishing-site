#!/bin/bash

###############################################################################
# MANGU Publishing - Wait for ACM Certificate & Auto-Deploy
#
# This script:
# 1. Shows you the DNS records to add
# 2. Polls certificate status every 30 seconds
# 3. Automatically runs terraform apply when certificate is ISSUED
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
CERT_ARN="arn:aws:acm:us-east-1:542993749514:certificate/036fa3ec-548a-437c-8d5e-d8ae3d8c2243"
AWS_REGION="us-east-1"
POLL_INTERVAL=30

clear

echo -e "${BLUE}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎯 ACM Certificate Validation & Auto-Deploy                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

###############################################################################
# Step 1: Show DNS Validation Records
###############################################################################

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Step 1: Add DNS Validation Record${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Fetching DNS validation records from ACM...${NC}\n"

# Get validation record
VALIDATION_RECORD=$(aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region "$AWS_REGION" \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
    --output json)

RECORD_NAME=$(echo "$VALIDATION_RECORD" | jq -r '.Name')
RECORD_TYPE=$(echo "$VALIDATION_RECORD" | jq -r '.Type')
RECORD_VALUE=$(echo "$VALIDATION_RECORD" | jq -r '.Value')

echo -e "${GREEN}Add this CNAME record to your DNS provider:${NC}\n"
echo -e "  ${CYAN}Name:${NC}  $RECORD_NAME"
echo -e "  ${CYAN}Type:${NC}  $RECORD_TYPE"
echo -e "  ${CYAN}Value:${NC} $RECORD_VALUE"
echo -e ""

# Pretty table format
echo -e "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│  DNS Record to Add:                                         │${NC}"
echo -e "${BLUE}├─────────────────────────────────────────────────────────────┤${NC}"
printf "${BLUE}│${NC}  %-10s ${GREEN}%-47s${NC}${BLUE}│${NC}\n" "Name:" "$RECORD_NAME"
printf "${BLUE}│${NC}  %-10s ${GREEN}%-47s${NC}${BLUE}│${NC}\n" "Type:" "$RECORD_TYPE"
printf "${BLUE}│${NC}  %-10s ${GREEN}%-47s${NC}${BLUE}│${NC}\n" "Value:" "${RECORD_VALUE:0:47}"
if [[ ${#RECORD_VALUE} -gt 47 ]]; then
    printf "${BLUE}│${NC}  %-10s ${GREEN}%-47s${NC}${BLUE}│${NC}\n" "" "${RECORD_VALUE:47:47}"
fi
echo -e "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
echo -e ""

# Copy-paste commands for common DNS providers
echo -e "${YELLOW}Quick Commands for Popular DNS Providers:${NC}\n"

echo -e "${CYAN}If using AWS Route53:${NC}"
cat << EOF
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "$RECORD_NAME",
      "Type": "$RECORD_TYPE",
      "TTL": 300,
      "ResourceRecords": [{"Value": "$RECORD_VALUE"}]
    }
  }]
}'
EOF

echo -e "\n${CYAN}If using Cloudflare:${NC}"
echo "  Go to: https://dash.cloudflare.com"
echo "  DNS → Add record → CNAME"
echo "  Name: ${RECORD_NAME}"
echo "  Target: ${RECORD_VALUE}"
echo ""

echo -e "${CYAN}If using other provider:${NC}"
echo "  Copy the Name, Type, and Value above"
echo "  Add as CNAME record in your DNS dashboard"
echo ""

echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
read -p "Press Enter when you've added the DNS record..."
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}\n"

###############################################################################
# Step 2: Poll Certificate Status
###############################################################################

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Step 2: Waiting for Certificate Validation${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}\n"

echo -e "${BLUE}Polling certificate status every ${POLL_INTERVAL} seconds...${NC}"
echo -e "${YELLOW}This usually takes 5-30 minutes${NC}\n"

ATTEMPTS=0
MAX_ATTEMPTS=120  # 1 hour max

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    STATUS=$(aws acm describe-certificate \
        --certificate-arn "$CERT_ARN" \
        --region "$AWS_REGION" \
        --query 'Certificate.Status' \
        --output text 2>/dev/null || echo "ERROR")
    
    TIMESTAMP=$(date '+%H:%M:%S')
    
    if [[ "$STATUS" == "ISSUED" ]]; then
        echo -e "\n${GREEN}════════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  ✅ Certificate ISSUED at $TIMESTAMP!${NC}"
        echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}\n"
        break
    elif [[ "$STATUS" == "PENDING_VALIDATION" ]]; then
        echo -e "${YELLOW}[$TIMESTAMP]${NC} Status: ${YELLOW}PENDING_VALIDATION${NC} (attempt $((ATTEMPTS + 1))/$MAX_ATTEMPTS)"
    elif [[ "$STATUS" == "FAILED" ]]; then
        echo -e "\n${RED}❌ Certificate validation FAILED${NC}"
        echo -e "${RED}Please check AWS Console for details${NC}\n"
        exit 1
    else
        echo -e "${YELLOW}[$TIMESTAMP]${NC} Status: ${YELLOW}$STATUS${NC}"
    fi
    
    ATTEMPTS=$((ATTEMPTS + 1))
    sleep $POLL_INTERVAL
done

if [[ "$STATUS" != "ISSUED" ]]; then
    echo -e "\n${RED}❌ Timeout waiting for certificate validation${NC}"
    echo -e "${YELLOW}Current status: $STATUS${NC}\n"
    echo -e "You can:"
    echo -e "  1. Check DNS records are correct"
    echo -e "  2. Wait longer (DNS propagation can take time)"
    echo -e "  3. Check AWS Console: https://console.aws.amazon.com/acm"
    echo -e ""
    exit 1
fi

###############################################################################
# Step 3: Pull Latest Changes
###############################################################################

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Step 3: Pulling Latest Terraform Fixes${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}\n"

cd /Users/redinc23gmail.com/projects/mangu2-publishing

if git pull origin chore/ci-hardening-ops; then
    echo -e "${GREEN}✅ Latest changes pulled${NC}\n"
else
    echo -e "${YELLOW}⚠️  Git pull had issues, continuing anyway${NC}\n"
fi

###############################################################################
# Step 4: Run Terraform Plan
###############################################################################

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Step 4: Running Terraform Plan${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}\n"

cd infrastructure/terraform

echo -e "${BLUE}Running: terraform plan${NC}\n"

if terraform plan -out=tfplan; then
    echo -e "\n${GREEN}✅ Terraform plan successful!${NC}\n"
else
    echo -e "\n${RED}❌ Terraform plan failed${NC}"
    echo -e "${YELLOW}Check errors above and fix before applying${NC}\n"
    exit 1
fi

###############################################################################
# Step 5: Confirm and Apply
###############################################################################

echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  ⚠️  IMPORTANT: Review the plan above${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}\n"

echo -e "This will create:"
echo -e "  • VPC with Multi-AZ subnets"
echo -e "  • PostgreSQL RDS (Multi-AZ)"
echo -e "  • Redis ElastiCache"
echo -e "  • ECS Fargate cluster"
echo -e "  • Application Load Balancer"
echo -e "  • CloudFront CDN"
echo -e "  • S3 buckets"
echo -e "  • Secrets Manager secrets"
echo -e "  • CloudWatch monitoring"
echo -e ""
echo -e "${CYAN}Estimated cost: \$190-414/month${NC}"
echo -e "${CYAN}Estimated time: 15-20 minutes${NC}"
echo -e ""

read -p "Apply this plan? [y/N]: " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled by user${NC}"
    rm -f tfplan
    exit 0
fi

###############################################################################
# Step 6: Apply Terraform
###############################################################################

echo -e "\n${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Step 6: Applying Terraform (15-20 minutes)${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}\n"

START_TIME=$(date +%s)

if terraform apply tfplan; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    MINUTES=$((DURATION / 60))
    SECONDS=$((DURATION % 60))
    
    echo -e "\n${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ Infrastructure Deployed Successfully!${NC}"
    echo -e "${GREEN}  ⏱️  Time: ${MINUTES}m ${SECONDS}s${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}\n"
    
    rm -f tfplan
else
    echo -e "\n${RED}❌ Terraform apply failed${NC}"
    echo -e "${YELLOW}Check errors above${NC}\n"
    rm -f tfplan
    exit 1
fi

###############################################################################
# Step 7: Capture Outputs
###############################################################################

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Step 7: Infrastructure Summary${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}\n"

echo -e "${GREEN}📊 Deployed Resources:${NC}\n"

terraform output -json > /tmp/terraform-outputs.json

ALB_DNS=$(terraform output -raw load_balancer_dns 2>/dev/null || echo "N/A")
CLUSTER_NAME=$(terraform output -raw ecs_cluster_name 2>/dev/null || echo "N/A")
SERVER_ECR=$(terraform output -raw server_ecr_url 2>/dev/null || echo "N/A")
CLIENT_ECR=$(terraform output -raw client_ecr_url 2>/dev/null || echo "N/A")

echo -e "  ${CYAN}ECS Cluster:${NC}      $CLUSTER_NAME"
echo -e "  ${CYAN}Load Balancer:${NC}    $ALB_DNS"
echo -e "  ${CYAN}Server ECR:${NC}       $SERVER_ECR"
echo -e "  ${CYAN}Client ECR:${NC}       $CLIENT_ECR"
echo -e ""

###############################################################################
# Step 8: Next Steps
###############################################################################

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Step 8: Next Steps${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}1. Populate Secrets (Required before deploying app):${NC}\n"

echo -e "   ${GREEN}# Generate and upload JWT secret${NC}"
echo -e '   aws secretsmanager put-secret-value \'
echo -e '     --secret-id mangu-publishing-jwt-secret-production \'
echo -e '     --secret-string "$(openssl rand -base64 64)"'
echo -e ""

echo -e "   ${GREEN}# Optional: Add Stripe keys${NC}"
echo -e '   aws secretsmanager put-secret-value \'
echo -e '     --secret-id mangu-publishing-stripe-keys-production \'
echo -e '     --secret-string '"'"'{"secret_key":"sk_live_xxx","webhook_secret":"whsec_xxx"}'"'"
echo -e ""

echo -e "${YELLOW}2. Deploy Application:${NC}\n"
echo -e "   ${GREEN}cd /Users/redinc23gmail.com/projects/mangu2-publishing${NC}"
echo -e "   ${GREEN}./quick-deploy.sh${NC}"
echo -e ""

echo -e "${YELLOW}3. Monitor Deployment:${NC}\n"
echo -e "   ${CYAN}GitHub Actions:${NC} https://github.com/redinc23/mangu_publishing-site/actions"
echo -e "   ${CYAN}CloudWatch Logs:${NC} aws logs tail /ecs/$CLUSTER_NAME --follow"
echo -e ""

echo -e "${YELLOW}4. Verify with Smoke Tests:${NC}\n"
echo -e "   ${GREEN}./scripts/smoke-tests.sh http://$ALB_DNS${NC}"
echo -e ""

###############################################################################
# Step 9: Create Quick Reference
###############################################################################

cat > /Users/redinc23gmail.com/projects/mangu2-publishing/DEPLOYMENT_COMPLETE.txt << ENDREF
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ✅ INFRASTRUCTURE DEPLOYED SUCCESSFULLY!                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Deployment Date: $(date)
Cluster: $CLUSTER_NAME
Load Balancer: $ALB_DNS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. POPULATE SECRETS (REQUIRED):

   # JWT Secret
   aws secretsmanager put-secret-value \
     --secret-id mangu-publishing-jwt-secret-production \
     --secret-string "\$(openssl rand -base64 64)"

   # Stripe Keys (Optional)
   aws secretsmanager put-secret-value \
     --secret-id mangu-publishing-stripe-keys-production \
     --secret-string '{"secret_key":"sk_live_xxx","webhook_secret":"whsec_xxx"}'

2. DEPLOY APPLICATION:

   cd /Users/redinc23gmail.com/projects/mangu2-publishing
   ./quick-deploy.sh

3. CONFIGURE DNS:

   Add A record or CNAME:
   publishing.mangu.com → $ALB_DNS

4. VERIFY DEPLOYMENT:

   ./scripts/smoke-tests.sh http://$ALB_DNS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USEFUL COMMANDS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View logs:
  aws logs tail /ecs/$CLUSTER_NAME --follow

Check ECS services:
  aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services mangu-publishing-server-production

View RDS status:
  aws rds describe-db-instances \
    --db-instance-identifier mangu-publishing-db-production

Emergency rollback:
  ./rollback.sh

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENDREF

echo -e "${GREEN}✅ Quick reference saved to: DEPLOYMENT_COMPLETE.txt${NC}\n"

echo -e "${BLUE}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║              🎉 DEPLOYMENT AUTOMATION COMPLETE! 🎉           ║
║                                                               ║
║  Infrastructure is ready. Now populate secrets and deploy!   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

