# Daily Development Workflow

Quick reference for getting started each day.

---

## 🚀 Quick Start (Every Terminal Session)

```bash
# 1. Load credentials (REQUIRED for git operations)
source scripts/credentials/local.sh

# 2. Verify services are running
brew services list | grep -E "postgresql|redis"

# 3. Start backend services if needed
brew services start postgresql@16
brew services start redis

# 4. In separate terminal: Start API server
npm --prefix server run dev
# → API running at http://localhost:3001

# 5. In another terminal: Start frontend
npm --prefix client run dev
# → Frontend at http://localhost:5173
# → Vite auto-proxies /api to the backend
```

---

## 🔧 Common Commands

### Credentials
```bash
# Load all credentials
source scripts/credentials/local.sh

# Verify credentials loaded
echo $GITHUB_TOKEN  # Should show your token

# Check if you need to load credentials
./scripts/check_credentials.sh
```

### Development
```bash
# Start everything (after loading credentials)
brew services start postgresql@16  # PostgreSQL database
brew services start redis          # Redis cache
npm --prefix server run dev       # API server
npm --prefix client run dev       # Frontend dev server
```

### Git Operations
```bash
# Always load credentials first!
source scripts/credentials/local.sh

git status
git add .
git commit -m "your message"
git push
```

### Database
```bash
# Connect to PostgreSQL
psql -d mangu_db

# Check service status
brew services list | grep postgresql

# Start PostgreSQL if not running
brew services start postgresql@16

# Run migrations (if you have them)
npm --prefix server run migrate

# Seed data (if you have seed scripts)
npm --prefix server run seed
```

### Redis
```bash
# Check Redis status
brew services list | grep redis

# Start Redis if not running
brew services start redis

# Test Redis connection
redis-cli ping

# Connect to Redis CLI
redis-cli
```

---

## ⚠️ Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3001 (server)
lsof -ti:3001 | xargs kill -9

# Same for port 5173 (client)
lsof -ti:5173 | xargs kill -9
```

### Credentials Not Loaded
```bash
# Symptom: git push asks for password
# Solution:
source scripts/credentials/local.sh
git push
```

### Services Not Running
```bash
# Check service status
brew services list

# Start PostgreSQL
brew services start postgresql@16

# Start Redis
brew services start redis

# Verify services are running
brew services list | grep -E "postgresql|redis"
```

### Dependencies Out of Date
```bash
# Server
npm --prefix server install

# Client
npm --prefix client install
```

---

## 🎯 One-Time Setup Tasks

### First Time Only
- [x] Created `scripts/credentials/local.sh`
- [ ] **TODO: Rotate GitHub token** (see `URGENT_TOKEN_ROTATION.md`)
- [ ] Add AWS credentials to `local.sh`
- [ ] Add DeepSeek API key to `local.sh`

### After Rotating GitHub Token
1. Get new token from https://github.com/settings/tokens
2. Edit `scripts/credentials/local.sh`
3. Replace old token with new one
4. Test: `source scripts/credentials/local.sh && git fetch`
5. ✅ Done!

---

## 📍 Service URLs

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:5173 | Vite dev server |
| API | http://localhost:3001 | Express server |
| API Health | http://localhost:3001/api/health | Check if API is up |
| Database | localhost:5432 | PostgreSQL |
| Redis | localhost:6379 | Redis cache |

---

## 💡 Pro Tips

1. **Create terminal aliases** (add to `~/.zshrc` or `~/.bashrc`):
   ```bash
   alias mangu-creds='source ~/projects/mangu2-publishing/scripts/credentials/local.sh'
   alias mangu-services='brew services start postgresql@16 && brew services start redis'
   alias mangu-server='cd ~/projects/mangu2-publishing && npm --prefix server run dev'
   alias mangu-client='cd ~/projects/mangu2-publishing && npm --prefix client run dev'
   ```

2. **Use tmux or iTerm2 split panes** to run all services in one window

3. **Set up VS Code tasks** for one-click startup

4. **Check services first** - most issues are from PostgreSQL/Redis not running

---

## 🔄 Typical Development Session

```bash
# Terminal 1: Start Services (one-time per session)
brew services start postgresql@16
brew services start redis

# Terminal 2: Backend
cd ~/projects/mangu2-publishing
source scripts/credentials/local.sh
npm --prefix server run dev

# Terminal 3: Frontend
cd ~/projects/mangu2-publishing
npm --prefix client run dev

# Terminal 4: Git / Commands
cd ~/projects/mangu2-publishing
source scripts/credentials/local.sh
# Now do git operations, testing, etc.
```

---

**Last Updated**: October 18, 2025
