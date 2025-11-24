# Beta Quick Reference Guide

Quick reference for MANGU Publishing internal beta testers.

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/redinc23/mangu_publishing-site.git
cd mangu_publishing-site && npm install

# 2. Configure
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env: set BETA_MODE=true

# 3. Start
cd server && npm run dev  # Terminal 1
cd client && npm run dev  # Terminal 2
```

## 🔗 Quick Links

| What | URL |
|------|-----|
| **Frontend** | http://localhost:5173 |
| **API** | http://localhost:3001/api |
| **Health Check** | http://localhost:3001/api/health |
| **Beta Status** | http://localhost:5173/beta/status |
| **Feature Flags** | http://localhost:3001/api/config |

## 🎯 Key Features to Test

### Must Test
- [ ] Homepage loads
- [ ] Search works
- [ ] Book details display
- [ ] Cart functionality
- [ ] Sign in/up
- [ ] Beta feedback submission

### Should Test
- [ ] Profile page
- [ ] Audiobook player (if enabled)
- [ ] Admin panel (if admin)
- [ ] Mobile responsiveness
- [ ] Browser compatibility

### Nice to Test
- [ ] Edge cases
- [ ] Performance
- [ ] Accessibility
- [ ] Error handling

## 🐛 Bug Reporting Template

```markdown
## Bug: [Short Description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. Go to...
2. Click on...
3. See error

**Expected**: [What should happen]
**Actual**: [What actually happened]

**Environment**:
- Browser: Chrome 120
- OS: Windows 11
- Screen: 1920x1080

**Screenshots**: [Attach if relevant]
**Console Errors**: [Paste any errors]
```

## 💬 Feedback Channels

| Channel | When to Use |
|---------|-------------|
| **In-App Feedback** | Quick feedback, suggestions |
| **GitHub Issues** | Bugs, feature requests |
| **Email** | Detailed feedback, private concerns |
| **Slack** | Quick questions, discussions |

Email: beta-feedback@mangu.com  
GitHub: https://github.com/redinc23/mangu_publishing-site/issues

## ⚡ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F12` | Open DevTools |
| `Ctrl/Cmd + Shift + R` | Hard Refresh |
| `Ctrl/Cmd + Shift + I` | Inspect Element |
| `Esc` | Close Modals |

## 🔧 Common Issues

### Issue: Port Already in Use
```bash
lsof -ti:3001 | xargs kill -9  # Kill port 3001
lsof -ti:5173 | xargs kill -9  # Kill port 5173
```

### Issue: Database Connection Failed
```bash
# Check if PostgreSQL is running
psql --version
docker ps | grep postgres

# Or use mock data
# In server/.env: Add FEATURE_MOCK_DATA=true
```

### Issue: Redis Connection Failed
```bash
# Disable Redis temporarily
# In server/.env: Add DISABLE_REDIS=1
```

### Issue: Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📊 Beta Status Indicators

| Status | Meaning |
|--------|---------|
| 🟢 **Healthy** | All systems operational |
| 🟡 **Degraded** | Some services having issues |
| 🔴 **Critical** | Major problems, limited functionality |

## 🎨 Feature Flags

Check `/beta/status` for current enabled features:

- **audiobooks** - Audiobook player
- **socialSharing** - Share books
- **bookClubs** - Book club features
- **adminPanel** - Admin dashboard
- **betaFeedback** - Feedback system (always on)
- **aiRecommendations** - AI book suggestions
- **offlineMode** - Offline reading

## 📱 Testing Checklist

### Per Session (5 min)
- [ ] App loads without errors
- [ ] Beta banner visible
- [ ] One feature tested
- [ ] Feedback submitted

### Weekly (30 min)
- [ ] All critical workflows
- [ ] Multiple browsers
- [ ] Mobile + desktop
- [ ] Edge cases
- [ ] Detailed bug report

## 🆘 Getting Help

1. **Check Docs**: docs/TROUBLESHOOTING.md
2. **Known Issues**: docs/KNOWN_ISSUES.md
3. **Testing Script**: docs/BETA_TESTING_SCRIPT.md
4. **Ask Team**: Slack or GitHub Issues
5. **Email**: beta-feedback@mangu.com

## 📈 Success Metrics

You're doing great if you:
- ✅ Test regularly (2-3 times/week)
- ✅ Report bugs with details
- ✅ Provide constructive feedback
- ✅ Try different scenarios
- ✅ Have fun! 🎉

## 🔒 Security Reminders

- ⚠️ This is BETA - expect bugs
- ⚠️ Do NOT use real payment info
- ⚠️ Use dummy/test data only
- ⚠️ Report security issues immediately
- ⚠️ Data may be reset without notice

## 📅 Beta Timeline

| Week | Focus |
|------|-------|
| **Week 1** | Setup, Basic Functionality |
| **Week 2** | Advanced Features, Edge Cases |
| **Week 3** | Performance, Mobile, Browsers |
| **Week 4** | Final Testing, Feedback Review |

## ⭐ Beta Tester Hall of Fame

Top contributors will be recognized! Track your impact:
- Bugs found
- Features tested
- Feedback quality
- Participation consistency

---

**Remember**: Every bug you find makes the platform better! 🐛➡️🦋

Quick Questions? Check `/beta/status` or email beta-feedback@mangu.com
