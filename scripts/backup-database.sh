#!/bin/bash

# ================================================================
# MANGU Publishing - Automated Database Backup System
# ================================================================
# Creates automated RDS snapshots with retention, verification,
# cross-region replication, and comprehensive alerting.
# ================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/../logs/backups"
mkdir -p "$LOG_DIR"

LOG_FILE="${LOG_DIR}/backup-$(date +%Y%m%d-%H%M%S).log"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Source environment configuration
if [ -f "${SCRIPT_DIR}/../.env" ]; then
    source "${SCRIPT_DIR}/../.env"
fi

# AWS Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
BACKUP_REGION="${BACKUP_REGION:-us-west-2}"  # Cross-region backup
PROJECT_NAME="${PROJECT_NAME:-mangu-publishing}"
ENVIRONMENT="${ENVIRONMENT:-production}"
DB_INSTANCE_ID="${PROJECT_NAME}-db-${ENVIRONMENT}"

# Backup Configuration
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
CROSS_REGION_ENABLED="${CROSS_REGION_BACKUP:-true}"
VERIFY_BACKUPS="${VERIFY_BACKUPS:-true}"
SNS_TOPIC_ARN="${BACKUP_ALERT_SNS_TOPIC_ARN:-}"

# Logging functions
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$LOG_FILE" >&2
}

log_success() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✓ $*" | tee -a "$LOG_FILE"
}

# Send SNS notification
send_alert() {
    local subject="$1"
    local message="$2"
    
    if [ -n "$SNS_TOPIC_ARN" ]; then
        aws sns publish \
            --region "$AWS_REGION" \
            --topic-arn "$SNS_TOPIC_ARN" \
            --subject "$subject" \
            --message "$message" \
            2>&1 | tee -a "$LOG_FILE"
    fi
}

# Check AWS CLI availability
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured properly."
        exit 1
    fi
    
    log_success "Prerequisites checked"
}

# Create RDS snapshot
create_snapshot() {
    local snapshot_id="${DB_INSTANCE_ID}-${TIMESTAMP}"
    
    log "Creating RDS snapshot: $snapshot_id"
    
    if aws rds create-db-snapshot \
        --region "$AWS_REGION" \
        --db-instance-identifier "$DB_INSTANCE_ID" \
        --db-snapshot-identifier "$snapshot_id" \
        --tags "Key=Environment,Value=${ENVIRONMENT}" \
               "Key=BackupType,Value=Automated" \
               "Key=Timestamp,Value=${TIMESTAMP}" \
        2>&1 | tee -a "$LOG_FILE"; then
        
        log_success "Snapshot creation initiated: $snapshot_id"
        echo "$snapshot_id"
        return 0
    else
        log_error "Failed to create snapshot"
        return 1
    fi
}

# Wait for snapshot to complete
wait_for_snapshot() {
    local snapshot_id="$1"
    local max_wait=3600  # 1 hour
    local waited=0
    local interval=30
    
    log "Waiting for snapshot to complete: $snapshot_id"
    
    while [ $waited -lt $max_wait ]; do
        local status=$(aws rds describe-db-snapshots \
            --region "$AWS_REGION" \
            --db-snapshot-identifier "$snapshot_id" \
            --query 'DBSnapshots[0].Status' \
            --output text 2>/dev/null || echo "unknown")
        
        case "$status" in
            "available")
                log_success "Snapshot completed successfully"
                return 0
                ;;
            "creating")
                log "Snapshot status: $status (waited ${waited}s)"
                sleep $interval
                waited=$((waited + interval))
                ;;
            "failed"|"unknown")
                log_error "Snapshot failed with status: $status"
                return 1
                ;;
            *)
                log "Snapshot status: $status"
                sleep $interval
                waited=$((waited + interval))
                ;;
        esac
    done
    
    log_error "Snapshot timed out after ${max_wait}s"
    return 1
}

