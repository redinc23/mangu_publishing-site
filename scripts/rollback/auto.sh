#!/bin/bash
set -euo pipefail

# Automatic rollback script for failed deployments
# Usage: ./auto.sh --previous-task-definition /path/to/task-definition.json

PROJECT_NAME="mangu-publishing"
AWS_REGION="${AWS_REGION:-us-west-2}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"
}

success() {
    echo -e "${GREEN}✅ $*${NC}"
}

error() {
    echo -e "${RED}❌ $*${NC}" >&2
}

warning() {
    echo -e "${YELLOW}⚠️  $*${NC}"
}

# Parse arguments
TASK_DEF_FILE=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --previous-task-definition)
            TASK_DEF_FILE="$2"
            shift 2
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [[ -z "$TASK_DEF_FILE" ]]; then
    error "Missing required argument: --previous-task-definition"
    echo "Usage: $0 --previous-task-definition /path/to/task-definition.json"
    exit 1
fi

if [[ ! -f "$TASK_DEF_FILE" ]]; then
    error "Task definition file not found: $TASK_DEF_FILE"
    exit 1
fi

log "🔄 Starting automatic rollback process..."
log "Environment: $ENVIRONMENT"
log "Region: $AWS_REGION"
echo ""

# ECS configuration
CLUSTER="${PROJECT_NAME}-cluster-${ENVIRONMENT}"
SERVER_SERVICE="${PROJECT_NAME}-server-${ENVIRONMENT}"
CLIENT_SERVICE="${PROJECT_NAME}-client-${ENVIRONMENT}"

# Get current deployment state
log "Capturing current deployment state..."
aws ecs describe-services \
    --cluster "$CLUSTER" \
    --services "$SERVER_SERVICE" "$CLIENT_SERVICE" \
    --region "$AWS_REGION" \
    --query 'services[*].{Service:serviceName,TaskDef:taskDefinition,Running:runningCount,Desired:desiredCount}' \
    --output table

echo ""

# Get previous stable task definition
log "Reading previous task definition from $TASK_DEF_FILE..."
PREVIOUS_TASK_DEF=$(cat "$TASK_DEF_FILE" | jq -r '.taskDefinitionArn // .family + ":" + (.revision | tostring)')

if [[ -z "$PREVIOUS_TASK_DEF" ]]; then
    error "Could not extract task definition ARN from file"
    exit 1
fi

log "Previous stable task definition: $PREVIOUS_TASK_DEF"

# Rollback server service
log "Rolling back server service to previous version..."
aws ecs update-service \
    --cluster "$CLUSTER" \
    --service "$SERVER_SERVICE" \
    --task-definition "$PREVIOUS_TASK_DEF" \
    --force-new-deployment \
    --region "$AWS_REGION" \
    --output json > /dev/null

success "Server service rollback initiated"

# Rollback client service
log "Rolling back client service to previous version..."
aws ecs update-service \
    --cluster "$CLUSTER" \
    --service "$CLIENT_SERVICE" \
    --force-new-deployment \
    --region "$AWS_REGION" \
    --output json > /dev/null

success "Client service rollback initiated"

# Wait for services to stabilize
log "Waiting for services to stabilize (this may take several minutes)..."
echo ""

log "Waiting for server service..."
if aws ecs wait services-stable \
    --cluster "$CLUSTER" \
    --services "$SERVER_SERVICE" \
    --region "$AWS_REGION" 2>&1; then
    success "Server service rollback complete"
else
    error "Server service failed to stabilize"
    exit 1
fi

log "Waiting for client service..."
if aws ecs wait services-stable \
    --cluster "$CLUSTER" \
    --services "$CLIENT_SERVICE" \
    --region "$AWS_REGION" 2>&1; then
    success "Client service rollback complete"
else
    error "Client service failed to stabilize"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Automatic rollback completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verify deployment status
log "Final deployment status:"
aws ecs describe-services \
    --cluster "$CLUSTER" \
    --services "$SERVER_SERVICE" "$CLIENT_SERVICE" \
    --region "$AWS_REGION" \
    --query 'services[*].{Service:serviceName,Status:status,Running:runningCount,Desired:desiredCount,Rollout:deployments[0].rolloutState}' \
    --output table

echo ""
warning "Post-rollback checklist:"
echo "  1. Verify application health endpoints"
echo "  2. Check CloudWatch logs for errors"
echo "  3. Monitor user-facing metrics"
echo "  4. Review failed deployment logs"
echo "  5. Create incident report"
echo ""

log "Rollback timestamp: $(date +'%Y-%m-%d %H:%M:%S')"
