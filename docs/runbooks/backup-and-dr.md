# Backup & Disaster Recovery Runbook

**MANGU Publishing - Production Infrastructure**

## Overview

This runbook details backup procedures, disaster recovery processes, and restoration steps for MANGU Publishing infrastructure.

### Quick Reference

| Metric | Target | Actual |
|--------|--------|--------|
| **RTO** (Recovery Time Objective) | 4 hours | Validated quarterly |
| **RPO** (Recovery Point Objective) | 24 hours | 15-minute RDS snapshots |
| **Primary Region** | us-west-2 | Oregon |
| **DR Region** | us-east-1 | Virginia |

## RACI Matrix

| Task | Responsible | Accountable | Consulted | Informed |
|------|------------|-------------|-----------|----------|
| Daily automated backups | AWS Backup | DevOps Lead | - | Team |
| Cross-region replication | AWS | Platform Engineer | - | DevOps Lead |
| Disaster declaration | DevOps Lead | CTO | Stakeholders | All Teams |
| DR failover execution | Platform Engineer | DevOps Lead | Database Admin | All Teams |
| DR testing | Platform Engineer | DevOps Lead | QA Lead | - |
| Backup restoration | Database Admin | DevOps Lead | - | Team |

---

## 1. Automated Backup Schedule

### 1.1 Database Backups (RDS PostgreSQL)

**Automated Process:**
- **Frequency**: Daily snapshots at 03:00 UTC
- **Retention**: 7 daily, 4 weekly, 12 monthly
- **Storage**: Same region + cross-region copy to us-east-1
- **Encryption**: AES-256 encryption at rest

**Manual Snapshot Creation:**
```bash
# Create manual snapshot before major changes
aws rds create-db-snapshot \
  --db-instance-identifier mangu-publishing-db-production \
  --db-snapshot-identifier mangu-manual-$(date +%Y%m%d-%H%M%S) \
  --region us-west-2

# Verify snapshot
aws rds describe-db-snapshots \
  --db-snapshot-identifier mangu-manual-$(date +%Y%m%d-%H%M%S) \
  --region us-west-2 \
  --query 'DBSnapshots[0].{Status:Status,Progress:PercentProgress,Time:SnapshotCreateTime}'
```

**Cross-Region Snapshot Copy:**
```bash
# Copy snapshot to DR region
SNAPSHOT_ID="mangu-manual-20240101-120000"

aws rds copy-db-snapshot \
  --source-db-snapshot-identifier "arn:aws:rds:us-west-2:ACCOUNT_ID:snapshot:${SNAPSHOT_ID}" \
  --target-db-snapshot-identifier "${SNAPSHOT_ID}-dr" \
  --region us-east-1 \
  --kms-key-id "alias/mangu-rds-dr" \
  --copy-tags
```

### 1.2 Static Assets (S3)

**Configuration:**
- **Versioning**: Enabled on all production buckets
- **Replication**: Cross-region replication to us-east-1
- **Lifecycle**: 90-day retention for non-current versions
- **Storage Class**: Standard → Intelligent-Tiering after 30 days

**Verify Replication Status:**
```bash
# Check replication configuration
aws s3api get-bucket-replication \
  --bucket mangu-publishing-assets-production \
  --region us-west-2

# Verify replica bucket
aws s3 ls s3://mangu-publishing-assets-dr-production/ \
  --region us-east-1 \
  --summarize
```

### 1.3 Redis Cache

**Strategy:** No persistent backups (cache layer, acceptable data loss)
- **RDB Snapshots**: Disabled for performance
- **Recovery**: Cache repopulates from database on cold start
- **Warm-up Script**: `scripts/cache-warmup.sh` (runs post-deployment)

### 1.4 Application Configuration

**Secrets Manager:**
```bash
# Backup all secrets to encrypted JSON
aws secretsmanager list-secrets \
  --region us-west-2 \
  --query 'SecretList[?starts_with(Name, `/mangu/production`)].Name' \
  --output text | while read secret; do
    echo "Backing up: $secret"
    aws secretsmanager get-secret-value \
      --secret-id "$secret" \
      --region us-west-2 \
      --query '{Name:Name,Value:SecretString}' > "backup-$(basename $secret).json.enc"
done
```

**ECS Task Definitions:**
```bash
# Export current task definitions
for service in server client; do
  aws ecs describe-task-definition \
    --task-definition mangu-${service}-production \
    --region us-west-2 \
    --query 'taskDefinition' > "taskdef-${service}-$(date +%Y%m%d).json"
done
```

---

## 2. Disaster Recovery Procedures

### 2.1 DR Activation Decision Tree

**Trigger Scenarios:**
1. **Region-wide AWS outage** (>2 hours ETA)
2. **Database corruption** requiring restore
3. **Security incident** requiring infrastructure isolation
4. **Natural disaster** affecting primary region