# Verify snapshot integrity
verify_snapshot() {
    local snapshot_id="$1"
    
    if [ "$VERIFY_BACKUPS" != "true" ]; then
        log "Backup verification disabled"
        return 0
    fi
    
    log "Verifying snapshot: $snapshot_id"
    
    # Get snapshot details
    local snapshot_info=$(aws rds describe-db-snapshots \
        --region "$AWS_REGION" \
        --db-snapshot-identifier "$snapshot_id" \
        --output json 2>&1)
    
    if [ $? -ne 0 ]; then
        log_error "Failed to retrieve snapshot information"
        return 1
    fi
    
    # Verify snapshot exists and is available
    local status=$(echo "$snapshot_info" | jq -r '.DBSnapshots[0].Status')
    local encrypted=$(echo "$snapshot_info" | jq -r '.DBSnapshots[0].Encrypted')
    local size=$(echo "$snapshot_info" | jq -r '.DBSnapshots[0].AllocatedStorage')
    
    log "Snapshot status: $status"
    log "Encryption: $encrypted"
    log "Size: ${size}GB"
    
    if [ "$status" = "available" ] && [ "$encrypted" = "true" ]; then
        log_success "Snapshot verification passed"
        return 0
    else
        log_error "Snapshot verification failed"
        return 1
    fi
}

# Copy snapshot to backup region
copy_to_backup_region() {
    local snapshot_id="$1"
    local backup_snapshot_id="${snapshot_id}-backup"
    
    if [ "$CROSS_REGION_ENABLED" != "true" ]; then
        log "Cross-region backup disabled"
        return 0
    fi
    
    log "Copying snapshot to backup region: $BACKUP_REGION"
    
    if aws rds copy-db-snapshot \
        --region "$BACKUP_REGION" \
        --source-db-snapshot-identifier "arn:aws:rds:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):snapshot:${snapshot_id}" \
        --target-db-snapshot-identifier "$backup_snapshot_id" \
        --copy-tags \
        --kms-key-id "alias/aws/rds" \
        2>&1 | tee -a "$LOG_FILE"; then
        
        log_success "Cross-region copy initiated: $backup_snapshot_id"
        return 0
    else
        log_error "Failed to copy snapshot to backup region"
        return 1
    fi
}

# Clean up old snapshots
cleanup_old_snapshots() {
    log "Cleaning up snapshots older than ${BACKUP_RETENTION_DAYS} days"
    
    local cutoff_date=$(date -u -d "${BACKUP_RETENTION_DAYS} days ago" +%Y-%m-%d 2>/dev/null || date -u -v-${BACKUP_RETENTION_DAYS}d +%Y-%m-%d)
    
    # List all automated snapshots
    local snapshots=$(aws rds describe-db-snapshots \
        --region "$AWS_REGION" \
        --snapshot-type manual \
        --query "DBSnapshots[?starts_with(DBSnapshotIdentifier, '${DB_INSTANCE_ID}')].[DBSnapshotIdentifier,SnapshotCreateTime]" \
        --output text)
    
    local deleted_count=0
    
    while IFS=$'\t' read -r snapshot_id create_time; do
        if [ -z "$snapshot_id" ]; then
            continue
        fi
        
        local snapshot_date=$(echo "$create_time" | cut -d'T' -f1)
        
        if [[ "$snapshot_date" < "$cutoff_date" ]]; then
            log "Deleting old snapshot: $snapshot_id (created: $snapshot_date)"
            
            if aws rds delete-db-snapshot \
                --region "$AWS_REGION" \
                --db-snapshot-identifier "$snapshot_id" \
                2>&1 | tee -a "$LOG_FILE"; then
                
                deleted_count=$((deleted_count + 1))
            else
                log_error "Failed to delete snapshot: $snapshot_id"
            fi
        fi
    done <<< "$snapshots"
    
    log_success "Deleted $deleted_count old snapshot(s)"
}

