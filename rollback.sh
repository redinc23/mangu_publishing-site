#!/bin/bash

###############################################################################
# MANGU Publishing - Quick Rollback Script
# 
# Rolls back to a previous deployment
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="mangu-publishing"
ENVIRONMENT="production"
AWS_REGION="us-east-1"

echo -e "${RED}⚠️  ROLLBACK SCRIPT${NC}\n"

# Configuration
read -p "Service to rollback (server/client/both): " SERVICE
read -p "Rollback to revision number (leave empty for previous): " REVISION

if [[ -z "$SERVICE" ]]; then
    SERVICE="both"
fi

echo -e "\n${YELLOW}This will rollback:${NC}"
echo "  Service: $SERVICE"
echo "  Revision: ${REVISION:-previous}"
echo ""

read -p "Type 'rollback' to confirm: " CONFIRM

if [[ "$CONFIRM" != "rollback" ]]; then
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
fi

rollback_service() {
    local service=$1
    local cluster="$PROJECT_NAME-cluster-$ENVIRONMENT"
    local service_name="$PROJECT_NAME-$service-$ENVIRONMENT"
    
    echo -e "\n${BLUE}Rolling back $service...${NC}"
    
    if [[ -z "$REVISION" ]]; then
        # Get current task definition
        CURRENT_TD=$(aws ecs describe-services \
            --cluster "$cluster" \
            --services "$service_name" \
            --region "$AWS_REGION" \
            --query 'services[0].taskDefinition' \
            --output text)
        
        # Extract family and revision
        FAMILY=$(echo "$CURRENT_TD" | cut -d'/' -f2 | cut -d':' -f1)
        CURRENT_REV=$(echo "$CURRENT_TD" | cut -d':' -f2)
        PREVIOUS_REV=$((CURRENT_REV - 1))
        
        if [[ $PREVIOUS_REV -lt 1 ]]; then
            echo -e "${RED}Cannot rollback: already at revision 1${NC}"
            return 1
        fi
        
        TARGET_TD="$FAMILY:$PREVIOUS_REV"
    else
        # Use specified revision
        FAMILY=$(aws ecs describe-services \
            --cluster "$cluster" \
            --services "$service_name" \
            --region "$AWS_REGION" \
            --query 'services[0].taskDefinition' \
            --output text | cut -d'/' -f2 | cut -d':' -f1)
        
        TARGET_TD="$FAMILY:$REVISION"
    fi
    
    echo -e "${BLUE}Rolling back to: $TARGET_TD${NC}"
    
    # Update service
    aws ecs update-service \
        --cluster "$cluster" \
        --service "$service_name" \
        --task-definition "$TARGET_TD" \
        --region "$AWS_REGION" \
        --force-new-deployment \
        > /dev/null
    
    echo -e "${GREEN}✅ Rollback initiated for $service${NC}"
}

# Perform rollback
if [[ "$SERVICE" == "both" ]]; then
    rollback_service "server"
    rollback_service "client"
elif [[ "$SERVICE" == "server" ]] || [[ "$SERVICE" == "client" ]]; then
    rollback_service "$SERVICE"
else
    echo -e "${RED}Invalid service: $SERVICE${NC}"
    exit 1
fi

echo -e "\n${BLUE}Waiting for services to stabilize...${NC}"
echo -e "${YELLOW}This may take a few minutes${NC}\n"

# Wait for stability
if [[ "$SERVICE" == "both" ]] || [[ "$SERVICE" == "server" ]]; then
    aws ecs wait services-stable \
        --cluster "$PROJECT_NAME-cluster-$ENVIRONMENT" \
        --services "$PROJECT_NAME-server-$ENVIRONMENT" \
        --region "$AWS_REGION"
    echo -e "${GREEN}✅ Server stable${NC}"
fi

if [[ "$SERVICE" == "both" ]] || [[ "$SERVICE" == "client" ]]; then
    aws ecs wait services-stable \
        --cluster "$PROJECT_NAME-cluster-$ENVIRONMENT" \
        --services "$PROJECT_NAME-client-$ENVIRONMENT" \
        --region "$AWS_REGION"
    echo -e "${GREEN}✅ Client stable${NC}"
fi

echo -e "\n${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Rollback Complete!                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}\n"

# Run smoke tests if script exists
if [[ -f "scripts/smoke-tests.sh" ]]; then
    echo -e "${BLUE}Run smoke tests? [y/N]:${NC}"
    read -p "" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/smoke-tests.sh "https://your-domain.com"
    fi
fi

