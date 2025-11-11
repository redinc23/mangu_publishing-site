# 🚀 MANGU Publishing - Deployment Scripts

Three automated scripts to make your life easier.

---

## 📋 Scripts Overview

### 1. `deploy-to-production.sh` - Full Deployment Automation
**Use when:** First time deploying or rebuilding infrastructure

**What it does:**
- ✅ Validates AWS credentials
- ✅ Finds or helps create ACM certificate
- ✅ Configures Terraform automatically
- ✅ Deploys entire infrastructure
- ✅ Populates secrets in AWS Secrets Manager
- ✅ Triggers application deployment

**Time:** ~30-40 minutes (mostly waiting)

**Usage:**
```bash
./deploy-to-production.sh
```

The script will guide you through each step with prompts.

---

### 2. `quick-deploy.sh` - Deploy Code Updates
**Use when:** Infrastructure exists, you just want to deploy new code

**What it does:**
- ✅ Switches to main branch (if needed)
- ✅ Creates version tag
- ✅ Pushes to GitHub
- ✅ Triggers GitHub Actions deployment

**Time:** ~2 minutes

**Usage:**
```bash
./quick-deploy.sh
```

Enter version (e.g., `v1.0.1`) and it handles the rest.

---

### 3. `rollback.sh` - Emergency Rollback
**Use when:** Something went wrong, need to rollback quickly

**What it does:**
- ✅ Rolls back server, client, or both
- ✅ Can rollback to previous or specific revision
- ✅ Waits for services to stabilize
- ✅ Optionally runs smoke tests

**Time:** ~5 minutes

**Usage:**
```bash
./rollback.sh
```

Follow prompts to select service and revision.

---

## 🎯 Common Workflows

### First Time Setup
```bash
# 1. Full deployment
./deploy-to-production.sh

# 2. Verify deployment
./scripts/smoke-tests.sh https://your-domain.com
```

### Regular Code Updates
```bash
# 1. Make your code changes
git add .
git commit -m "feat: new feature"
git push origin main

# 2. Deploy
./quick-deploy.sh
# Enter version: v1.0.1

# 3. Monitor
# GitHub Actions URL will be shown
```

### Emergency Rollback
```bash
# Rollback both services to previous version
./rollback.sh
# Service: both
# Revision: (leave empty)
# Confirm: rollback

# Or rollback to specific revision
./rollback.sh
# Service: server
# Revision: 5
# Confirm: rollback
```

---

## 📝 Prerequisites

All scripts require:
- ✅ AWS CLI installed and configured (`aws configure`)
- ✅ Terraform installed (for `deploy-to-production.sh`)
- ✅ Git repository

Check with:
```bash
aws sts get-caller-identity  # Should show your AWS account
terraform version             # Should show version
git status                    # Should show git repo
```

---

## 🔧 Configuration

### Environment Variables (Optional)
You can override defaults by setting these before running:

```bash
export AWS_REGION="us-west-2"
export PROJECT_NAME="my-project"
export ENVIRONMENT="staging"

./deploy-to-production.sh
```

### Terraform Variables
`deploy-to-production.sh` automatically updates `infrastructure/terraform/terraform.tfvars`

You can also edit manually:
```bash
cd infrastructure/terraform
nano terraform.tfvars
```

---

## 🆘 Troubleshooting

### "AWS credentials not configured"
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter default region: us-east-1
```

### "Terraform not found"
```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### "Certificate ARN invalid"
Make sure you:
1. Created certificate in AWS Certificate Manager
2. Completed DNS validation
3. Certificate status is "Issued"
4. Copied the full ARN (starts with `arn:aws:acm:`)

### "Terraform apply failed"
Check:
- ACM certificate exists and is issued
- AWS credentials have sufficient permissions
- No resource naming conflicts

### Script hangs or times out
- Press Ctrl+C to cancel
- Check AWS Console for in-progress operations
- Rerun script (it's idempotent)

---

## 💡 Tips

### Dry Run (See what would happen)
```bash
# For terraform
cd infrastructure/terraform
terraform plan
# Review changes, then Ctrl+C

# For deployment
# Just don't confirm when prompted
./quick-deploy.sh
# Then type 'n' when asked to confirm
```

### View Deployment Progress
```bash
# GitHub Actions
open https://github.com/redinc23/mangu_publishing-site/actions

# ECS Console
open https://console.aws.amazon.com/ecs

# CloudWatch Logs
aws logs tail /ecs/mangu-publishing-server-production --follow
```

### Multiple Environments
```bash
# Deploy to staging
export ENVIRONMENT="staging"
./deploy-to-production.sh

# Deploy to production
export ENVIRONMENT="production"
./deploy-to-production.sh
```

---

## 📊 What Each Script Does Behind The Scenes

### `deploy-to-production.sh`
```
1. Validate Prerequisites (30s)
   ├─ Check AWS CLI
   ├─ Check Terraform
   ├─ Check AWS credentials
   └─ Check Git repository

2. ACM Certificate (5-20min)
   ├─ Search for existing certificate
   ├─ Prompt for domain name
   └─ Help create if needed

3. Configure Terraform (30s)
   ├─ Copy terraform.tfvars.example
   ├─ Update with certificate ARN
   └─ Update with domain name

4. Deploy Infrastructure (15-20min)
   ├─ terraform init
   ├─ terraform plan
   └─ terraform apply

5. Populate Secrets (2min)
   ├─ Generate JWT secret
   ├─ Upload to Secrets Manager
   └─ Optional: Configure Stripe

6. Deploy Application (0min)
   ├─ Create version tag
   ├─ Push to GitHub
   └─ GitHub Actions takes over
```

### `quick-deploy.sh`
```
1. Switch to main branch (optional)
2. Pull latest changes
3. Create version tag
4. Push tag to GitHub
5. GitHub Actions deploys automatically
```

### `rollback.sh`
```
1. Prompt for service (server/client/both)
2. Prompt for revision (or use previous)
3. Get current task definition
4. Update ECS service with previous revision
5. Wait for services to stabilize
6. Optional: Run smoke tests
```

---

## 🔒 Security Notes

- ✅ Secrets never stored in git
- ✅ Passwords auto-generated (random_password)
- ✅ ACM certificate validated via DNS
- ✅ All traffic encrypted (TLS 1.3)
- ✅ IAM least privilege permissions
- ✅ Secrets Manager for sensitive data

---

## 📚 Additional Resources

- **Full Documentation:** `DEPLOYMENT_ACTION_PLAN.html`
- **Infrastructure Details:** `INFRASTRUCTURE_FIXES_COMPLETE.md`
- **Troubleshooting:** `docs/runbooks/troubleshooting.md`
- **Rollback Procedures:** `docs/runbooks/rollback.md`

---

**Questions?** Check the docs or runbooks in `/docs/runbooks/`

