# 🤖 Auto Push & PR System - INSTALLED

## ✅ What's Been Created

### Scripts
1. ✅ **`scripts/auto-push.sh`** - Main automation script
2. ✅ **`scripts/scheduled-auto-push.sh`** - Cron wrapper with logging
3. ✅ **`.github/workflows/auto-push.yml`** - GitHub Actions workflow

### Documentation
1. ✅ **`scripts/AUTO_PUSH_README.md`** - Complete documentation
2. ✅ **`AUTO_PUSH_QUICKSTART.md`** - Quick start guide

### Directories
1. ✅ **`logs/`** - For log files
2. ✅ **`.github/workflows/`** - GitHub Actions workflows

---

## 🚀 Quick Start

### Option 1: GitHub Actions (Easiest - Recommended)

**Just push the workflow file:**
```bash
git add .github/workflows/auto-push.yml
git commit -m "Add auto-push workflow"
git push
```

**That's it!** It will:
- ✅ Run every 6 hours automatically
- ✅ Detect changes
- ✅ Create PRs automatically
- ✅ No local setup needed

### Option 2: Local Cron Job

**Test first:**
```bash
./scripts/auto-push.sh
```

**Then setup cron:**
```bash
crontab -e
# Add: 0 */6 * * * /Users/redinc23gmail.com/projects/mangu2-publishing/scripts/scheduled-auto-push.sh
```

---

## 🎯 How It Works

1. **Detects Changes** → Checks for uncommitted changes
2. **Creates Branch** → `auto-update-YYYYMMDD-HHMMSS`
3. **Commits Changes** → Auto-generated commit message
4. **Pushes Branch** → Pushes to GitHub
5. **Creates PR** → Automatically via GitHub CLI or API

---

## 📊 Schedule Options

### GitHub Actions (Recommended)
- **Default**: Every 6 hours
- **Manual**: Can trigger anytime
- **Edit**: `.github/workflows/auto-push.yml`

### Cron Examples
```bash
# Every 6 hours
0 */6 * * *

# Every hour
0 * * * *

# Daily at 2 AM
0 2 * * *

# Every 30 minutes
*/30 * * * *
```

---

## 🔧 Configuration

### GitHub Actions Workflow
Edit `.github/workflows/auto-push.yml`:
- Change schedule: `cron: '0 */6 * * *'`
- Change branch: `base: 'main'`
- Add conditions as needed

### Local Scripts
Edit `scripts/auto-push.sh`:
```bash
BRANCH_PREFIX="auto-update"    # Change branch prefix
MAIN_BRANCH="main"             # Change target branch
GITHUB_REPO="redinc23/mangu_publishing-site"  # Your repo
```

---

## 📝 Current Status

### Files Created
- ✅ `scripts/auto-push.sh` - Executable
- ✅ `scripts/scheduled-auto-push.sh` - Executable
- ✅ `.github/workflows/auto-push.yml` - Ready
- ✅ Documentation files - Complete

### Next Steps
1. **Push workflow file** to enable GitHub Actions
2. **Or setup cron** for local automation
3. **Or run manually** when needed

---

## 🎉 Usage Examples

### Run Once (Manual)
```bash
./scripts/auto-push.sh
```

### Setup Cron (Every 6 Hours)
```bash
crontab -e
# Add: 0 */6 * * * /Users/redinc23gmail.com/projects/mangu2-publishing/scripts/scheduled-auto-push.sh
```

### GitHub Actions (Automatic)
Just push the workflow file - it runs automatically!

---

## 📊 Monitoring

### View Logs
```bash
tail -f logs/auto-push.log
```

### Check GitHub Actions
Visit: `https://github.com/redinc23/mangu_publishing-site/actions`

### Check PRs
```bash
gh pr list --label automated
```

---

## 🛡️ Safety Features

- ✅ Checks for changes before committing
- ✅ Lock file prevents duplicate runs
- ✅ Timestamped branches (no conflicts)
- ✅ Logs all operations
- ✅ Won't overwrite existing commits

---

## ✅ Installation Complete!

Your auto-push system is ready! Choose your preferred method:

1. **GitHub Actions** (Recommended) - Just push the workflow
2. **Local Cron** - Setup cron job
3. **Manual** - Run when needed

---

**Created**: October 31, 2025  
**Status**: ✅ Ready to Use

