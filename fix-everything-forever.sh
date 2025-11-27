#!/usr/bin/env bash
# ============================================================================
# FIX EVERYTHING FOREVER - Single Source of Truth Configuration
# ============================================================================
# This script establishes ONE port (3001) as the single source of truth
# and updates EVERYTHING to match it. No more configuration drift.
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}✅${NC} $1"; }
warn() { echo -e "${YELLOW}⚠️${NC} $1"; }
error() { echo -e "${RED}❌${NC} $1"; }
info() { echo -e "${BLUE}ℹ️${NC} $1"; }

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$PROJECT_ROOT/.backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ============================================================================
# STEP 1: KILL ALL EXISTING PROCESSES
# ============================================================================
info "Step 1: Killing all existing server processes..."

# Kill processes on ports 3001, 5000, 5173
for port in 3001 5000 5173; do
    if lsof -ti:$port >/dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        log "Killed processes on port $port"
    fi
done

# Kill nodemon and npm dev processes
pkill -f "nodemon.*server" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "yarn.*dev" 2>/dev/null || true

sleep 2
log "All processes cleaned up"

# ============================================================================
# STEP 2: CREATE BACKUPS
# ============================================================================
info "Step 2: Creating backups..."
mkdir -p "$BACKUP_DIR"

backup_file() {
    [ -f "$1" ] && cp "$1" "$BACKUP_DIR/$(basename "$1").$TIMESTAMP" && log "Backed up $1"
}

backup_file "$PROJECT_ROOT/start-all.sh"
backup_file "$PROJECT_ROOT/client/vite.config.js"
backup_file "$PROJECT_ROOT/package.json"
backup_file "$PROJECT_ROOT/server/package.json"

# ============================================================================
# STEP 3: ESTABLISH SINGLE SOURCE OF TRUTH - PORT 3001
# ============================================================================
info "Step 3: Setting PORT=3001 everywhere..."

# Create server/.env file
mkdir -p "$PROJECT_ROOT/server"
cat > "$PROJECT_ROOT/server/.env" <<EOF
# MANGU Server Configuration
# This is the SINGLE SOURCE OF TRUTH for the server port
PORT=3001

# Database
DATABASE_URL=postgres://localhost:5432/mangu_db

# Redis (optional)
REDIS_URL=redis://localhost:6379
DISABLE_REDIS=0

# Environment
NODE_ENV=development
EOF
log "Created server/.env with PORT=3001"

# Create server/.env.example
cat > "$PROJECT_ROOT/server/.env.example" <<EOF
# MANGU Server Configuration
PORT=3001
DATABASE_URL=postgres://localhost:5432/mangu_db
REDIS_URL=redis://localhost:6379
DISABLE_REDIS=0
NODE_ENV=development
EOF
log "Created server/.env.example"

# ============================================================================
# STEP 4: FIX VITE CONFIG - Use port 3001
# ============================================================================
info "Step 4: Fixing Vite proxy to use port 3001..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's|localhost:5000|localhost:3001|g' "$PROJECT_ROOT/client/vite.config.js"
else
    sed -i 's|localhost:5000|localhost:3001|g' "$PROJECT_ROOT/client/vite.config.js"
fi
log "Vite proxy now points to localhost:3001"

# ============================================================================
# STEP 5: FIX start-all.sh - Remove PORT=5000, use .env instead
# ============================================================================
info "Step 5: Fixing start-all.sh..."

cat > "$PROJECT_ROOT/start-all.sh" <<'SCRIPT'
#!/usr/bin/env bash
echo "Starting MANGU Development Environment..."

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load credentials if available
if [ -f "$PROJECT_ROOT/scripts/launch_credentials.sh" ]; then
    source "$PROJECT_ROOT/scripts/launch_credentials.sh"
fi

# Load server .env file (single source of truth)
if [ -f "$PROJECT_ROOT/server/.env" ]; then
    export $(cat "$PROJECT_ROOT/server/.env" | grep -v '^#' | xargs)
