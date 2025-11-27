# Backup and Restore Runbook

## Overview
This runbook covers backup and restore procedures for MANGU Publishing production data, including PostgreSQL databases and S3 object storage.

## Table of Contents
- [Automated Backups](#automated-backups)
- [Manual Backups](#manual-backups)
- [Restore Procedures](#restore-procedures)
- [Backup Verification](#backup-verification)
- [Cross-Region Disaster Recovery](#cross-region-disaster-recovery)

---

## Automated Backups

### RDS PostgreSQL Automated Backups
Production RDS instance is configured with:
- **Retention Period**: 7 days
- **Backup Window**: 03:00-04:00 UTC
- **Point-in-Time Recovery (PITR)**: Enabled
- **Multi-AZ**: Enabled for automatic failover

```bash
# View current backup configuration
aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBInstances[0].{Backup:BackupRetentionPeriod,Window:PreferredBackupWindow,MultiAZ:MultiAZ}' \
  --output table

# List automated backups
aws rds describe-db-snapshots \
  --db-instance-identifier mangu-publishing-db-production \
  --snapshot-type automated \
  --query 'DBSnapshots[*].{Snapshot:DBSnapshotIdentifier,Created:SnapshotCreateTime,Status:Status}' \
  --output table
```

### S3 Versioning
Both uploads and static assets buckets have versioning enabled:
```bash
# Check versioning status
aws s3api get-bucket-versioning --bucket mangu-publishing-uploads-production
aws s3api get-bucket-versioning --bucket mangu-publishing-static-production
```

---

## Manual Backups

### On-Demand Database Snapshot
Create a manual snapshot before major deployments or migrations:

```bash
# Create snapshot with timestamp
SNAPSHOT_ID="mangu-production-manual-$(date +%Y%m%d-%H%M%S)"

aws rds create-db-snapshot \
  --db-instance-identifier mangu-publishing-db-production \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --tags Key=Type,Value=Manual Key=CreatedBy,Value="$USER"

# Wait for snapshot completion (takes 5-15 minutes)
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier "$SNAPSHOT_ID"

echo "✅ Snapshot created: $SNAPSHOT_ID"
```

### Export Database to Local File
For schema migrations or local development:

```bash
# Get DB credentials from Secrets Manager
DB_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id mangu-publishing-db-credentials-production \
  --query SecretString --output text)

DB_HOST=$(echo $DB_SECRET | jq -r .host)
DB_USER=$(echo $DB_SECRET | jq -r .username)
DB_PASS=$(echo $DB_SECRET | jq -r .password)
DB_NAME=$(echo $DB_SECRET | jq -r .dbname)

# Export full database
PGPASSWORD="$DB_PASS" pg_dump \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F c \
  -f "mangu-backup-$(date +%Y%m%d).dump"

# Export schema only
PGPASSWORD="$DB_PASS" pg_dump \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --schema-only \
  -f "mangu-schema-$(date +%Y%m%d).sql"
```

### S3 Backup to Another Bucket
```bash
# Sync uploads bucket to backup bucket
aws s3 sync \
  s3://mangu-publishing-uploads-production \
  s3://mangu-publishing-backups/uploads/$(date +%Y-%m-%d) \
  --storage-class GLACIER

# Sync static assets
aws s3 sync \
  s3://mangu-publishing-static-production \
  s3://mangu-publishing-backups/static/$(date +%Y-%m-%d) \
  --storage-class GLACIER
```

---

## Restore Procedures

### Restore from RDS Snapshot

#### Option A: Point-in-Time Recovery
Restore to any point within the 7-day retention window:

```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier mangu-publishing-db-production \
  --target-db-instance-identifier mangu-publishing-db-restored \
  --restore-time "2025-11-10T14:30:00Z" \
  --db-subnet-group-name mangu-publishing-db-subnet-production \
  --vpc-security-group-ids sg-xxxxx \
  --multi-az

# Wait for restore (15-30 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier mangu-publishing-db-restored
```

#### Option B: Restore from Manual Snapshot
```bash
# List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBSnapshots[*].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime}' \
  --output table

# Restore from specific snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mangu-publishing-db-restored \
  --db-snapshot-identifier mangu-production-manual-20251110-143000 \
  --db-subnet-group-name mangu-publishing-db-subnet-production \
  --vpc-security-group-ids sg-xxxxx \
  --multi-az

# Update connection string after restore
NEW_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-restored \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "New database endpoint: $NEW_ENDPOINT"
```

### Restore Database from Local Dump
```bash
# Restore full database
PGPASSWORD="$DB_PASS" pg_restore \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -c \
  --if-exists \
  mangu-backup-20251110.dump

# Restore specific table
PGPASSWORD="$DB_PASS" pg_restore \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -t books \
  mangu-backup-20251110.dump
```

### Restore S3 Objects
```bash
# Restore specific file from versioned bucket
aws s3api list-object-versions \
  --bucket mangu-publishing-uploads-production \
  --prefix uploads/covers/book-123.jpg

# Restore specific version
aws s3api get-object \
  --bucket mangu-publishing-uploads-production \
  --key uploads/covers/book-123.jpg \
  --version-id <VERSION_ID> \
  book-123.jpg

# Restore entire directory from backup
aws s3 sync \
  s3://mangu-publishing-backups/uploads/2025-11-10 \
  s3://mangu-publishing-uploads-production
```

---

## Backup Verification

### Test Restore Process (Monthly)
```bash
#!/bin/bash
# Monthly backup verification script

RESTORE_DB="mangu-publishing-db-test-restore"
SNAPSHOT_ID=$(aws rds describe-db-snapshots \
  --db-instance-identifier mangu-publishing-db-production \
  --snapshot-type automated \
  --query 'DBSnapshots[0].DBSnapshotIdentifier' \
  --output text)

echo "Testing restore from: $SNAPSHOT_ID"

# Restore to test instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "$RESTORE_DB" \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --db-subnet-group-name mangu-publishing-db-subnet-production \
  --vpc-security-group-ids sg-xxxxx \
  --publicly-accessible false

# Wait for availability
aws rds wait db-instance-available --db-instance-identifier "$RESTORE_DB"

# Run verification query
TEST_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$RESTORE_DB" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

PGPASSWORD="$DB_PASS" psql -h "$TEST_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -c \
  "SELECT COUNT(*) FROM books; SELECT COUNT(*) FROM authors;"

# Cleanup
echo "Deleting test restore instance..."
aws rds delete-db-instance \
  --db-instance-identifier "$RESTORE_DB" \
  --skip-final-snapshot

echo "✅ Backup verification complete"
```

### Verify S3 Object Integrity
```bash
# List objects with metadata
aws s3api list-objects-v2 \
  --bucket mangu-publishing-uploads-production \
  --query 'Contents[*].{Key:Key,Size:Size,Modified:LastModified,ETag:ETag}' \
  --output table

# Check for objects without versions
aws s3api list-object-versions \
  --bucket mangu-publishing-uploads-production \
  --query 'Versions[?IsLatest==`true`].Key' \
  --output text
```

---

## Cross-Region Disaster Recovery

### Copy Snapshots to Another Region
Automated daily snapshot copy (configured via script):

```bash
# Copy latest snapshot to DR region
LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
  --db-instance-identifier mangu-publishing-db-production \
  --snapshot-type automated \
  --query 'DBSnapshots[0].DBSnapshotIdentifier' \
  --output text \
  --region us-east-1)

aws rds copy-db-snapshot \
  --source-db-snapshot-identifier "arn:aws:rds:us-east-1:ACCOUNT_ID:snapshot:$LATEST_SNAPSHOT" \
  --target-db-snapshot-identifier "${LATEST_SNAPSHOT}-dr" \
  --region us-west-2 \
  --copy-tags

echo "✅ Snapshot copied to us-west-2: ${LATEST_SNAPSHOT}-dr"
```

### S3 Cross-Region Replication
Configure replication rule (via Terraform or console):

```hcl
resource "aws_s3_bucket_replication_configuration" "uploads_dr" {
  bucket = aws_s3_bucket.uploads.id
  role   = aws_iam_role.replication.arn

  rule {
    id     = "replicate-to-dr"
    status = "Enabled"

    destination {
      bucket        = "arn:aws:s3:::mangu-publishing-uploads-dr"
      storage_class = "STANDARD_IA"
    }
  }
}
```

---

## Emergency Contacts
- **Database Team**: db-team@mangu.com
- **DevOps On-Call**: Refer to PagerDuty rotation
- **AWS Support**: Premium support case via console

## Related Runbooks
- [Incident Response](./incident-response.md)
- [Database Operations](./database-operations.md)
- [Rollback Procedures](./rollback.md)

---

**Last Updated**: 2025-11-11  
**Owner**: DevOps Team
