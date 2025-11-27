# Database Backup System Documentation

## Overview

The MANGU Publishing automated backup system provides enterprise-grade database backup capabilities with comprehensive monitoring, verification, and disaster recovery features.

## Features

### ✅ Automated Daily Backups
- Scheduled RDS snapshots with configurable retention
- Support for manual on-demand backups
- Multi-AZ snapshot replication

### ✅ 30-Day Retention Policy
- Automatic cleanup of expired snapshots
- Configurable retention periods
- Compliance-ready retention reporting

### ✅ Point-in-Time Recovery (PITR)
- Automated backups enable PITR within retention window
- Recovery to any point within last 30 days
- Transaction log backup (via RDS automated backups)

### ✅ Backup Verification
- Automated integrity checks post-backup
- Encryption validation (AES-256)
- Size and status verification

### ✅ Cross-Region Replication
- Automatic snapshot copy to disaster recovery region
- Independent retention in backup region
- Encrypted transfer between regions

### ✅ Comprehensive Alerting
- SNS notifications for backup success/failure
- Detailed backup statistics and logs
- CloudWatch metrics integration

## Quick Start

### Prerequisites

```bash
# Ensure AWS CLI is installed and configured
aws --version

# Verify AWS credentials
aws sts get-caller-identity

# Set required environment variables
export AWS_REGION="us-east-1"
export BACKUP_REGION="us-west-2"
export PROJECT_NAME="mangu-publishing"
export ENVIRONMENT="production"
```

### Run Manual Backup

```bash
# Execute backup script
./scripts/backup-database.sh

# Check backup logs
tail -f logs/backups/backup-*.log
```

### Schedule Automated Backups

#### Using Cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * /path/to/mangu2-publishing/scripts/backup-database.sh >> /path/to/logs/cron-backup.log 2>&1
```

#### Using AWS EventBridge (Recommended for Production)

```bash
# Create EventBridge rule via AWS Console or CLI
aws events put-rule \
  --name mangu-daily-db-backup \
  --schedule-expression "cron(0 3 * * ? *)" \
  --state ENABLED

# Configure target (Lambda function that runs the backup script)
```

## Configuration

### Environment Variables

```bash
# AWS Configuration
AWS_REGION="us-east-1"                    # Primary region
BACKUP_REGION="us-west-2"                 # Disaster recovery region
PROJECT_NAME="mangu-publishing"           # Project name
ENVIRONMENT="production"                  # Environment (production/staging/dev)

# Backup Configuration
BACKUP_RETENTION_DAYS="30"                # Days to retain backups
CROSS_REGION_BACKUP="true"                # Enable cross-region copies
VERIFY_BACKUPS="true"                     # Enable verification checks

# Alerting
BACKUP_ALERT_SNS_TOPIC_ARN="arn:aws:sns:..." # SNS topic for alerts
```

### Terraform Configuration

The RDS instance is configured with automated backups in `infrastructure/terraform/rds.tf`:

```hcl
resource "aws_db_instance" "main" {
  # ... other settings ...
  
  backup_retention_period = 30              # PITR window
  backup_window          = "03:00-04:00"   # UTC backup window
  maintenance_window     = "sun:04:00-sun:05:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled = true
}
```

## Backup Types

### 1. Automated Backups (RDS Native)
- **Frequency**: Daily during backup window
- **Retention**: Configured via `backup_retention_period`
- **PITR**: Enabled automatically
- **Storage**: Stored in S3 by AWS (managed)
- **Cost**: Included with RDS instance

### 2. Manual Snapshots (via Script)
- **Frequency**: On-demand or scheduled via cron/EventBridge
- **Retention**: Managed by cleanup script
- **Recovery**: Full snapshot restore
- **Storage**: S3 (AWS managed)
- **Cost**: Pay for snapshot storage

### 3. Cross-Region Snapshots
- **Frequency**: After each manual snapshot
- **Retention**: Independent from primary region
- **Purpose**: Disaster recovery
- **Storage**: S3 in backup region
- **Cost**: Additional storage + data transfer

## Recovery Procedures

### Point-in-Time Recovery (PITR)

```bash
# Restore to specific timestamp
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier mangu-publishing-db-production \
  --target-db-instance-identifier mangu-publishing-db-restored \
  --restore-time "2025-01-15T10:30:00Z"
```

### Snapshot Restore

```bash
# List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier mangu-publishing-db-production \
  --snapshot-type manual

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mangu-publishing-db-restored \
  --db-snapshot-identifier mangu-publishing-db-production-20250115-103000
```

### Cross-Region Disaster Recovery

```bash
# Restore from backup region
aws rds restore-db-instance-from-db-snapshot \
  --region us-west-2 \
  --db-instance-identifier mangu-publishing-db-dr \
  --db-snapshot-identifier mangu-publishing-db-production-20250115-103000-backup