# Get backup statistics
get_backup_stats() {
    log "Generating backup statistics..."
    
    local snapshot_count=$(aws rds describe-db-snapshots \
        --region "$AWS_REGION" \
        --snapshot-type manual \
        --query "length(DBSnapshots[?starts_with(DBSnapshotIdentifier, '${DB_INSTANCE_ID}')])" \
        --output text)
    
    local total_size=$(aws rds describe-db-snapshots \
        --region "$AWS_REGION" \
        --snapshot-type manual \
        --query "sum(DBSnapshots[?starts_with(DBSnapshotIdentifier, '${DB_INSTANCE_ID}')].AllocatedStorage)" \
        --output text)
    
    log "Total snapshots: $snapshot_count"
    log "Total storage: ${total_size}GB"
    
    cat >> "$LOG_FILE" << EOF

=== Backup Statistics ===
Total Snapshots: $snapshot_count
Total Storage: ${total_size}GB
Retention Period: ${BACKUP_RETENTION_DAYS} days
Cross-Region Enabled: $CROSS_REGION_ENABLED
Backup Region: $BACKUP_REGION
========================

EOF
}

# Main execution
main() {
    log "=========================================="
    log "MANGU Publishing - Database Backup"
    log "=========================================="
    log "Database Instance: $DB_INSTANCE_ID"
    log "Environment: $ENVIRONMENT"
    log "Region: $AWS_REGION"
    log "Timestamp: $TIMESTAMP"
    log "=========================================="
    
    local exit_code=0
    local snapshot_id=""
    
    # Check prerequisites
    if ! check_prerequisites; then
        exit_code=1
    fi
    
    # Create snapshot
    if [ $exit_code -eq 0 ]; then
        if snapshot_id=$(create_snapshot); then
            log_success "Snapshot created: $snapshot_id"
        else
            log_error "Snapshot creation failed"
            exit_code=1
        fi
    fi
    
    # Wait for snapshot
    if [ $exit_code -eq 0 ] && [ -n "$snapshot_id" ]; then
        if wait_for_snapshot "$snapshot_id"; then
            log_success "Snapshot available"
        else
            log_error "Snapshot did not complete"
            exit_code=1
        fi
    fi
    
    # Verify snapshot
    if [ $exit_code -eq 0 ] && [ -n "$snapshot_id" ]; then
        if verify_snapshot "$snapshot_id"; then
            log_success "Snapshot verified"
        else
            log_error "Snapshot verification failed"
            exit_code=1
        fi
    fi
    
    # Cross-region copy
    if [ $exit_code -eq 0 ] && [ -n "$snapshot_id" ]; then
        if copy_to_backup_region "$snapshot_id"; then
            log_success "Cross-region backup initiated"
        else
            log_error "Cross-region backup failed (non-critical)"
            # Don't fail the entire backup for this
        fi
    fi
    
    # Cleanup old snapshots
    if cleanup_old_snapshots; then
        log_success "Cleanup completed"
    else
        log_error "Cleanup had issues (non-critical)"
    fi
    
    # Generate statistics
    get_backup_stats
    
    # Send notification
    if [ $exit_code -eq 0 ]; then
        log_success "=========================================="
        log_success "Backup completed successfully"
        log_success "=========================================="
        
        send_alert \
            "✓ Database Backup Successful - ${ENVIRONMENT}" \
            "Database backup completed successfully.

Instance: $DB_INSTANCE_ID
Snapshot: $snapshot_id
Timestamp: $TIMESTAMP
Environment: $ENVIRONMENT
Log: $LOG_FILE

All verification checks passed."
    else
        log_error "=========================================="
        log_error "Backup failed"
        log_error "=========================================="
        
        send_alert \
            "✗ Database Backup Failed - ${ENVIRONMENT}" \
            "Database backup encountered errors.

Instance: $DB_INSTANCE_ID
Timestamp: $TIMESTAMP
Environment: $ENVIRONMENT
Log: $LOG_FILE

Please review the logs immediately."
    fi
    
    exit $exit_code
}

# Run main function
main "$@"
