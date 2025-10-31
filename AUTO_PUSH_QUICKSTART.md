# 🚀 Quick Start: Auto Push & PR

## ⚡ Fastest Setup (GitHub Actions)

1. **Push the workflow file:**
   ```bash
   git add .github/workflows/auto-push.yml
   git commit -m "Add auto-push workflow"
   git push
   ```

2. **Done!** It will run every 6 hours automatically.

## 🖥️ Local Setup (Cron)

1. **Make scripts executable:**
   ```bash
   chmod +x scripts/*.sh
   ```

2. **Test run:**
   ```bash
   ./scripts/auto-push.sh
   ```

3. **Setup cron (every 6 hours):**
   ```bash
   crontab -e
   # Add: 0 */6 * * * /Users/redinc23gmail.com/projects/mangu2-publishing/scripts/scheduled-auto-push.sh
   ```

## 📋 What It Does

✅ Detects changes automatically  
✅ Creates timestamped branch  
✅ Commits changes  
✅ Pushes to GitHub  
✅ Creates PR automatically  

## 🎯 Schedule Options

- **Every 6 hours**: `0 */6 * * *`
- **Every hour**: `0 * * * *`
- **Daily at 2 AM**: `0 2 * * *`
- **Every 30 minutes**: `*/30 * * * *`

## 🔧 Configure

Edit `scripts/auto-push.sh`:
- `BRANCH_PREFIX`: Change branch name prefix
- `MAIN_BRANCH`: Change target branch
- `GITHUB_REPO`: Your repo name

## 📊 Monitor

- **Logs**: `tail -f logs/auto-push.log`
- **GitHub Actions**: Check Actions tab
- **PRs**: `gh pr list --label automated`

---

**That's it!** Your repo will now auto-push and create PRs automatically! 🎉