```

## Verification and Testing

### Test Backup Integrity

```bash
# Verify latest snapshot
SNAPSHOT_ID=$(aws rds describe-db-snapshots \
  --query 'DBSnapshots[0].DBSnapshotIdentifier' \
  --output text)

aws rds describe-db-snapshots \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --query 'DBSnapshots[0].[Status,Encrypted,AllocatedStorage]' \
  --output table
```

### Test Recovery Process

```bash
# Create test restore (use separate instance to avoid conflicts)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mangu-db-test-restore \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --db-instance-class db.t3.micro

# Verify data integrity
psql -h <test-endpoint> -U mangu_user -d mangu_publishing -c "SELECT COUNT(*) FROM books;"

# Clean up test instance
aws rds delete-db-instance \
  --db-instance-identifier mangu-db-test-restore \
  --skip-final-snapshot
```

## Monitoring and Alerting

### CloudWatch Metrics

```bash
# View backup metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name BackupRetentionPeriodStorageUsed \
  --dimensions Name=DBInstanceIdentifier,Value=mangu-publishing-db-production \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Average
```

### SNS Alert Configuration

```bash
# Create SNS topic for backup alerts
aws sns create-topic --name mangu-backup-alerts

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:mangu-backup-alerts \
  --protocol email \
  --notification-endpoint ops@example.com
```

## Cost Optimization

### Backup Storage Costs

- **Automated backups**: Free up to 100% of allocated DB storage
- **Manual snapshots**: $0.095 per GB-month (us-east-1)
- **Cross-region transfer**: $0.02 per GB transferred
- **Cross-region storage**: Standard snapshot pricing in target region

### Optimization Strategies

1. **Adjust retention period** based on compliance requirements
2. **Use lifecycle policies** to transition old snapshots to cheaper storage
3. **Monitor snapshot growth** and clean up unnecessary backups
4. **Compress data** before backup if possible
5. **Use incremental backups** (automatic with RDS)

## Troubleshooting

### Backup Fails to Start

```bash
# Check RDS instance status
aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBInstances[0].DBInstanceStatus'

# Check for in-progress snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBSnapshots[?Status==`creating`]'
```

### Snapshot Stuck in Creating State

```bash
# Check CloudWatch logs
aws logs tail /aws/rds/instance/mangu-publishing-db-production/postgresql --follow

# If stuck for >2 hours, contact AWS Support
```

### Cross-Region Copy Fails

```bash
# Verify KMS key permissions in target region
# Check VPC endpoint connectivity
# Verify IAM permissions for cross-region operations
```

### Insufficient Storage for Backup

```bash
# Increase RDS allocated storage
aws rds modify-db-instance \
  --db-instance-identifier mangu-publishing-db-production \
  --allocated-storage 100 \
  --apply-immediately
```

## Best Practices

### ✅ DO
- Test restore procedures regularly (monthly)
- Monitor backup success/failure alerts
- Document recovery time objectives (RTO)
- Keep backup scripts in version control
- Use encryption for all backups
- Maintain cross-region backups for DR
- Automate backup verification
- Track backup costs

### ❌ DON'T
- Rely solely on automated backups (create manual snapshots too)
- Skip testing recovery procedures
- Ignore backup failure alerts
- Store backups in single region only
- Delete snapshots without verification
- Exceed 100 manual snapshots per region
- Mix production and test backups
- Forget to tag snapshots appropriately

## Compliance and Auditing

### Audit Trail

```bash
# List all backup events
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=CreateDBSnapshot \
  --max-items 50

# Export backup inventory
aws rds describe-db-snapshots \
  --query 'DBSnapshots[].[DBSnapshotIdentifier,SnapshotCreateTime,Encrypted,AllocatedStorage]' \
  --output table > backup-inventory-$(date +%Y%m%d).txt
```

### Retention Compliance

The system automatically enforces the 30-day retention policy. For compliance requirements:

1. Document retention policy in security documentation
2. Generate monthly backup reports
3. Maintain audit logs of all backup operations
4. Verify encryption compliance (FIPS 140-2)

## Support and Maintenance

### Regular Maintenance Tasks

- **Weekly**: Review backup logs for failures
- **Monthly**: Test restore procedure
- **Quarterly**: Review and optimize retention policies
- **Annually**: Disaster recovery drill

### Getting Help

For issues with the backup system:

1. Check logs in `logs/backups/`
2. Review CloudWatch metrics and alarms
3. Verify AWS service health dashboard
4. Contact AWS Support for RDS-specific issues

## References

- [AWS RDS Backup Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.BackupRestore.html)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [AWS RDS PITR](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html)
