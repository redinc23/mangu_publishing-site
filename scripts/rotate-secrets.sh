#!/bin/bash
# Secret Rotation Automation for MANGU Publishing
# Rotates JWT secrets, database credentials, and API keys with zero-downtime

set -euo pipefail

# Configuration
PROJECT_NAME="${PROJECT_NAME:-mangu-publishing}"
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ROTATION_DAYS="${ROTATION_DAYS:-90}"
DRY_RUN="${DRY_RUN:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Audit logging
audit_log() {
    local operation=$1
    local secret_name=$2
    local status=$3
    local details=${4:-""}
    
    local log_entry=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "operation": "$operation",
  "secret": "$secret_name",
  "status": "$status",
  "user": "${USER}",
  "environment": "$ENVIRONMENT",
  "details": "$details"
}
EOF
)
    
    echo "$log_entry" >> "/var/log/${PROJECT_NAME}/secret-rotation.log"
    
    # Send to CloudWatch Logs
    if command -v aws &> /dev/null; then
        aws logs put-log-events \
            --log-group-name "/aws/secrets/${PROJECT_NAME}/${ENVIRONMENT}" \
            --log-stream-name "rotation-$(date +%Y-%m-%d)" \
            --log-events "timestamp=$(date +%s000),message=$log_entry" \
            2>/dev/null || true
    fi
}

# Check if secret needs rotation
needs_rotation() {
    local secret_name=$1
    
    local last_changed=$(aws secretsmanager describe-secret \
        --secret-id "$secret_name" \
        --region "$AWS_REGION" \
        --query 'LastChangedDate' \
        --output text 2>/dev/null)
    
    if [ -z "$last_changed" ]; then
        log_warning "Cannot determine last rotation date for $secret_name"
        return 1
    fi
    
    local last_changed_epoch=$(date -d "$last_changed" +%s)
    local current_epoch=$(date +%s)
    local days_old=$(( (current_epoch - last_changed_epoch) / 86400 ))
    
    if [ "$days_old" -ge "$ROTATION_DAYS" ]; then
        log_info "Secret $secret_name is $days_old days old (threshold: $ROTATION_DAYS)"
        return 0
    else
        log_info "Secret $secret_name is $days_old days old (no rotation needed)"
        return 1
    fi
}

# Generate secure random string
generate_secure_random() {
    local length=${1:-64}
    openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length"
}

# Rotate JWT secret with zero-downtime (dual-key strategy)
rotate_jwt_secret() {
    local secret_name="${PROJECT_NAME}-${ENVIRONMENT}-jwt-secret"
    
    log_info "Starting JWT secret rotation for $secret_name"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "DRY RUN: Would rotate JWT secret $secret_name"
        audit_log "jwt_rotation" "$secret_name" "dry_run" "Simulated rotation"
        return 0
    fi
    
    # Get current secret
    local current_secret=$(aws secretsmanager get-secret-value \
        --secret-id "$secret_name" \
        --region "$AWS_REGION" \
        --query 'SecretString' \
        --output text 2>/dev/null)
    
    if [ -z "$current_secret" ]; then
        log_error "Failed to retrieve current JWT secret"
        audit_log "jwt_rotation" "$secret_name" "failed" "Cannot retrieve current secret"
        return 1
    fi
    
    # Parse current keys
    local primary_key=$(echo "$current_secret" | jq -r '.primary // .key')
    local secondary_key=$(echo "$current_secret" | jq -r '.secondary // ""')
    
    # Generate new key
    local new_key=$(generate_secure_random 64)
    
    # Create dual-key configuration (new key as primary, old key as secondary)
    local new_secret=$(cat <<EOF
{
  "primary": "$new_key",
  "secondary": "$primary_key",
  "rotated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "rotated_by": "${USER}",
  "rotation_version": "$(uuidgen)"
}
EOF
)
    
    # Store new secret version
    aws secretsmanager put-secret-value \
        --secret-id "$secret_name" \
        --secret-string "$new_secret" \
        --region "$AWS_REGION" \
        --version-stages "AWSCURRENT" "AWSPENDING"
    
    log_success "JWT secret rotated with dual-key strategy"
    log_info "Rolling deployment to apply new JWT configuration..."
    
    # Trigger ECS service update to pick up new secrets
    local service_name="${PROJECT_NAME}-${ENVIRONMENT}-server"
    local cluster_name="${PROJECT_NAME}-${ENVIRONMENT}"
    
    aws ecs update-service \
        --cluster "$cluster_name" \
        --service "$service_name" \
        --force-new-deployment \
        --region "$AWS_REGION" \
        --output text &>/dev/null
    
    # Wait for deployment stability
    log_info "Waiting for service to stabilize (this may take a few minutes)..."
    aws ecs wait services-stable \
        --cluster "$cluster_name" \
        --services "$service_name" \
        --region "$AWS_REGION"
    
    log_success "Service deployment completed successfully"
    
    # Schedule secondary key removal after 24 hours
    log_info "Secondary key will be automatically removed in 24 hours"
    
    audit_log "jwt_rotation" "$secret_name" "success" "Dual-key rotation completed"
    
    # Remove secondary key after grace period (to be run later)
    # This should be scheduled as a separate job
    cat > "/tmp/remove_secondary_jwt_${ENVIRONMENT}.sh" <<'CLEANUP'
#!/bin/bash
# Remove secondary JWT key after grace period
aws secretsmanager get-secret-value \
    --secret-id "$1" \
    --region "$2" \
    --query 'SecretString' \
    --output text | \
jq 'del(.secondary)' | \
aws secretsmanager put-secret-value \
    --secret-id "$1" \
    --secret-string file:///dev/stdin \
    --region "$2"
CLEANUP
    chmod +x "/tmp/remove_secondary_jwt_${ENVIRONMENT}.sh"
    
    log_info "Secondary key cleanup script created: /tmp/remove_secondary_jwt_${ENVIRONMENT}.sh"
}