**Decision Authority:** CTO or designated DevOps Lead

### 2.2 DR Failover Process

#### Phase 1: Assessment (15 minutes)

```bash
# Run automated health assessment
./scripts/dr-assessment.sh

# Check AWS Health Dashboard
aws health describe-events \
  --filter eventTypeCategories=issue \
  --region us-west-2
```

#### Phase 2: Data Validation (30 minutes)

```bash
# Verify latest DR snapshot
LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
  --region us-east-1 \
  --query 'DBSnapshots[?starts_with(DBSnapshotIdentifier, `mangu`)] | sort_by(@, &SnapshotCreateTime) | [-1].DBSnapshotIdentifier' \
  --output text)

echo "Latest DR snapshot: $LATEST_SNAPSHOT"

# Check snapshot age (should be <24 hours)
aws rds describe-db-snapshots \
  --db-snapshot-identifier "$LATEST_SNAPSHOT" \
  --region us-east-1 \
  --query 'DBSnapshots[0].SnapshotCreateTime'
```

#### Phase 3: Database Restoration (60-90 minutes)

```bash
# Restore RDS from snapshot in DR region
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mangu-publishing-db-dr-production \
  --db-snapshot-identifier "$LATEST_SNAPSHOT" \
  --db-subnet-group-name mangu-db-subnet-group-dr \
  --vpc-security-group-ids sg-DR_SECURITY_GROUP \
  --publicly-accessible false \
  --multi-az true \
  --db-instance-class db.r6g.xlarge \
  --region us-east-1

# Wait for availability
aws rds wait db-instance-available \
  --db-instance-identifier mangu-publishing-db-dr-production \
  --region us-east-1

# Get new endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier mangu-publishing-db-dr-production \
  --region us-east-1 \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "New DB endpoint: $DB_ENDPOINT"
```

#### Phase 4: Application Deployment (45 minutes)

```bash
# Update Secrets Manager with DR database endpoint
aws secretsmanager update-secret \
  --secret-id /mangu/production/DATABASE_URL \
  --secret-string "postgresql://username:password@${DB_ENDPOINT}:5432/mangu_production" \
  --region us-east-1

# Deploy ECS services in DR region
cd infrastructure/terraform/dr
terraform init
terraform apply -var="active_region=us-east-1" -auto-approve

# Scale up ECS services
aws ecs update-service \
  --cluster mangu-publishing-cluster-dr \
  --service mangu-publishing-server-production \
  --desired-count 3 \
  --region us-east-1

aws ecs update-service \
  --cluster mangu-publishing-cluster-dr \
  --service mangu-publishing-client-production \
  --desired-count 2 \
  --region us-east-1

# Wait for services to stabilize
aws ecs wait services-stable \
  --cluster mangu-publishing-cluster-dr \
  --services mangu-publishing-server-production mangu-publishing-client-production \
  --region us-east-1
```

#### Phase 5: DNS Failover (5 minutes)

```bash
# Update Route 53 weighted routing to DR region
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://dr-dns-update.json

# Verify DNS propagation
dig api.mangu-publishing.com
```

**dr-dns-update.json:**
```json
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "api.mangu-publishing.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "DR_ALB_HOSTED_ZONE",
        "DNSName": "dr-alb.us-east-1.elb.amazonaws.com",
        "EvaluateTargetHealth": true
      }
    }
  }]
}
```

#### Phase 6: Validation (15 minutes)

```bash
# Run smoke tests against DR environment
./scripts/smoke-tests.sh https://api.mangu-publishing.com

# Check application health
curl -f https://api.mangu-publishing.com/api/health

# Monitor CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/mangu-dr-alb/... \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average \
  --region us-east-1
```

---

## 3. Recovery Scenarios

### 3.1 Single Database Corruption

**Scenario:** Corrupted data in production database, but RDS instance healthy

**Steps:**
```bash
# 1. Create snapshot of current state (for forensics)
aws rds create-db-snapshot \
  --db-instance-identifier mangu-publishing-db-production \
  --db-snapshot-identifier mangu-corrupted-$(date +%Y%m%d-%H%M%S) \
  --region us-west-2

# 2. Identify last known good snapshot
GOOD_SNAPSHOT=$(aws rds describe-db-snapshots \
  --db-instance-identifier mangu-publishing-db-production \
  --region us-west-2 \
  --query 'DBSnapshots[?SnapshotCreateTime<=`2024-01-01T12:00:00Z`] | sort_by(@, &SnapshotCreateTime) | [-1].DBSnapshotIdentifier' \
  --output text)

# 3. Restore to temporary instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mangu-db-temp-restore \
  --db-snapshot-identifier "$GOOD_SNAPSHOT" \
  --region us-west-2

# 4. Export clean data
pg_dump -h temp-restore-endpoint -U username -d mangu_production -t affected_table > clean_data.sql

# 5. Import to production (during maintenance window)
psql -h production-endpoint -U username -d mangu_production < clean_data.sql

# 6. Cleanup temporary instance
aws rds delete-db-instance \
  --db-instance-identifier mangu-db-temp-restore \
  --skip-final-snapshot \
  --region us-west-2
```

