# Credential Rotation Guide

## 🚨 IMMEDIATE ACTION REQUIRED

The following credentials were exposed and MUST be rotated immediately.

---

## 1. AWS Credentials - CRITICAL

### Exposed Credentials
- **Access Key ID**: `AKIA***************` [REDACTED]
- **Secret Access Key**: `******************` [REDACTED]

### Rotation Steps

#### Step 1: Create New Access Key
```bash
# Option A: Using AWS Console
# 1. Go to: https://console.aws.amazon.com/iam/
# 2. Click "Users" → Select your IAM user
# 3. Go to "Security credentials" tab
# 4. Click "Create access key"
# 5. Copy the new Access Key ID and Secret Access Key

# Option B: Using AWS CLI
aws iam create-access-key --user-name YOUR_IAM_USERNAME
```

#### Step 2: Update Local Credentials
```bash
# Create AWS credentials file
cat > scripts/credentials/aws.sh << 'EOF'
#!/bin/bash
export AWS_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="AKIA_NEW_KEY_HERE"
export AWS_SECRET_ACCESS_KEY="new_secret_key_here"
EOF

# Secure the file
chmod 600 scripts/credentials/aws.sh
```

#### Step 3: Test New Credentials
```bash
# Load new credentials
source scripts/credentials/aws.sh

# Test AWS access
aws sts get-caller-identity

# If successful, you'll see your AWS account info
```

#### Step 4: Deactivate Old Key
```bash
# Option A: Using AWS Console
# 1. Go to IAM → Users → Your User → Security credentials
# 2. Find the exposed key (starts with AKIA***)
# 3. Click "Make inactive"
# 4. Monitor for 24-48 hours
# 5. Delete permanently if no issues

# Option B: Using AWS CLI
aws iam update-access-key \
  --user-name YOUR_IAM_USERNAME \
  --access-key-id AKIA_EXPOSED_KEY_ID \
  --status Inactive

# After 24-48 hours, delete it
aws iam delete-access-key \
  --user-name YOUR_IAM_USERNAME \
  --access-key-id AKIA_EXPOSED_KEY_ID
```

#### Step 5: Monitor AWS CloudTrail
```bash
# Check for suspicious activity with old key
# Go to: https://console.aws.amazon.com/cloudtrail/
# Filter by: Access Key ID = [your exposed key]
# Look for: Unknown IP addresses, unusual regions, unexpected service calls
```

---

## 2. GitHub Personal Access Token - CRITICAL

### Exposed Token
- **Token**: `ghp_***********************` [REDACTED]

### Rotation Steps

#### Step 1: Revoke Old Token
```bash
# Go to: https://github.com/settings/tokens
# Find the exposed token (starts with ghp_***)
# Click "Delete" or "Revoke"
```

#### Step 2: Generate New Token
```bash
# 1. Go to: https://github.com/settings/tokens/new
# 2. Give it a descriptive name: "MacBook Development - Oct 2025"
# 3. Select expiration: 90 days (recommended)
# 4. Select scopes:
#    ✅ repo (Full control of private repositories)
#    ✅ workflow (Update GitHub Action workflows)
#    ✅ read:org (Read org and team membership)
# 5. Click "Generate token"
# 6. COPY THE TOKEN IMMEDIATELY (you won't see it again!)
```

#### Step 3: Update Local Credentials
```bash
# Edit the GitHub credentials file
nano scripts/credentials/github.sh

# Update the GITHUB_TOKEN line with your new token:
export GITHUB_TOKEN="ghp_NEW_TOKEN_HERE"

# Save and close (Ctrl+X, Y, Enter)
```

#### Step 4: Test New Token
```bash
# Load new credentials
source scripts/credentials/github.sh

# Test with a simple fetch
git fetch

# Or test with GitHub CLI
gh auth status
```

---

## 3. DeepSeek API Key - HIGH PRIORITY

### Exposed Key
- **API Key**: `sk-***********************` [REDACTED]

### Rotation Steps

#### Step 1: Revoke Old Key
```bash
# 1. Log into DeepSeek dashboard
# 2. Navigate to API Keys section
# 3. Find the exposed key (starts with sk-***)
# 4. Click "Revoke" or "Delete"
```

#### Step 2: Generate New Key
```bash
# 1. In DeepSeek dashboard, click "Create New API Key"
# 2. Give it a name: "Mangu Publishing - Oct 2025"
# 3. Copy the new key
```

