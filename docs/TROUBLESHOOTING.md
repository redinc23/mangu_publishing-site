# Troubleshooting Guide - Internal Beta

Common issues and solutions for the MANGU Publishing internal beta.

## 🚨 Installation & Setup Issues

### Issue: "npm install" fails with permission errors

**Solution:**
```bash
# Option 1: Use sudo (not recommended)
sudo npm install

# Option 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Option 3: Use nvm (best practice)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Issue: Port already in use (3001 or 5173)

**Solution:**
```bash
# Find and kill processes using the ports
# On Linux/Mac:
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# On Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue: Database connection failed

**Symptoms:**
- "ECONNREFUSED" errors
- Health check showing database as "disconnected"
- Server fails to start

**Solution:**
```bash
# 1. Check if PostgreSQL is running
psql --version

# 2. Start PostgreSQL (method depends on installation)
# Docker:
docker ps | grep postgres
docker start postgres-container-name

# System service:
sudo service postgresql start

# 3. Verify connection
psql -h localhost -U mangu_user -d mangu_db

# 4. If database doesn't exist, create it
createdb mangu_db

# 5. Run migrations
cd server && npm run migrate
```

## 🔧 Runtime Issues

### Issue: White screen / React app won't load

**Solution:**
```bash
# 1. Clear build cache
rm -rf client/dist client/node_modules/.vite

# 2. Reinstall dependencies
cd client && npm install

# 3. Check console for errors (F12 in browser)

# 4. Verify environment variables
cat client/.env

# 5. Try fresh build
npm run build
npm run preview
```

### Issue: API calls returning 404 or 500 errors

**Solution:**
```bash
# 1. Check if server is running
curl http://localhost:3001/api/health

# 2. Verify API proxy configuration in vite.config.js
cat client/vite.config.js | grep proxy

# 3. Check server logs for errors
cd server && npm run dev

# 4. Test API directly
curl http://localhost:3001/api/books/featured
```

### Issue: Redis connection errors

**Solution:**
```bash
# Option 1: Disable Redis for development
# In server/.env:
DISABLE_REDIS=1

# Option 2: Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Option 3: Check Redis connection
redis-cli ping
```

## 🎨 Frontend Issues

### Issue: Styles not loading / CSS broken

**Solution:**
```bash
# 1. Clear browser cache (Ctrl+Shift+Delete)

# 2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

# 3. Check if CSS files exist
ls -la client/dist/assets/

# 4. Rebuild with clean slate
cd client
rm -rf dist node_modules/.vite
npm run build
```

### Issue: React Router not working / 404 on refresh

**Solution:**
```bash
# 1. Ensure historyApiFallback is enabled in vite.config.js
# Should have:
# server: {
#   historyApiFallback: true
# }

# 2. For production builds, ensure server redirects all routes to index.html
```

### Issue: Images or assets not loading

**Solution:**
```bash
# 1. Check if images exist in public folder
ls -la client/public/

# 2. Verify image paths are relative
# Use: /images/book-cover.jpg
# Not: ./images/book-cover.jpg

# 3. Check browser network tab (F12) for 404s

# 4. Verify CORS settings if loading from external CDN
```

## 🔐 Authentication Issues

### Issue: Can't log in / Session expires immediately

**Solution:**
```bash
# 1. Clear browser cookies and local storage
# In browser console (F12):
localStorage.clear();
sessionStorage.clear();

# 2. Check if JWT_SECRET is set in server/.env
cat server/.env | grep JWT_SECRET

# 3. Verify session cookie settings
# Should allow localhost in development

# 4. Check if time/date is correct on your system
date
```

### Issue: Password reset not working

**Solution:**
```bash
# 1. Check email configuration in server/.env
cat server/.env | grep EMAIL

# 2. Check server logs for email sending errors
cd server && npm run dev

# 3. For testing, check MailHog at http://localhost:8025
# (if using Docker setup)

# 4. Verify SMTP settings are correct
```

## 📊 Performance Issues

### Issue: Slow page loads

**Solution:**
```bash
# 1. Check network tab in browser (F12)
# Look for slow API calls

# 2. Enable Redis caching
# In server/.env, remove or set to 0:
# DISABLE_REDIS=0

# 3. Check database query performance
# Enable query logging in server/.env:
LOG_LEVEL=debug

# 4. Monitor server resource usage
top
# or
htop
```

### Issue: High memory usage

**Solution:**
```bash
# 1. Check for memory leaks in Node
node --inspect server/src/index.js

# 2. Restart server periodically
pm2 restart mangu-server

# 3. Limit concurrent database connections
# In server/.env:
DB_POOL_MAX=10

# 4. Clear Redis cache
redis-cli FLUSHALL
```

## 🧪 Testing Issues

### Issue: Tests failing locally

**Solution:**
```bash
# 1. Ensure test database is set up
createdb mangu_test

# 2. Set test environment
export NODE_ENV=test

# 3. Run tests with verbose output
npm test -- --verbose

# 4. Check for port conflicts
# Tests may use ports 3001 or 5173

# 5. Clear test cache
npm test -- --clearCache
```

### Issue: E2E tests timing out

**Solution:**
```bash
# 1. Increase timeout in test configuration
# In vitest.config.js or playwright.config.js

# 2. Check if browser automation is installed
npx playwright install

# 3. Run tests in headed mode to see what's happening
npm run test:e2e -- --headed

# 4. Check if application is running before tests
curl http://localhost:5173
```

## 🐛 Common Error Messages

### "MODULE_NOT_FOUND"

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

### "EADDRINUSE"

```bash
# Port is already in use, kill the process or use different port
# See "Port already in use" section above
```

### "Cannot read property 'x' of undefined"

```bash
# Check that required environment variables are set
cat .env

# Verify API responses are in expected format
curl http://localhost:3001/api/health
```

### "CORS policy error"

```bash
# 1. Check CORS configuration in server/src/app.js

# 2. Ensure origin is whitelisted
# Should include http://localhost:5173 for dev

# 3. Verify credentials are being sent if needed
fetch(url, { credentials: 'include' })
```

## 📞 Still Having Issues?

If none of these solutions work:

1. **Check the logs:**
   ```bash
   # Server logs
   cd server && npm run dev

   # Client logs
   # Open browser console (F12)

   # System logs
   tail -f /var/log/syslog
   ```

2. **Get system info:**
   ```bash
   node --version
   npm --version
   psql --version
   redis-cli --version
   ```

3. **Create a minimal reproduction:**
   - Note exact steps to reproduce
   - Collect error messages and stack traces
   - Check browser/server console logs

4. **Report the issue:**
   - GitHub Issues: https://github.com/redinc23/mangu_publishing-site/issues
   - Include system info, logs, and reproduction steps
   - Tag with `beta` and `bug` labels

## 📚 Useful Commands

```bash
# Full reset (nuclear option)
rm -rf node_modules package-lock.json client/node_modules client/dist server/node_modules
npm install
cd client && npm install
cd ../server && npm install

# Check all services are running
./test-setup.sh

# View all environment variables
printenv | grep MANGU

# Monitor logs in real-time
tail -f server/logs/app.log

# Database queries
psql mangu_db -c "SELECT COUNT(*) FROM books;"

# Redis status
redis-cli INFO
```

Last updated: 2025-11-24