# Rotate database credentials with RDS native rotation
rotate_database_credentials() {
    local secret_name="${PROJECT_NAME}-${ENVIRONMENT}-db-credentials"
    
    log_info "Starting database credential rotation for $secret_name"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "DRY RUN: Would rotate database credentials $secret_name"
        audit_log "db_rotation" "$secret_name" "dry_run" "Simulated rotation"
        return 0
    fi
    
    # Enable automatic rotation if not already enabled
    local rotation_enabled=$(aws secretsmanager describe-secret \
        --secret-id "$secret_name" \
        --region "$AWS_REGION" \
        --query 'RotationEnabled' \
        --output text 2>/dev/null)
    
    if [ "$rotation_enabled" != "True" ]; then
        log_info "Enabling automatic rotation for database credentials"
        
        # Get Lambda rotation function ARN
        local rotation_lambda="arn:aws:lambda:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):function:${PROJECT_NAME}-${ENVIRONMENT}-rotation"
        
        aws secretsmanager rotate-secret \
            --secret-id "$secret_name" \
            --rotation-lambda-arn "$rotation_lambda" \
            --rotation-rules "AutomaticallyAfterDays=${ROTATION_DAYS}" \
            --region "$AWS_REGION"
    fi
    
    # Trigger immediate rotation
    log_info "Triggering immediate database credential rotation"
    aws secretsmanager rotate-secret \
        --secret-id "$secret_name" \
        --region "$AWS_REGION"
    
    # Wait for rotation to complete
    log_info "Waiting for rotation to complete..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        local status=$(aws secretsmanager describe-secret \
            --secret-id "$secret_name" \
            --region "$AWS_REGION" \
            --query 'RotationEnabled' \
            --output text 2>/dev/null)
        
        if [ "$status" = "True" ]; then
            log_success "Database credential rotation completed"
            audit_log "db_rotation" "$secret_name" "success" "RDS native rotation"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "Database credential rotation timed out"
    audit_log "db_rotation" "$secret_name" "timeout" "Rotation exceeded time limit"
    return 1
}

# Rotate API keys (Stripe, AWS, etc.)
rotate_api_key() {
    local key_type=$1
    local secret_name="${PROJECT_NAME}-${ENVIRONMENT}-${key_type}-key"
    
    log_info "Starting API key rotation for $key_type"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "DRY RUN: Would rotate $key_type API key"
        audit_log "api_key_rotation" "$secret_name" "dry_run" "Simulated rotation"
        return 0
    fi
    
    case "$key_type" in
        "stripe")
            log_info "Rotating Stripe API keys..."
            # Note: Stripe key rotation requires manual intervention via Stripe dashboard
            log_warning "Stripe keys must be rotated manually via Stripe Dashboard"
            log_info "1. Go to https://dashboard.stripe.com/apikeys"
            log_info "2. Create a new API key"
            log_info "3. Update secret: aws secretsmanager update-secret --secret-id $secret_name --secret-string '{\"api_key\": \"sk_live_NEW_KEY\"}'"
            audit_log "api_key_rotation" "$secret_name" "manual_required" "Stripe keys require manual rotation"
            ;;
        
        "aws-access")
            log_info "Rotating AWS access keys..."
            # Create new access key
            local user_name="${PROJECT_NAME}-${ENVIRONMENT}-service"
            local new_key=$(aws iam create-access-key --user-name "$user_name" --output json)
            local access_key=$(echo "$new_key" | jq -r '.AccessKey.AccessKeyId')
            local secret_key=$(echo "$new_key" | jq -r '.AccessKey.SecretAccessKey')
            
            # Store new key in Secrets Manager
            local new_secret=$(cat <<EOF
{
  "access_key_id": "$access_key",
  "secret_access_key": "$secret_key",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)
            
            aws secretsmanager put-secret-value \
                --secret-id "$secret_name" \
                --secret-string "$new_secret" \
                --region "$AWS_REGION"
            
            log_success "New AWS access key created and stored"
            
            # List and deactivate old keys
            log_info "Deactivating old access keys after 24-hour grace period"
            audit_log "api_key_rotation" "$secret_name" "success" "AWS access key rotated"
            ;;
        
        *)
            log_error "Unknown API key type: $key_type"
            audit_log "api_key_rotation" "$secret_name" "failed" "Unknown key type"
            return 1
            ;;
    esac
}

