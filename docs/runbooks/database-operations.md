# Database Operations Runbook

## Overview

This runbook covers common database operations for the MANGU Publishing PostgreSQL database.

## Prerequisites

- AWS RDS access
- Database credentials from AWS Secrets Manager
- `psql` client installed
- Backup verification completed

## Daily Operations

### Connecting to Database

```bash
# Get connection string from Secrets Manager
DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id mangu-database-url-production \
  --query SecretString --output text)

# Connect
psql "$DATABASE_URL"

# Or for read-only operations, use replica
psql "$DATABASE_URL_REPLICA"
```

### Health Checks

```bash
# Check connection
psql "$DATABASE_URL" -c "SELECT 1;"

# Check database size
psql "$DATABASE_URL" -c "
  SELECT pg_size_pretty(pg_database_size('mangu_publishing')) as size;"

# Check active connections
psql "$DATABASE_URL" -c "
  SELECT count(*), state 
  FROM pg_stat_activity 
  GROUP BY state;"

# Check slow queries
psql "$DATABASE_URL" -c "
  SELECT pid, now() - query_start AS duration, query, state
  FROM pg_stat_activity
  WHERE state != 'idle'
    AND now() - query_start > interval '1 minute'
  ORDER BY duration DESC;"
```

## Backup Operations

### Manual Backup

```bash
# Create RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier mangu-publishing-db-production \
  --db-snapshot-identifier mangu-manual-$(date +%Y%m%d-%H%M%S)

# Monitor snapshot progress
aws rds describe-db-snapshots \
  --db-snapshot-identifier mangu-manual-$(date +%Y%m%d-%H%M%S) \
  --query 'DBSnapshots[0].[Status,PercentProgress]'

# Export database to S3 (for external backup)
pg_dump "$DATABASE_URL" | gzip > mangu-backup-$(date +%Y%m%d).sql.gz
aws s3 cp mangu-backup-$(date +%Y%m%d).sql.gz s3://mangu-backups-production/
```

### Verify Backups

```bash
# List recent snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBSnapshots[?Status==`available`].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table | head -20

# Test restore (to temporary instance)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mangu-test-restore \
  --db-snapshot-identifier <snapshot-id>
```

### Automated Backups

```bash
# Check backup retention
aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBInstances[0].[BackupRetentionPeriod,PreferredBackupWindow]'

# Modify backup settings
aws rds modify-db-instance \
  --db-instance-identifier mangu-publishing-db-production \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

## Migration Operations

### Pre-Migration Checklist

- [ ] Backup completed and verified
- [ ] Migration tested in staging
- [ ] Rollback plan prepared
- [ ] Maintenance window scheduled
- [ ] Team notified

### Running Migrations

```bash
# Review migration files
ls -la server/src/database/migrations/

# Test migration on staging
psql "$STAGING_DATABASE_URL" -f server/src/database/migrations/003_new_feature.sql

# Backup production before migration
aws rds create-db-snapshot \
  --db-instance-identifier mangu-publishing-db-production \
  --db-snapshot-identifier pre-migration-$(date +%Y%m%d-%H%M%S)

# Apply migration to production
psql "$DATABASE_URL" -f server/src/database/migrations/003_new_feature.sql

# Verify migration
psql "$DATABASE_URL" -c "\dt"
psql "$DATABASE_URL" -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"
```

### Migration Rollback

```bash
# If rollback SQL exists
psql "$DATABASE_URL" -f server/src/database/migrations/003_new_feature_rollback.sql

# Or restore from snapshot (DESTRUCTIVE - loses data since backup)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mangu-publishing-db-production-temp \
  --db-snapshot-identifier pre-migration-<timestamp>

# Point application to temp instance
# Verify functionality
# Swap DNS/connection string
```

## Performance Operations

### Identifying Slow Queries

```bash
# Enable pg_stat_statements extension
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

# Find slowest queries
psql "$DATABASE_URL" -c "
  SELECT 
    round(total_exec_time::numeric, 2) AS total_time,
    calls,
    round(mean_exec_time::numeric, 2) AS mean_time,
    round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) AS percentage,
    query
  FROM pg_stat_statements
  ORDER BY total_exec_time DESC
  LIMIT 10;"

# Find queries with high call count
psql "$DATABASE_URL" -c "
  SELECT calls, round(mean_exec_time::numeric, 2) AS mean_time, query
  FROM pg_stat_statements
  ORDER BY calls DESC
  LIMIT 10;"
```

### Index Management

```bash
# Find missing indexes
psql "$DATABASE_URL" -c "
  SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
  FROM pg_stats
  WHERE schemaname = 'public'
    AND n_distinct > 100
  ORDER BY n_distinct DESC;"

# Check index usage
psql "$DATABASE_URL" -c "
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
    AND indexname NOT LIKE '%_pkey'
  ORDER BY pg_relation_size(indexrelid) DESC;"

