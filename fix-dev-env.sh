#!/bin/bash

# fix-dev-env.sh - Comprehensive Script to Fix the MANGU Dev Environment

set -euo pipefail

echo ""
echo "🔧 Starting MANGU Dev Environment Fix Script"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅${NC} $1"; }
warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
error() { echo -e "${RED}❌${NC} $1"; }

# Step 1: Load Credentials
log "Step 1/9: Loading credentials..."
if [ -f "scripts/launch_credentials.sh" ]; then
    source scripts/launch_credentials.sh
    success "Credentials loaded successfully"
else
    warning "launch_credentials.sh not found - skipping credential load"
fi

# Step 2: Verify Prerequisites
log "Step 2/9: Verifying prerequisites..."
command -v node >/dev/null 2>&1 || { error "Node.js not found. Install Node.js 20+."; exit 1; }
command -v yarn >/dev/null 2>&1 || { error "yarn not found. Install yarn."; exit 1; }
command -v psql >/dev/null 2>&1 || { warning "psql not found. Install PostgreSQL 15+."; }
command -v redis-cli >/dev/null 2>&1 || { warning "redis-cli not found. Ensure Redis is installed and running."; }
success "All prerequisites verified"

# Step 3: Install Dependencies
log "Step 3/9: Installing dependencies..."
if ! [ -d "node_modules" ]; then
    yarn install
    success "Root dependencies installed"
else
    warning "Root dependencies already installed"
fi

# Install client dependencies
cd client
if ! [ -d "node_modules" ]; then
    yarn install
    success "Client dependencies installed"
else
    warning "Client dependencies already installed"
fi
cd ..

# Install server dependencies
cd server
if ! [ -d "node_modules" ]; then
    yarn install
    success "Server dependencies installed"
else
    warning "Server dependencies already installed"
fi
cd ..

# Step 4: Set Up Environment Files
log "Step 4/9: Setting up environment files..."
if [ ! -f "server/.env" ]; then
    if [ -f "server/.env.example" ]; then
        cp server/.env.example server/.env
        warning "server/.env created from .env.example. Edit this file to provide database and JWT credentials."
    else
        warning "server/.env.example not found. You may need to create server/.env manually."
    fi
else
    warning "server/.env already exists"
fi

if [ ! -f "client/.env" ]; then
    if [ -f "client/.env.example" ]; then
        cp client/.env.example client/.env
        warning "client/.env created from .env.example. Edit this file to provide API URLs."
    else
        warning "client/.env.example not found. You may need to create client/.env manually."
    fi
else
    warning "client/.env already exists"
fi

# Step 5: Check Database Connectivity
log "Step 5/9: Checking database connectivity..."
if command -v psql >/dev/null 2>&1; then
    if psql -h localhost -U mangu_user -d mangu_db -c "SELECT 1;" >/dev/null 2>&1; then
        success "Database connection verified"
    else
        warning "Database connection failed. Ensure PostgreSQL is running and accessible."
    fi
else
    warning "psql not available - skipping database check"
fi

# Step 6: Check Redis Connectivity
log "Step 6/9: Checking Redis connectivity..."
if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli ping >/dev/null 2>&1; then
        success "Redis connectivity verified"
    else
        warning "Redis connectivity failed. Consider disabling Redis with DISABLE_REDIS=1."
    fi
else
    warning "redis-cli not available - skipping Redis check"
fi

# Step 7: Verify Project Health
log "Step 7/9: Verifying project health..."
if [ -f "./test-setup.sh" ]; then
    chmod +x ./test-setup.sh
    ./test-setup.sh || warning "Some setup tests failed. Review test-setup.sh output."
else
    warning "test-setup.sh not found - skipping health verification"
fi

# Step 8: Start Development Servers
log "Step 8/9: Starting development servers..."
log "Starting servers in background (use Ctrl+C to stop)..."
yarn dev &
DEV_PID=$!

# Graceful Shutdown
trap 'log "Stopping development servers..."; kill $DEV_PID 2>/dev/null || true; exit' EXIT INT TERM

# Step 9: Summary
log "Step 9/9: Final summary..."
sleep 3
success "Development environment setup complete!"
echo ""
echo "🚀 Access points:"
echo "  Client:     http://localhost:5173"
echo "  API:        http://localhost:5000/api"
echo "  Health Check: http://localhost:5000/api/health"
echo ""
echo "📝 Note: Servers are running in the background (PID: $DEV_PID)"
echo "   To stop servers, press Ctrl+C or run: kill $DEV_PID"
echo ""
log "Waiting for servers to start... (Press Ctrl+C to stop)"
wait $DEV_PID



