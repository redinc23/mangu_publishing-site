# Auto Push & PR Automation Setup

This directory contains scripts for automated git operations and PR creation.

## 📋 Scripts

### 1. `auto-push.sh` - Main Auto-Push Script
Automatically commits changes, pushes to a new branch, and creates a PR.

**Usage:**
```bash
./scripts/auto-push.sh
```

**Features:**
- ✅ Detects changes automatically
- ✅ Creates timestamped branch
- ✅ Commits all changes
- ✅ Pushes branch
- ✅ Creates PR via GitHub CLI
- ✅ Safe (checks before committing)

### 2. `scheduled-auto-push.sh` - Scheduled Runner
Wrapper script for cron/systemd with logging and lock management.

**Usage:**
```bash
./scripts/scheduled-auto-push.sh
```

**Features:**
- ✅ Lock file management
- ✅ Logging to file
- ✅ Prevents duplicate runs
- ✅ Error handling

## ⚙️ Setup Options

### Option 1: GitHub Actions (Recommended)
Already configured in `.github/workflows/auto-push.yml`

**Features:**
- ✅ Runs every 6 hours automatically
- ✅ Can be triggered manually
- ✅ Runs on GitHub servers
- ✅ No local setup needed

**Enable:**
1. Push this workflow file to your repo
2. GitHub Actions will run automatically
3. Check Actions tab for runs

### Option 2: Local Cron Job

**Setup:**
```bash
# Edit crontab
crontab -e

# Add this line (runs every 6 hours)
0 */6 * * * /Users/redinc23gmail.com/projects/mangu2-publishing/scripts/scheduled-auto-push.sh
```

**Verify:**
```bash
crontab -l
```

### Option 3: macOS LaunchAgent

Create `~/Library/LaunchAgents/com.mangu.auto-push.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mangu.auto-push</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/redinc23gmail.com/projects/mangu2-publishing/scripts/scheduled-auto-push.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>21600</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/redinc23gmail.com/projects/mangu2-publishing/logs/auto-push.out</string>
    <key>StandardErrorPath</key>
    <string>/Users/redinc23gmail.com/projects/mangu2-publishing/logs/auto-push.err</string>
</dict>
</plist>
```

**Load:**
```bash
launchctl load ~/Library/LaunchAgents/com.mangu.auto-push.plist
launchctl start com.mangu.auto-push
```

### Option 4: Manual Run
Just run when needed:
```bash
./scripts/auto-push.sh
```

## 🔧 Configuration

### Environment Variables
Set these in `scripts/credentials/local.sh`:
```bash
export GITHUB_TOKEN=your_token_here
export GITHUB_REPO=redinc23/mangu_publishing-site
```

### Script Variables
Edit these in `auto-push.sh`:
```bash
REPO_DIR="/Users/redinc23gmail.com/projects/mangu2-publishing"
BRANCH_PREFIX="auto-update"
GITHUB_REPO="redinc23/mangu_publishing-site"
MAIN_BRANCH="main"
```

## 📝 How It Works

1. **Detect Changes**: Checks for uncommitted changes
2. **Create Branch**: Creates timestamped branch (`auto-update-YYYYMMDD-HHMMSS`)
3. **Commit**: Commits all changes with auto-generated message
4. **Push**: Pushes branch to GitHub
5. **Create PR**: Creates PR using GitHub CLI or prints URL

## 🛡️ Safety Features

- ✅ Checks for changes before committing
- ✅ Lock file prevents duplicate runs
- ✅ Uses timestamped branches
- ✅ Won't overwrite existing commits
- ✅ Logs all operations

## 📊 Monitoring

### View Logs
```bash
tail -f logs/auto-push.log
```

### Check GitHub Actions
Visit: `https://github.com/redinc23/mangu_publishing-site/actions`

### Check Recent PRs
```bash
gh pr list --label automated
```

## 🎯 Usage Examples

### Run Once
```bash
./scripts/auto-push.sh
```

### Schedule Every Hour
```bash
# Add to crontab
0 * * * * /path/to/scripts/scheduled-auto-push.sh
```

### Schedule Daily at 2 AM
```bash
# Add to crontab
0 2 * * * /path/to/scripts/scheduled-auto-push.sh
```

### Force Run (GitHub Actions)
Go to Actions → Auto Push & PR → Run workflow → Force: true

## 🔍 Troubleshooting

### "Command not found: gh"
Install GitHub CLI:
```bash
brew install gh
gh auth login
```

### "Permission denied"
Make scripts executable:
```bash
chmod +x scripts/*.sh
```

### "Not a git repository"
Run from project root:
```bash
cd /Users/redinc23gmail.com/projects/mangu2-publishing
```

### "GitHub token not found"
Set in `scripts/credentials/local.sh`:
```bash
export GITHUB_TOKEN=your_token_here
```

## 📚 Additional Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitHub CLI Docs](https://cli.github.com/manual/)
- [Cron Guide](https://crontab.guru/)

---

**Created**: October 31, 2025  
**Last Updated**: October 31, 2025