#### Step 3: Update Configuration
```bash
# Option A: Store in credentials script
cat > scripts/credentials/deepseek.sh << 'EOF'
#!/bin/bash
export DEEPSEEK_API_KEY="sk_NEW_KEY_HERE"
export DEEPSEEK_USE_LOCAL=false
EOF

chmod 600 scripts/credentials/deepseek.sh

# Option B: Update .env file (for local dev only)
# Edit .env and update DEEPSEEK_API_KEY
```

#### Step 4: Update credential launcher
```bash
# Edit scripts/launch_credentials.sh
# Add these lines in the appropriate section:

if [[ -f "scripts/credentials/deepseek.sh" ]]; then
    source scripts/credentials/deepseek.sh
    echo "✅ DeepSeek credentials loaded"
fi
```

---

## 4. AWS Cognito - MONITOR

### Exposed Identifiers
- **User Pool ID**: `us-east-1_*********` [REDACTED]
- **Client ID**: `*********************` [REDACTED]

### Risk Assessment
- **Risk Level**: Medium
- **Public/Private**: These are public identifiers (not secrets)
- **Action Required**: Monitor for unusual authentication attempts

### Monitoring Steps
```bash
# 1. Go to AWS Cognito Console
# 2. Select the exposed User Pool
# 3. Check "Users and groups" for unexpected users
# 4. Review "App clients" for unauthorized clients
# 5. Check CloudWatch logs for authentication failures
```

### Optional: Create New User Pool (if concerned)
```bash
# If you want extra security, create a new Cognito User Pool
# 1. Go to AWS Cognito Console
# 2. Create new User Pool
# 3. Configure with same settings
# 4. Migrate users (if any exist)
# 5. Update application configuration
# 6. Delete old User Pool after migration
```

---

## 5. Application Secrets - RECOMMENDED

### Exposed Secrets
- **JWT Secret**: `***********************************` [REDACTED]
- **Session Secret**: `*****************************` [REDACTED]

### Risk Assessment
- **Risk Level**: Low-Medium (these are dev/template values)
- **Action Required**: Generate new secrets for production

### Generate New Secrets
```bash
# Generate new JWT secret (64 bytes)
openssl rand -hex 64

# Generate new session secret (32 bytes)
openssl rand -hex 32

# Update server/.env with new values
```

---

## Verification Checklist

After rotating all credentials, verify:

- [ ] AWS credentials rotated and old key deactivated
- [ ] GitHub token revoked and new token working
- [ ] DeepSeek API key regenerated
- [ ] AWS CloudTrail reviewed for suspicious activity
- [ ] GitHub access logs reviewed
- [ ] All local `.env` files contain only placeholders
- [ ] Real credentials stored only in `scripts/credentials/`
- [ ] File permissions verified (600 for credentials)
- [ ] Git history checked for committed secrets
- [ ] Team members notified (if applicable)

---

## Quick Commands Reference

### Load All Credentials
```bash
source scripts/launch_credentials.sh
```

### Load Specific Credentials
```bash
source scripts/credentials/github.sh
source scripts/credentials/aws.sh
source scripts/credentials/deepseek.sh
```

### Verify Credentials Loaded
```bash
./scripts/check_credentials.sh
```

### Test AWS Access
```bash
aws sts get-caller-identity
aws s3 ls
```

### Test GitHub Access
```bash
git fetch
gh auth status
```

---

## Security Monitoring

### Set Up Alerts

#### AWS
```bash
# 1. Go to AWS Budgets: https://console.aws.amazon.com/billing/
# 2. Create budget alert for unusual spending
# 3. Set threshold: $10/day (adjust as needed)

# 4. Go to AWS CloudWatch
# 5. Create alarm for IAM access key usage
```

#### GitHub
```bash
# 1. Go to: https://github.com/settings/security-log
# 2. Review recent activity
# 3. Enable: Settings → Security → "Require additional authentication"
```

---

## Emergency Contacts

If you detect unauthorized access:

1. **AWS**: Immediately deactivate ALL access keys
2. **GitHub**: Revoke ALL personal access tokens
3. **AWS Support**: https://console.aws.amazon.com/support/
4. **GitHub Support**: https://support.github.com/

---

## Post-Rotation Tasks

After rotating credentials:

1. Update production environments (if deployed)
2. Update CI/CD secrets (GitHub Actions, etc.)
3. Notify team members of rotation
4. Document rotation date for audit trail
5. Schedule next rotation (90 days recommended)

---

**Last Updated**: October 18, 2025
**Next Review**: January 18, 2026 (90 days)