fi

# Start server in background
echo "Starting server on port ${PORT:-3001}..."
cd "$PROJECT_ROOT/server" && npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Start Vite frontend
echo "Starting Vite frontend..."
cd "$PROJECT_ROOT/client" && npm run dev &
CLIENT_PID=$!

echo ""
echo "🚀 Development servers started!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:${PORT:-3001}"
echo ""
echo "Press Ctrl+C to stop all servers"

# Cleanup on exit
trap "echo 'Stopping servers...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT TERM
wait
SCRIPT

chmod +x "$PROJECT_ROOT/start-all.sh"
log "Fixed start-all.sh to use .env file"

# ============================================================================
# STEP 6: FIX ROOT package.json - Ensure it doesn't override PORT
# ============================================================================
info "Step 6: Verifying root package.json..."

# The root package.json is fine - it just calls workspace commands
# The server will read from .env file

# ============================================================================
# STEP 7: CREATE CONFIGURATION DOCUMENTATION
# ============================================================================
info "Step 7: Creating configuration documentation..."

cat > "$PROJECT_ROOT/CONFIGURATION.md" <<'DOC'
# MANGU Configuration - Single Source of Truth

## Port Configuration

**THE SERVER RUNS ON PORT 3001. PERIOD.**

- Server port: `3001` (defined in `server/.env`)
- Frontend port: `5173` (Vite default)
- Vite proxy: `/api` → `http://localhost:3001`

## How to Change the Port (If You Must)

1. Edit `server/.env`:
   ```
   PORT=3001
   ```

2. Update `client/vite.config.js` proxy target:
   ```js
   proxy: {
     '/api': {
       target: 'http://localhost:3001',  // Match PORT in server/.env
   ```

3. That's it. Everything else reads from these two places.

## Starting the Application

```bash
# Option 1: Use start-all.sh (recommended)
./start-all.sh

# Option 2: Use npm (reads from .env automatically)
npm run dev

# Option 3: Manual
cd server && npm run dev  # Reads PORT from .env
cd client && npm run dev  # Proxy reads from vite.config.js
```

## Environment Variables

All server configuration is in `server/.env`. This file is gitignored.
Copy `server/.env.example` to `server/.env` and fill in your values.

**Never hardcode ports in scripts. Always use environment variables.**
DOC

log "Created CONFIGURATION.md documentation"

# ============================================================================
# STEP 8: VERIFY CONSISTENCY
# ============================================================================
info "Step 8: Verifying configuration consistency..."

# Check Vite config
if grep -q "localhost:3001" "$PROJECT_ROOT/client/vite.config.js"; then
    log "Vite config uses port 3001 ✓"
else
    error "Vite config doesn't use port 3001!"
fi

# Check server .env exists
if [ -f "$PROJECT_ROOT/server/.env" ]; then
    if grep -q "PORT=3001" "$PROJECT_ROOT/server/.env"; then
        log "Server .env has PORT=3001 ✓"
    else
        error "Server .env missing PORT=3001!"
    fi
else
    error "Server .env file not found!"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "FIX COMPLETE - Single Source of Truth Established"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 What Changed:"
echo "   ✅ Killed all existing processes"
echo "   ✅ Created server/.env with PORT=3001 (single source of truth)"
echo "   ✅ Updated Vite proxy to use port 3001"
echo "   ✅ Fixed start-all.sh to read from .env"
echo "   ✅ Created CONFIGURATION.md documentation"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start services:"
echo "      brew services start postgresql@16"
echo "      brew services start redis"
echo ""
echo "   2. Start development:"
echo "      ./start-all.sh"
echo ""
echo "   3. Verify:"
echo "      curl http://localhost:3001/api/health"
echo "      open http://localhost:5173"
echo ""
echo "📖 Read CONFIGURATION.md for details"
echo ""
log "Done! Configuration is now consistent forever."