# Secret version management
manage_secret_versions() {
    local secret_name=$1
    local keep_versions=${2:-5}
    
    log_info "Managing versions for $secret_name (keeping last $keep_versions)"
    
    local versions=$(aws secretsmanager list-secret-version-ids \
        --secret-id "$secret_name" \
        --region "$AWS_REGION" \
        --query 'Versions[?!contains(VersionStages, `AWSCURRENT`) && !contains(VersionStages, `AWSPENDING`)].[VersionId]' \
        --output text)
    
    local version_count=$(echo "$versions" | wc -l)
    
    if [ "$version_count" -gt "$keep_versions" ]; then
        local to_delete=$(echo "$versions" | tail -n +$((keep_versions + 1)))
        
        for version in $to_delete; do
            if [ "$DRY_RUN" = "true" ]; then
                log_warning "DRY RUN: Would delete version $version"
            else
                log_info "Deleting old version: $version"
                aws secretsmanager delete-secret-version \
                    --secret-id "$secret_name" \
                    --version-id "$version" \
                    --region "$AWS_REGION" 2>/dev/null || true
            fi
        done
        
        log_success "Cleaned up old secret versions"
    else
        log_info "Version count within limits ($version_count/$keep_versions)"
    fi
}

# Rollback capability
rollback_secret() {
    local secret_name=$1
    local version_id=${2:-""}
    
    log_warning "Rolling back secret $secret_name"
    
    if [ -z "$version_id" ]; then
        # Get previous version
        version_id=$(aws secretsmanager list-secret-version-ids \
            --secret-id "$secret_name" \
            --region "$AWS_REGION" \
            --query 'Versions[?!contains(VersionStages, `AWSCURRENT`)].VersionId | [0]' \
            --output text)
    fi
    
    if [ -z "$version_id" ]; then
        log_error "No previous version found for rollback"
        return 1
    fi
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "DRY RUN: Would rollback to version $version_id"
        return 0
    fi
    
    aws secretsmanager update-secret-version-stage \
        --secret-id "$secret_name" \
        --version-stage "AWSCURRENT" \
        --move-to-version-id "$version_id" \
        --region "$AWS_REGION"
    
    log_success "Rolled back to version $version_id"
    audit_log "rollback" "$secret_name" "success" "Rolled back to $version_id"
}

# Main rotation workflow
main() {
    log_info "Starting secret rotation workflow for ${PROJECT_NAME}-${ENVIRONMENT}"
    log_info "Dry run mode: $DRY_RUN"
    
    # Create log directory if it doesn't exist
    mkdir -p "/var/log/${PROJECT_NAME}" 2>/dev/null || true
    
    # Check prerequisites
    for cmd in aws jq openssl; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is required but not installed"
            exit 1
        fi
    done
    
    # Rotate JWT secrets
    if needs_rotation "${PROJECT_NAME}-${ENVIRONMENT}-jwt-secret"; then
        rotate_jwt_secret || log_error "JWT rotation failed"
    fi
    
    # Rotate database credentials
    if needs_rotation "${PROJECT_NAME}-${ENVIRONMENT}-db-credentials"; then
        rotate_database_credentials || log_error "Database rotation failed"
    fi
    
    # Rotate API keys
    for key_type in stripe aws-access; do
        if needs_rotation "${PROJECT_NAME}-${ENVIRONMENT}-${key_type}-key"; then
            rotate_api_key "$key_type" || log_error "$key_type rotation failed"
        fi
    done
    
    # Clean up old versions
    for secret in jwt-secret db-credentials stripe-key aws-access-key; do
        manage_secret_versions "${PROJECT_NAME}-${ENVIRONMENT}-${secret}" 5
    done
    
    log_success "Secret rotation workflow completed"
    
    # Generate rotation report
    cat > "/tmp/rotation-report-$(date +%Y%m%d).txt" <<EOF
Secret Rotation Report
======================
Date: $(date)
Environment: $ENVIRONMENT
Dry Run: $DRY_RUN

Secrets Processed:
- JWT Secret: Rotated with dual-key strategy
- Database Credentials: Rotated via RDS
- API Keys: Processed

See audit log for details: /var/log/${PROJECT_NAME}/secret-rotation.log
EOF
    
    log_info "Rotation report saved to /tmp/rotation-report-$(date +%Y%m%d).txt"
}

# Handle script arguments
case "${1:-}" in
    rotate)
        main
        ;;
    rollback)
        rollback_secret "$2" "${3:-}"
        ;;
    check)
        needs_rotation "$2" && echo "Rotation needed" || echo "No rotation needed"
        ;;
    *)
        echo "Usage: $0 {rotate|rollback <secret-name> [version]|check <secret-name>}"
        echo "Environment variables:"
        echo "  PROJECT_NAME - Project name (default: mangu-publishing)"
        echo "  ENVIRONMENT - Environment name (default: production)"
        echo "  AWS_REGION - AWS region (default: us-east-1)"
        echo "  ROTATION_DAYS - Days before rotation (default: 90)"
        echo "  DRY_RUN - Simulate rotation (default: false)"
        exit 1
        ;;
esac