### 3.2 Accidental Data Deletion

**Scenario:** User accidentally deleted critical records

**Recovery:**
```bash
# Restore to point-in-time before deletion
TARGET_TIME="2024-01-01T14:30:00Z"

aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier mangu-publishing-db-production \
  --target-db-instance-identifier mangu-db-pitr-restore \
  --restore-time "$TARGET_TIME" \
  --region us-west-2

# Extract deleted records and re-import (see 3.1 steps 4-6)
```

### 3.3 S3 Bucket Deletion Recovery

**Scenario:** Critical assets accidentally deleted from S3

```bash
# List deleted objects (versioning must be enabled)
aws s3api list-object-versions \
  --bucket mangu-publishing-assets-production \
  --prefix path/to/deleted/ \
  --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}'

# Restore by removing delete markers
aws s3api delete-object \
  --bucket mangu-publishing-assets-production \
  --key path/to/file.jpg \
  --version-id DELETE_MARKER_VERSION_ID

# Or restore from DR replica
aws s3 sync \
  s3://mangu-publishing-assets-dr-production/path/to/deleted/ \
  s3://mangu-publishing-assets-production/path/to/deleted/ \
  --source-region us-east-1 \
  --region us-west-2
```

---

## 4. Validation & Testing

### 4.1 Quarterly DR Drill Schedule

**Q1:** Database restore test (non-production)  
**Q2:** Full DR failover simulation  
**Q3:** Backup restoration verification  
**Q4:** Cross-region replication validation

### 4.2 DR Drill Checklist

```bash
# Execute automated DR drill
./scripts/dr-drill.sh --environment staging

# Validation steps:
# ✓ Latest snapshot < 24 hours old
# ✓ Cross-region copy successful
# ✓ Restore time < 90 minutes
# ✓ Application boots successfully
# ✓ Data integrity checks pass
# ✓ DNS failover < 5 minutes
```

### 4.3 Backup Verification Script

```bash
#!/bin/bash
# scripts/verify-backups.sh

echo "Verifying RDS snapshots..."
LATEST=$(aws rds describe-db-snapshots \
  --db-instance-identifier mangu-publishing-db-production \
  --region us-west-2 \
  --query 'sort_by(DBSnapshots, &SnapshotCreateTime)[-1]' \
  --output json)

AGE=$(echo "$LATEST" | jq -r '.SnapshotCreateTime')
STATUS=$(echo "$LATEST" | jq -r '.Status')

if [[ "$STATUS" == "available" ]]; then
  echo "✅ Latest snapshot: $AGE"
else
  echo "❌ Snapshot status: $STATUS"
  exit 1
fi

echo "Verifying cross-region replica..."
aws rds describe-db-snapshots \
  --region us-east-1 \
  --query 'DBSnapshots[?starts_with(DBSnapshotIdentifier, `mangu`)] | [-1]' \
  --output json
```

---

## 5. Communication Templates

### 5.1 DR Activation Notification

**Subject:** `[URGENT] DR Activation - MANGU Publishing`

```
DISASTER RECOVERY ACTIVATION

Incident: [Brief description]
Decision: Activate DR in us-east-1
Decision Maker: [Name]
Activation Time: [Timestamp]

Expected Impact:
- Service interruption: 2-4 hours
- Data loss: <24 hours (last snapshot)

Status Page: https://status.mangu-publishing.com
War Room: Slack #incident-response

Updates every 30 minutes.
```

### 5.2 DR Completion Notification

**Subject:** `[RESOLVED] DR Recovery Complete`

```
DISASTER RECOVERY COMPLETE

Services restored in: us-east-1
Total downtime: [X] hours [Y] minutes
Data loss: [description]

Post-Incident:
- Root cause analysis: [due date]
- Post-mortem meeting: [scheduled time]
- Incident report: [link]
```

---

## 6. References & Dependencies

### Cross-References
- [Deployment Guide](./DEPLOYMENT.md) - Normal deployment procedures
- [Cost Monitoring](./COST_MONITORING_GUIDE.md) - DR cost tracking
- [Rollback Procedures](./runbooks/rollback.md) - Application rollback

### External Dependencies
- AWS Health Dashboard: https://health.aws.amazon.com
- Status Page: https://status.mangu-publishing.com
- On-Call Schedule: PagerDuty

### Contact Information
- **DevOps Lead**: [Email/Phone]
- **Database Admin**: [Email/Phone]
- **AWS Support**: Enterprise Support case

---

**Document Version:** 1.0  
**Last Updated:** 2024-11-11  
**Next Review:** 2025-02-11  
**Owner:** DevOps Team
