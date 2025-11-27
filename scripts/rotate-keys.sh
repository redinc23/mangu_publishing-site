#!/bin/bash
###############################################################################
# MANGU Publishing - Credential Rotation Script
#
# Rotates JWT secrets and optionally Stripe webhook secrets in production.
# Run quarterly or when credentials are compromised.
#
# Usage:
#   ./rotate-keys.sh jwt            # Rotate JWT secret only
#   ./rotate-keys.sh stripe         # Rotate Stripe webhook secret only
#   ./rotate-keys.sh all            # Rotate all supported keys
###############################################################################

set -euo pipefail

# Configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
PROJECT_NAME="mangu-publishing"
AWS_REGION="${AWS_REGION:-us-east-1}"

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

warning() {
    echo -e "${YELLOW}⚠️  $*${NC}"
}

error() {
    echo -e "${RED}❌ $*${NC}" >&2
    exit 1
}

confirm() {
    # Check if running with --force flag
    if [ "${FORCE_ROTATION:-false}" = "true" ]; then
        log "Force mode enabled, skipping confirmation"
        return 0
    fi
    
    read -p "$1 [y/N]: " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

rotate_jwt_secret() {
    log "Rotating JWT secret for $ENVIRONMENT environment..."
    
    SECRET_NAME="${PROJECT_NAME}-jwt-secret-${ENVIRONMENT}"
    
    # Backup old secret
    log "Backing up current JWT secret..."
    OLD_SECRET=$(aws secretsmanager get-secret-value \
        --secret-id "$SECRET_NAME" \
        --region "$AWS_REGION" \
        --query SecretString \
        --output text 2>/dev/null || echo "")
    
    if [[ -n "$OLD_SECRET" ]]; then
        BACKUP_FILE="jwt-secret-backup-$(date +%Y%m%d-%H%M%S).txt"
        echo "$OLD_SECRET" > "$BACKUP_FILE"
        chmod 600 "$BACKUP_FILE"
        log "Old secret backed up to: $BACKUP_FILE"
    fi
    
    # Use provided value or generate new JWT secret
    if [[ -n "${NEW_JWT_VALUE:-}" ]]; then
        log "Using provided JWT secret value..."
        NEW_JWT_SECRET="$NEW_JWT_VALUE"
    else
        log "Generating new JWT secret..."
        NEW_JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    fi
    
    # Update secret in AWS Secrets Manager
    log "Updating secret in Secrets Manager..."
    aws secretsmanager put-secret-value \
        --secret-id "$SECRET_NAME" \
        --secret-string "$NEW_JWT_SECRET" \
        --region "$AWS_REGION" \
        --description "Rotated on $(date +'%Y-%m-%d %H:%M:%S')"
    
    success "JWT secret rotated successfully"
    
    # Trigger ECS service update to pick up new secret
    warning "ECS services need to be restarted to pick up the new secret"
    
    if confirm "Restart ECS services now?"; then
        log "Restarting ECS services..."
        
        CLUSTER="${PROJECT_NAME}-cluster-${ENVIRONMENT}"
        SERVER_SERVICE="${PROJECT_NAME}-server-${ENVIRONMENT}"
        CLIENT_SERVICE="${PROJECT_NAME}-client-${ENVIRONMENT}"
        
        aws ecs update-service \
            --cluster "$CLUSTER" \
            --service "$SERVER_SERVICE" \
            --force-new-deployment \
            --region "$AWS_REGION" > /dev/null
        
        aws ecs update-service \
            --cluster "$CLUSTER" \
            --service "$CLIENT_SERVICE" \
            --force-new-deployment \
            --region "$AWS_REGION" > /dev/null
        
        success "Services restarted. New deployments will use the rotated secret."
        log "Monitor deployment: aws ecs describe-services --cluster $CLUSTER --services $SERVER_SERVICE"
    else
        warning "Remember to restart services manually: ./quick-deploy.sh"
    fi
}

rotate_stripe_webhook_secret() {
    log "Rotating Stripe webhook secret for $ENVIRONMENT environment..."
    
    SECRET_NAME="${PROJECT_NAME}-stripe-keys-${ENVIRONMENT}"
    
    # Get current Stripe configuration
    log "Fetching current Stripe configuration..."
    STRIPE_CONFIG=$(aws secretsmanager get-secret-value \
        --secret-id "$SECRET_NAME" \
        --region "$AWS_REGION" \
        --query SecretString \
        --output text)
    
    if [[ -z "$STRIPE_CONFIG" ]]; then
        error "Stripe configuration not found in Secrets Manager"
    fi
    
    # Backup
    BACKUP_FILE="stripe-keys-backup-$(date +%Y%m%d-%H%M%S).json"
    echo "$STRIPE_CONFIG" > "$BACKUP_FILE"
    chmod 600 "$BACKUP_FILE"
    log "Current config backed up to: $BACKUP_FILE"
    
    warning "Stripe webhook secret rotation requires manual steps:"
    echo ""
    echo "1. Go to: https://dashboard.stripe.com/webhooks"
    echo "2. Select your production webhook endpoint"
    echo "3. Click 'Roll secret' in the webhook settings"
    echo "4. Copy the new webhook secret"
    echo ""
    
    read -p "Enter new Stripe webhook secret (whsec_xxx): " NEW_WEBHOOK_SECRET
    
    if [[ ! "$NEW_WEBHOOK_SECRET" =~ ^whsec_ ]]; then
        error "Invalid webhook secret format. Should start with 'whsec_'"
    fi
    
    # Parse current config and update webhook secret
    SECRET_KEY=$(echo "$STRIPE_CONFIG" | jq -r .secret_key)
    PUBLISHABLE_KEY=$(echo "$STRIPE_CONFIG" | jq -r .publishable_key // .pk)
    
    NEW_CONFIG=$(jq -n \
        --arg sk "$SECRET_KEY" \
        --arg pk "$PUBLISHABLE_KEY" \
        --arg ws "$NEW_WEBHOOK_SECRET" \
        '{secret_key: $sk, publishable_key: $pk, webhook_secret: $ws}')
    
    aws secretsmanager put-secret-value \
        --secret-id "$SECRET_NAME" \
        --secret-string "$NEW_CONFIG" \
        --region "$AWS_REGION" \
        --description "Webhook secret rotated on $(date +'%Y-%m-%d')"
    
    success "Stripe webhook secret updated in Secrets Manager"
    warning "Restart services to apply changes: ./quick-deploy.sh"
}

rotate_db_password() {
    log "Database password rotation..."
    
    warning "RDS password rotation requires additional coordination:"
    echo ""
    echo "1. RDS will be briefly unavailable during rotation (~30 seconds)"
    echo "2. All active connections will be terminated"
    echo "3. Services will automatically reconnect with new credentials"
    echo ""
    
    if ! confirm "Proceed with RDS password rotation?"; then
        log "RDS password rotation cancelled"
        return
    fi
    
    DB_INSTANCE="${PROJECT_NAME}-db-${ENVIRONMENT}"
    SECRET_NAME="${PROJECT_NAME}-db-credentials-${ENVIRONMENT}"
    
    # Generate new password
    NEW_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
    
    log "Updating RDS master password..."
    aws rds modify-db-instance \
        --db-instance-identifier "$DB_INSTANCE" \
        --master-user-password "$NEW_PASSWORD" \
        --apply-immediately \
        --region "$AWS_REGION"
    
    log "Waiting for password change to apply..."
    aws rds wait db-instance-available \
        --db-instance-identifier "$DB_INSTANCE" \
        --region "$AWS_REGION"
    
    # Update Secrets Manager
    log "Updating database credentials in Secrets Manager..."
    DB_CONFIG=$(aws secretsmanager get-secret-value \
        --secret-id "$SECRET_NAME" \
        --region "$AWS_REGION" \
        --query SecretString \
        --output text)
    
    UPDATED_CONFIG=$(echo "$DB_CONFIG" | jq --arg pass "$NEW_PASSWORD" '.password = $pass')
    
    aws secretsmanager put-secret-value \
        --secret-id "$SECRET_NAME" \
        --secret-string "$UPDATED_CONFIG" \
        --region "$AWS_REGION"
    
    success "Database password rotated successfully"
    log "Services will automatically pick up new credentials on next connection"
}

show_usage() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  jwt      - Rotate JWT signing secret"
    echo "  stripe   - Rotate Stripe webhook secret"
    echo "  db       - Rotate database master password"
    echo "  all      - Rotate JWT and Stripe secrets"
    echo ""
    echo "Options:"
    echo "  --force         - Skip confirmation prompts"
    echo "  --new-value VAL - Use specified value instead of generating"
    echo ""
    echo "Environment variables:"
    echo "  ENVIRONMENT        - Target environment (default: production)"
    echo "  AWS_REGION         - AWS region (default: us-east-1)"
    echo "  FORCE_ROTATION     - Set to 'true' to skip prompts"
    echo "  NEW_JWT_VALUE      - Preset JWT secret value"
    echo ""
    echo "Examples:"
    echo "  $0 jwt"
    echo "  $0 jwt --force"
    echo "  $0 --new-value 'mysecret' jwt"
    echo "  ENVIRONMENT=staging $0 all"
}

# Main execution
main() {
    # Parse options
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --force)
                export FORCE_ROTATION=true
                shift
                ;;
            --new-value)
                export NEW_JWT_VALUE="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                COMMAND="$1"
                shift
                break
                ;;
        esac
    done
    
    if [[ -z "${COMMAND:-}" ]]; then
        show_usage
        exit 1
    fi
    
    COMMAND="$1"
    
    echo -e "${BLUE}"
    cat << 'EOF'
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          MANGU Publishing - Credential Rotation           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    log "Environment: $ENVIRONMENT"
    log "Region: $AWS_REGION"
    echo ""
    
    warning "This will rotate production credentials!"
    
    if ! confirm "Continue?"; then
        log "Operation cancelled"
        exit 0
    fi
    
    case "$COMMAND" in
        jwt)
            rotate_jwt_secret
            ;;
        stripe)
            rotate_stripe_webhook_secret
            ;;
        db)
            rotate_db_password
            ;;
        all)
            rotate_jwt_secret
            echo ""
            rotate_stripe_webhook_secret
            ;;
        *)
            error "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
    
    echo ""
    success "Credential rotation complete!"
    log "Backup files saved in current directory"
    log "Monitor CloudWatch logs for any authentication errors"
}

main "$@"