# Create index concurrently (non-blocking)
psql "$DATABASE_URL" -c "
  CREATE INDEX CONCURRENTLY idx_books_publication_date 
  ON books(publication_date);"
```

### Vacuum Operations

```bash
# Check table bloat
psql "$DATABASE_URL" -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_dead_tup
  FROM pg_stat_user_tables
  ORDER BY n_dead_tup DESC
  LIMIT 10;"

# Manual vacuum (during maintenance window)
psql "$DATABASE_URL" -c "VACUUM VERBOSE ANALYZE books;"

# Vacuum all tables
psql "$DATABASE_URL" -c "VACUUM ANALYZE;"

# Full vacuum (locks table - use with caution)
psql "$DATABASE_URL" -c "VACUUM FULL books;"
```

### Connection Pool Management

```bash
# Check connection pool usage
psql "$DATABASE_URL" -c "
  SELECT 
    count(*) as connections,
    state,
    usename,
    application_name
  FROM pg_stat_activity
  GROUP BY state, usename, application_name
  ORDER BY connections DESC;"

# Kill idle connections
psql "$DATABASE_URL" -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
    AND state_change < now() - interval '1 hour'
    AND pid <> pg_backend_pid();"

# Check connection limits
psql "$DATABASE_URL" -c "
  SELECT 
    setting::int as max_connections,
    count(*) as current_connections,
    round(100.0 * count(*) / setting::int, 2) as percentage_used
  FROM pg_stat_activity, pg_settings
  WHERE pg_settings.name = 'max_connections'
  GROUP BY setting;"
```

## Data Operations

### Data Export

```bash
# Export entire database
pg_dump "$DATABASE_URL" > mangu-export-$(date +%Y%m%d).sql

# Export specific table
pg_dump "$DATABASE_URL" -t books > books-export-$(date +%Y%m%d).sql

# Export as CSV
psql "$DATABASE_URL" -c "
  COPY books TO STDOUT WITH CSV HEADER" > books.csv

# Upload to S3
aws s3 cp books.csv s3://mangu-exports-production/
```

### Data Import

```bash
# Import from SQL dump
psql "$DATABASE_URL" < backup.sql

# Import CSV
psql "$DATABASE_URL" -c "
  COPY books(id, title, author, price)
  FROM '/path/to/books.csv'
  WITH CSV HEADER;"

# Import from S3
aws s3 cp s3://mangu-imports-production/books.csv .
psql "$DATABASE_URL" -c "\COPY books FROM 'books.csv' WITH CSV HEADER;"
```

### Data Cleanup

```bash
# Find and remove orphaned records
psql "$DATABASE_URL" -c "
  DELETE FROM book_authors
  WHERE book_id NOT IN (SELECT id FROM books);"

# Archive old data
psql "$DATABASE_URL" -c "
  CREATE TABLE orders_archive AS
  SELECT * FROM orders
  WHERE created_at < now() - interval '2 years';"

psql "$DATABASE_URL" -c "
  DELETE FROM orders
  WHERE created_at < now() - interval '2 years';"

# Clean up test data
psql "$DATABASE_URL" -c "
  DELETE FROM users WHERE email LIKE '%@test.com';"
```

## Monitoring

### Key Metrics

```bash
# Database size growth
psql "$DATABASE_URL" -c "
  SELECT 
    pg_size_pretty(pg_database_size(current_database())) as current_size;"

# Table sizes
psql "$DATABASE_URL" -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 20;"

# Cache hit ratio
psql "$DATABASE_URL" -c "
  SELECT 
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    round(100.0 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)), 2) AS cache_hit_ratio
  FROM pg_statio_user_tables;"
```

### CloudWatch RDS Metrics

```bash
# CPU Utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=mangu-publishing-db-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# Database connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=mangu-publishing-db-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum
```

## Emergency Procedures

### Database Unresponsive

```bash
# Check RDS instance status
aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBInstances[0].DBInstanceStatus'

# Reboot database (last resort)
aws rds reboot-db-instance \
  --db-instance-identifier mangu-publishing-db-production

# Failover to standby (Multi-AZ only)
aws rds failover-db-cluster \
  --db-cluster-identifier mangu-publishing-db-cluster-production
```

### Disk Space Full

```bash
# Check available storage
aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-production \
  --query 'DBInstances[0].[AllocatedStorage,StorageType]'

# Increase storage (no downtime)
aws rds modify-db-instance \
  --db-instance-identifier mangu-publishing-db-production \
  --allocated-storage 200 \
  --apply-immediately
```

## Related Documentation

- [Deployment Runbook](./deployment.md)
- [Incident Response](./incident-response.md)
- [Database Migrations](../../server/src/database/migrations/README.md)
