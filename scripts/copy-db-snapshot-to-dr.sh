#!/bin/bash
###############################################################################
# MANGU Publishing - Daily RDS Snapshot Copy to DR Region
#
# This script copies the latest automated RDS snapshot to us-west-2 for
# disaster recovery purposes. Run via cron or EventBridge schedule.
###############################################################################

set -euo pipefail

# Configuration
SOURCE_REGION="us-east-1"
DR_REGION="us-west-2"
DB_INSTANCE="mangu-publishing-db-production"
RETENTION_DAYS=7
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    log "ERROR: $*" >&2
    exit 1
}

# Get latest automated snapshot
log "Fetching latest automated snapshot for $DB_INSTANCE..."
LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
    --db-instance-identifier "$DB_INSTANCE" \
    --snapshot-type automated \
    --region "$SOURCE_REGION" \
    --query 'sort_by(DBSnapshots, &SnapshotCreateTime)[-1].DBSnapshotIdentifier' \
    --output text)

if [[ -z "$LATEST_SNAPSHOT" || "$LATEST_SNAPSHOT" == "None" ]]; then
    error "No automated snapshots found for $DB_INSTANCE"
fi

log "Latest snapshot: $LATEST_SNAPSHOT"

# Generate DR snapshot name
DR_SNAPSHOT_ID="${LATEST_SNAPSHOT}-dr-$(date +%Y%m%d)"

# Check if already copied today
EXISTING=$(aws rds describe-db-snapshots \
    --db-snapshot-identifier "$DR_SNAPSHOT_ID" \
    --region "$DR_REGION" \
    --query 'DBSnapshots[0].DBSnapshotIdentifier' \
    --output text 2>/dev/null || echo "")

if [[ "$EXISTING" == "$DR_SNAPSHOT_ID" ]]; then
    log "Snapshot already copied today: $DR_SNAPSHOT_ID"
    exit 0
fi

# Copy snapshot to DR region
log "Copying snapshot to $DR_REGION..."
SOURCE_ARN="arn:aws:rds:${SOURCE_REGION}:${AWS_ACCOUNT_ID}:snapshot:${LATEST_SNAPSHOT}"

aws rds copy-db-snapshot \
    --source-db-snapshot-identifier "$SOURCE_ARN" \
    --target-db-snapshot-identifier "$DR_SNAPSHOT_ID" \
    --region "$DR_REGION" \
    --copy-tags \
    --tags Key=CopiedFrom,Value="$LATEST_SNAPSHOT" \
           Key=CopyDate,Value="$(date +%Y-%m-%d)" \
           Key=Purpose,Value="DisasterRecovery"

log "Snapshot copy initiated: $DR_SNAPSHOT_ID"

# Wait for copy to complete (optional, can be slow)
if [[ "${WAIT_FOR_COMPLETION:-false}" == "true" ]]; then
    log "Waiting for snapshot copy to complete..."
    aws rds wait db-snapshot-completed \
        --db-snapshot-identifier "$DR_SNAPSHOT_ID" \
        --region "$DR_REGION"
    log "✅ Snapshot copy completed"
fi

# Cleanup old DR snapshots (keep only last N days)
log "Cleaning up old DR snapshots (keeping last $RETENTION_DAYS days)..."
CUTOFF_DATE=$(date -u -d "$RETENTION_DAYS days ago" +%Y-%m-%d 2>/dev/null || date -u -v-${RETENTION_DAYS}d +%Y-%m-%d)

OLD_SNAPSHOTS=$(aws rds describe-db-snapshots \
    --region "$DR_REGION" \
    --snapshot-type manual \
    --query "DBSnapshots[?starts_with(DBSnapshotIdentifier, 'rds:${DB_INSTANCE}') && SnapshotCreateTime<'${CUTOFF_DATE}'].DBSnapshotIdentifier" \
    --output text)

if [[ -n "$OLD_SNAPSHOTS" ]]; then
    for SNAPSHOT in $OLD_SNAPSHOTS; do
        log "Deleting old snapshot: $SNAPSHOT"
        aws rds delete-db-snapshot \
            --db-snapshot-identifier "$SNAPSHOT" \
            --region "$DR_REGION" || log "Warning: Failed to delete $SNAPSHOT"
    done
else
    log "No old snapshots to delete"
fi

log "✅ DR snapshot copy complete: $DR_SNAPSHOT_ID"
log "To restore in DR region: aws rds restore-db-instance-from-db-snapshot --db-snapshot-identifier $DR_SNAPSHOT_ID --region $DR_REGION"
