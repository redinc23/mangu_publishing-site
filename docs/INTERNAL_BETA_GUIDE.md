# MANGU Publishing - Internal Beta Guide

Welcome to the MANGU Publishing Internal Beta! This guide will help you get started with testing the platform.

## 🎯 Beta Objectives

The internal beta phase focuses on:
- Validating core user workflows
- Identifying stability issues
- Gathering feedback on user experience
- Testing platform performance under real usage
- Ensuring security and data integrity

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- Docker and Docker Compose (optional, for full stack)
- Git installed
- A code editor (VS Code recommended)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/redinc23/mangu_publishing-site.git
cd mangu_publishing-site

# Install dependencies
npm install
```

### 2. Environment Configuration

Create your environment files:

```bash
# Client environment
cp client/.env.example client/.env

# Server environment
cp server/.env.example server/.env
```

Edit `server/.env` with the following beta-specific settings:

```env
NODE_ENV=beta
PORT=3001
DATABASE_URL=postgresql://mangu_user:mangu_pass@localhost:5432/mangu_db
REDIS_URL=redis://localhost:6379
DISABLE_REDIS=1  # Optional: for development without Redis

# Beta-specific flags
BETA_MODE=true
LOG_LEVEL=debug
ENABLE_ANALYTICS=true
```

### 3. Start the Application

**Option A: Development Mode (Recommended for Beta Testing)**

```bash
# Terminal 1: Start server
cd server && npm run dev

# Terminal 2: Start client
cd client && npm run dev
```

**Option B: Using Docker (Full Stack)**

```bash
./start-dev.sh
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🧪 Testing Checklist

Please test the following core workflows and report any issues:

### Authentication & User Management
- [ ] Sign up with a new account
- [ ] Sign in with existing credentials
- [ ] Password reset functionality
- [ ] Profile page loading and editing
- [ ] Session persistence

### Book Browsing & Discovery
- [ ] Home page loads with featured content
- [ ] Library page displays book grid
- [ ] Search functionality works
- [ ] Filtering by categories
- [ ] Book detail pages load correctly

### Reading Experience
- [ ] Book reader opens and displays content
- [ ] Page navigation (forward/backward)
- [ ] Bookmarks and progress saving
- [ ] Reading settings (font size, theme)

### Audiobook Features
- [ ] Audiobook player loads
- [ ] Playback controls work
- [ ] Progress tracking
- [ ] Speed adjustment

### Shopping & Cart
- [ ] Add books to cart
- [ ] View cart with items
- [ ] Update quantities
- [ ] Checkout process

### Admin Features (Admin Users Only)
- [ ] Admin dashboard loads
- [ ] Book management interface
- [ ] User management tools
- [ ] Analytics and reports

## 🐛 Reporting Issues

When you encounter a bug, please provide:

1. **Steps to Reproduce**: Detailed steps to recreate the issue
2. **Expected Behavior**: What should happen
3. **Actual Behavior**: What actually happened
4. **Environment**: Browser, OS, device type
5. **Screenshots/Videos**: If applicable
6. **Console Logs**: Check browser console (F12) for errors

### Where to Report

- **GitHub Issues**: https://github.com/redinc23/mangu_publishing-site/issues
- **Internal Slack**: #beta-testing channel (if applicable)
- **Email**: beta-feedback@mangu.com (if configured)

## 📊 Beta Analytics

The beta version includes analytics to help us understand usage patterns:

- Page views and navigation flows
- Feature usage metrics
- Performance metrics (load times, errors)
- User interaction patterns

All data is anonymized and used solely for improving the platform.

## 🔒 Security & Privacy

### Important Notes

- This is a BETA version - expect bugs and issues
- Do NOT use real payment information
- Your feedback and test data may be reviewed by the team
- Report any security concerns immediately to security@mangu.com

### Data Handling

- Test data may be reset periodically
- Backups are performed daily but may not be restored
- Use test/dummy data for all transactions

## 💡 Tips for Effective Testing

1. **Test on Multiple Devices**: Desktop, tablet, mobile
2. **Try Different Browsers**: Chrome, Firefox, Safari, Edge
3. **Use Realistic Scenarios**: Act like a real user would
4. **Note Performance**: Mention if pages load slowly
5. **Test Edge Cases**: Empty states, long inputs, etc.
6. **Check Accessibility**: Try keyboard navigation, screen readers

## 📖 Additional Resources

- [API Documentation](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Known Issues](./KNOWN_ISSUES.md)

## 🤝 Getting Help

If you encounter issues during setup or testing:

1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review [Known Issues](./KNOWN_ISSUES.md)
3. Ask in the team Slack channel
4. Open a GitHub issue with the `beta` label

## 📅 Beta Timeline

- **Beta Start**: Week 1 - Initial testing phase
- **Feedback Collection**: Week 2-3 - Active testing and feedback
- **Issue Resolution**: Week 3-4 - Bug fixes and improvements
- **Beta End**: Week 4 - Final validation before public launch

## 🎉 Thank You!

Thank you for participating in the MANGU Publishing internal beta! Your feedback is invaluable in making this platform the best it can be.

Happy testing! 📚✨
