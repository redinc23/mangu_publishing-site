# Security & Compliance Guide

This document describes the security and compliance infrastructure for MANGU Publishing.

## Table of Contents

1. [IAM Least Privilege](#iam-least-privilege)
2. [Security Scanning](#security-scanning)
3. [Secret Rotation](#secret-rotation)
4. [Audit Logging](#audit-logging)
5. [Compliance Frameworks](#compliance-frameworks)

## IAM Least Privilege

### Overview

All AWS resources follow the principle of least privilege with service-specific IAM roles that have minimal permissions.

### Key Features

- **Service-Specific Roles**: Separate roles for ECS tasks, Lambda functions, and CI/CD
- **Permission Boundaries**: Prevent privilege escalation and resource deletion
- **Cross-Account Access**: OIDC-based GitHub Actions integration (no long-lived credentials)
- **Regular Reviews**: Automated permission auditing with CloudWatch Events

### IAM Roles

#### ECS Task Execution Role
```bash
Role: mangu-publishing-{environment}-ecs-task-execution
Purpose: Pull container images, retrieve secrets, write logs
```

**Permissions:**
- ECR: Pull container images
- Secrets Manager: Read application secrets
- CloudWatch Logs: Write application logs

#### ECS Task Role
```bash
Role: mangu-publishing-{environment}-ecs-task
Purpose: Application-level AWS service access
```

**Permissions:**
- S3: Read/write to specific buckets only
- SES: Send emails from verified addresses
- CloudWatch: Create and write to log streams

#### GitHub Actions Role
```bash
Role: mangu-publishing-{environment}-github-actions
Purpose: Deploy applications from CI/CD
```

**Permissions:**
- ECR: Push container images
- ECS: Update services and task definitions
- CloudWatch: Write deployment logs

### Permission Boundaries

All service roles have permission boundaries that prevent:
- Creating IAM users or roles
- Attaching or modifying IAM policies
- Accessing secrets from other projects
- Deleting critical resources (RDS, S3, ElastiCache)

### Usage

```bash
# Apply IAM configuration
cd infrastructure/terraform
terraform plan -target=aws_iam_role.ecs_task_execution_role
terraform apply -target=aws_iam_role.ecs_task_execution_role

# Verify role permissions
aws iam get-role --role-name mangu-publishing-production-ecs-task-execution
```

## Security Scanning

### Overview

Comprehensive security scanning runs automatically on every push and pull request.

### Scanning Tools

#### 1. Trivy (Container Scanning)
- **Scans:** Docker images for OS and library vulnerabilities
- **When:** On push, PR, and daily schedule
- **Severity:** CRITICAL, HIGH, MEDIUM
- **Output:** SARIF format uploaded to GitHub Security tab

#### 2. Snyk (Dependency Scanning)
- **Scans:** npm dependencies in server/ and client/
- **When:** On push and PR
- **Configuration:** `.snyk` policy file for exceptions
- **Output:** GitHub Security alerts

#### 3. Secret Scanning
- **Tools:** TruffleHog + Gitleaks
- **Scans:** Git history for exposed credentials
- **When:** On every push and PR
- **Prevention:** Pre-commit hooks

#### 4. SAST (Static Application Security Testing)
- **Tools:** Semgrep + ESLint security plugin
- **Scans:** Code for security vulnerabilities
- **Rulesets:** OWASP Top 10, Node.js, React, SQL injection, XSS
- **Output:** SARIF format in GitHub Security

#### 5. Infrastructure Security
- **Tools:** Trivy, Checkov, tfsec
- **Scans:** Terraform configurations
- **Checks:** Encryption, public access, IAM policies
- **When:** On Terraform changes

### Running Scans Locally

```bash
# Container scan
docker build -t mangu-server:test -f Dockerfile .
trivy image --severity HIGH,CRITICAL mangu-server:test

# Dependency scan
cd server
npm audit --audit-level=high

# Secret scan
gitleaks detect --source . --verbose

# SAST scan
npx semgrep --config=p/security-audit .

# Infrastructure scan
cd infrastructure/terraform
tfsec .
```

### Viewing Results

1. **GitHub Security Tab**: Navigate to repository → Security → Code scanning alerts
2. **Workflow Summary**: Check the security workflow run for detailed reports
3. **Artifacts**: Download scan reports from workflow artifacts

### Configuring Thresholds

Edit `.github/workflows/security.yml`:

```yaml
# Fail build on critical vulnerabilities only
exit-code: '1'
severity: 'CRITICAL'
```

## Secret Rotation

### Overview

Automated secret rotation ensures credentials are refreshed regularly without manual intervention.

### Rotation Schedule

| Secret Type | Rotation Frequency | Method |
|------------|-------------------|---------|
| JWT Secrets | 90 days | Dual-key strategy |
| Database Credentials | 90 days | RDS native rotation |
| API Keys | Manual | Provider-specific |
| AWS Access Keys | 90 days | IAM key rotation |

### Rotation Strategy

#### JWT Secrets (Zero-Downtime)

1. Generate new primary key
2. Keep old key as secondary for 24 hours
3. Both keys validate tokens during transition
4. Remove secondary key after grace period

```bash
# Manual rotation
scripts/rotate-secrets.sh rotate

# Dry run
DRY_RUN=true scripts/rotate-secrets.sh rotate

# Check if rotation needed
scripts/rotate-secrets.sh check mangu-publishing-production-jwt-secret
```

#### Database Credentials

Uses AWS Secrets Manager with Lambda rotation function:

1. Create new user in RDS
2. Grant same permissions as current user
3. Update secret with new credentials
4. Test new credentials
5. Drop old user

```bash
# Enable automatic rotation
aws secretsmanager rotate-secret \
  --secret-id mangu-publishing-production-db-credentials \
  --rotation-lambda-arn arn:aws:lambda:REGION:ACCOUNT:function:rotation

# Trigger immediate rotation
aws secretsmanager rotate-secret \
  --secret-id mangu-publishing-production-db-credentials
```

### Rollback Procedure

If rotation causes issues:

```bash
# Rollback to previous version
scripts/rotate-secrets.sh rollback mangu-publishing-production-jwt-secret

# Rollback to specific version
scripts/rotate-secrets.sh rollback mangu-publishing-production-jwt-secret VERSION_ID
```

### Monitoring

Secret rotation is audited and logged:

- **Audit Log**: `/var/log/mangu-publishing/secret-rotation.log`
- **CloudWatch**: `/aws/secrets/mangu-publishing/{environment}`
- **Alerts**: SNS topic `mangu-publishing-{environment}-security-alerts`

### GitHub Actions Integration

Automated rotation runs via GitHub Actions:

```bash
# Trigger manual rotation
gh workflow run secret-rotation.yml \
  -f environment=production \
  -f dry_run=false

# View rotation status
gh run list --workflow=secret-rotation.yml
```

## Audit Logging

### Overview

Comprehensive audit logging captures all AWS API calls and resource access for compliance and security monitoring.

### CloudTrail Configuration

- **Multi-region**: Captures events from all regions
- **Log Validation**: Enabled to detect tampering
- **Encryption**: KMS encryption for all logs
- **Retention**: 7 years (2555 days) for compliance
- **Insights**: API call rate anomaly detection

### Log Storage

```
S3 Bucket: mangu-publishing-{environment}-cloudtrail-logs
├── AWSLogs/
│   └── {account-id}/
│       └── CloudTrail/
│           └── {region}/
│               └── {year}/{month}/{day}/
└── Lifecycle:
    ├── 90 days → STANDARD_IA
    ├── 365 days → GLACIER
    └── 2555 days → DELETE
```

### CloudWatch Integration

Real-time log streaming to CloudWatch Logs for analysis:

- **Log Group**: `/aws/cloudtrail/mangu-publishing-{environment}`
- **Retention**: 365 days
- **Encryption**: KMS encryption

### Monitored Events

#### Security Events
- Unauthorized API calls
- Root account usage
- IAM policy changes
- Console login failures
- Resource deletion attempts

#### Data Access
- S3 object access (uploads, downloads, deletions)
- Database connections
- Secrets Manager access
- Lambda invocations

### Alerts and Alarms

| Alarm | Threshold | Action |
|-------|-----------|--------|
| Unauthorized API calls | > 5 in 5 minutes | SNS alert |
| Root account usage | ≥ 1 | SNS alert (critical) |
| IAM policy changes | ≥ 1 | SNS alert |
| Console login failures | > 3 in 5 minutes | SNS alert |

### Querying Logs

```bash
# Recent unauthorized access attempts
aws logs start-query \
  --log-group-name /aws/cloudtrail/mangu-publishing-production \
  --start-time $(date -d '24 hours ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, eventName, sourceIPAddress | filter errorCode like /UnauthorizedOperation|AccessDenied/'

# Root account usage
aws logs start-query \
  --log-group-name /aws/cloudtrail/mangu-publishing-production \
  --start-time $(date -d '7 days ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, eventName | filter userIdentity.type = "Root"'

# IAM changes in last 24 hours
aws logs start-query \
  --log-group-name /aws/cloudtrail/mangu-publishing-production \
  --start-time $(date -d '24 hours ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, eventName, userIdentity.principalId | filter eventName in ["CreateUser", "DeleteUser", "AttachUserPolicy"]'
```

### Compliance Reports

Automated daily compliance reports generated via Lambda:

- **Schedule**: Daily at 8 AM UTC
- **Storage**: `s3://mangu-publishing-{environment}-compliance-reports/`
- **Formats**: JSON and HTML
- **Includes**: SOC2, GDPR, HIPAA compliance checks

View latest report:
```bash
aws s3 ls s3://mangu-publishing-production-compliance-reports/compliance-reports/production/ \
  --recursive | sort | tail -n 1
```

## Compliance Frameworks

### SOC2 Type II

**Trust Service Criteria:**

✅ **Security**
- Access controls with IAM least privilege
- Encryption at rest and in transit
- Multi-factor authentication required
- Regular vulnerability scanning

✅ **Availability**
- Multi-AZ deployment for high availability
- Auto-scaling for traffic spikes
- Disaster recovery procedures
- 99.9% uptime SLA

✅ **Processing Integrity**
- Input validation on all endpoints
- Transaction logging and audit trails
- Error handling and alerting

✅ **Confidentiality**
- Data encryption (AES-256)
- Network isolation with VPC
- Secrets management with AWS Secrets Manager

✅ **Privacy**
- Data minimization practices
- User consent tracking
- Right to access/delete implementation

### GDPR Compliance

**Data Protection Requirements:**

✅ **Article 32: Security of Processing**
- Pseudonymization and encryption
- Ability to restore availability
- Regular security testing

✅ **Article 33: Breach Notification**
- Automated breach detection
- 72-hour notification process
- Incident response procedures

✅ **Article 15-20: Data Subject Rights**
- Right to access
- Right to rectification
- Right to erasure
- Right to data portability

### HIPAA (if applicable)

**Safeguards:**

✅ **Technical Safeguards**
- Access control (unique user IDs)
- Audit controls (CloudTrail)
- Integrity controls (log validation)
- Transmission security (TLS 1.2+)

✅ **Administrative Safeguards**
- Security management process
- Workforce security training
- Information access management

✅ **Physical Safeguards**
- Facility access controls (AWS managed)
- Workstation security
- Device and media controls

### Compliance Validation

```bash
# Run compliance checks
cd infrastructure/terraform
terraform plan -out=tfplan
terraform show -json tfplan | jq '.planned_values.root_module.resources[] | select(.type | startswith("aws_")) | {type, name, values}'

# Verify encryption
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,StorageEncrypted]'
aws s3api get-bucket-encryption --bucket mangu-publishing-production-uploads
aws elasticache describe-cache-clusters --query 'CacheClusters[*].[CacheClusterId,AtRestEncryptionEnabled,TransitEncryptionEnabled]'

# Check access logging
aws s3api get-bucket-logging --bucket mangu-publishing-production-uploads
```

## Best Practices

### For Developers

1. **Never commit secrets** - Use environment variables and Secrets Manager
2. **Review security scan results** - Address findings before merging
3. **Follow least privilege** - Request only necessary permissions
4. **Enable MFA** - Required for production access
5. **Use secure dependencies** - Keep packages up to date

### For Operations

1. **Regular audits** - Review CloudTrail logs weekly
2. **Monitor alerts** - Respond to security notifications immediately
3. **Test backups** - Verify restoration procedures monthly
4. **Update runbooks** - Document incident response procedures
5. **Rotate secrets** - Don't skip scheduled rotations

### For Security Team

1. **Annual reviews** - Conduct comprehensive security assessments
2. **Penetration testing** - Schedule external security audits
3. **Compliance audits** - Prepare for SOC2/GDPR audits
4. **Threat modeling** - Update threat models quarterly
5. **Security training** - Conduct team security workshops

## Emergency Procedures

### Security Incident Response

1. **Detect**: Automated alerts or manual discovery
2. **Contain**: Isolate affected resources
3. **Eradicate**: Remove threat and vulnerabilities
4. **Recover**: Restore services from backups
5. **Lessons Learned**: Document and improve

### Contact

- **Security Team**: security@mangupublishing.com
- **On-Call**: PagerDuty integration
- **Escalation**: CTO/CISO

## Additional Resources

- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
