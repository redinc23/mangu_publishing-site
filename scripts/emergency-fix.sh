#!/bin/bash
# scripts/emergency-fix.sh
# MANGU Emergency Response Protocol v2.0

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}❌ ERROR:${NC} $1" >&2
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

log "🚨 MANGU Emergency Response Protocol v2.0"
log "=========================================="

cd "$(dirname "$0")/../client" || exit 1

# Step 1: Clear all caches
log "🧹 Step 1: Clearing caches..."
rm -rf node_modules/.vite dist .vite .cache .turbo 2>/dev/null || true
success "Caches cleared"

# Step 2: Verify file structure
log "🔍 Step 2: Verifying file structure..."
COMPONENT=${1:-EventDetailsPage}
FILE_PATH="src/pages/${COMPONENT}.jsx"

if [ ! -f "$FILE_PATH" ]; then
    error "Component not found at $FILE_PATH"
    log "Creating missing file..."
    mkdir -p "$(dirname "$FILE_PATH")"
    cat > "$FILE_PATH" << EOF
import React from 'react';
import { useParams } from 'react-router-dom';
import './${COMPONENT}.css';

function ${COMPONENT}() {
  const { id } = useParams();
  
  return (
    <div className="${COMPONENT,,}-page">
      <h1>${COMPONENT}</h1>
      <p>ID: {id}</p>
    </div>
  );
}

export default ${COMPONENT};
EOF
    success "Created missing file"
else
    success "File exists: $FILE_PATH"
fi

# Step 3: Check exports
log "📤 Step 3: Checking exports..."
if grep -q "export default ${COMPONENT}" "$FILE_PATH"; then
    success "Default export found"
else
    error "Missing default export"
    exit 1
fi

# Step 4: Check imports in App.jsx
log "📥 Step 4: Checking imports..."
APP_FILE="src/App.jsx"
if [ -f "$APP_FILE" ] && grep -q "import.*${COMPONENT}" "$APP_FILE"; then
    success "Import found in App.jsx"
else
    warning "Import not found in App.jsx"
fi

# Step 5: Syntax check
log "🔧 Step 5: Syntax validation..."
if node --check "$FILE_PATH" 2>/dev/null; then
    success "Syntax valid"
else
    error "Syntax errors detected"
    node --check "$FILE_PATH"
    exit 1
fi

# Step 6: Restart dev server (optional)
if [ "${2:-}" = "--restart" ]; then
    log "🚀 Step 6: Restarting dev server..."
    pkill -f "vite.*5173" 2>/dev/null || true
    sleep 1
    npm run dev > ../logs/client.log 2>&1 &
    DEV_PID=$!
    echo "$DEV_PID" > ../logs/client.pid 2>/dev/null || true
    success "Dev server started (PID: $DEV_PID)"
fi

log ""
success "Emergency protocol complete!"
log "If issues persist, run: ./scripts/diagnose-imports.sh ${COMPONENT} --nuclear"





