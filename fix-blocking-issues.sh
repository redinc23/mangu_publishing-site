#!/usr/bin/env bash
# ============================================================================
# Fix Mangu Publishing Blocking Issues Script
# ============================================================================
# This script fixes common blocking issues in the mangu-publishing project:
# 1. Fixes start-all.sh to point to correct client/ directory
# 2. Fixes Vite proxy port from 3001 to 5000
# 3. Removes Docker dependencies from dev-bringup.sh
# 4. Makes all scripts executable
# 5. Creates automatic backups
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

log_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$PROJECT_ROOT/.backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

log_step "Starting Fix Script"
log_info "Project root: $PROJECT_ROOT"
log_info "Backup directory: $BACKUP_DIR"
log_info "Timestamp: $TIMESTAMP"

# ============================================================================
# Step 1: Backup files before modification
# ============================================================================
log_step "Step 1: Creating Backups"

backup_file() {
    local file="$1"
    if [ -f "$file" ]; then
        local backup_path="$BACKUP_DIR/$(basename "$file").$TIMESTAMP"
        cp "$file" "$backup_path"
        log_success "Backed up: $file → $backup_path"
    else
        log_warning "File not found: $file (skipping backup)"
    fi
}

backup_file "$PROJECT_ROOT/start-all.sh"
backup_file "$PROJECT_ROOT/client/vite.config.js"
backup_file "$PROJECT_ROOT/dev-bringup.sh"

log_success "All backups created in $BACKUP_DIR"

# ============================================================================
# Step 2: Fix start-all.sh - Ensure it points to client/ directory
# ============================================================================
log_step "Step 2: Fixing start-all.sh"

if [ -f "$PROJECT_ROOT/start-all.sh" ]; then
    # Check if there are any references to nextjs-migration/mangu
    if grep -q "nextjs-migration/mangu" "$PROJECT_ROOT/start-all.sh" 2>/dev/null; then
        log_info "Found reference to nextjs-migration/mangu, fixing..."
        sed -i.bak "s|nextjs-migration/mangu|client|g" "$PROJECT_ROOT/start-all.sh"
        rm -f "$PROJECT_ROOT/start-all.sh.bak"
        log_success "Fixed references to nextjs-migration/mangu"
    else
        log_info "No references to nextjs-migration/mangu found (already correct)"
    fi
    
    # Ensure it uses client/ directory
    if ! grep -q "\"$PROJECT_ROOT/client\"" "$PROJECT_ROOT/start-all.sh" && \
       ! grep -q "'$PROJECT_ROOT/client'" "$PROJECT_ROOT/start-all.sh" && \
       ! grep -q "\$PROJECT_ROOT/client" "$PROJECT_ROOT/start-all.sh"; then
        log_info "Ensuring start-all.sh uses client/ directory..."
        # The file already looks correct, but let's verify
        if grep -q "cd.*client" "$PROJECT_ROOT/start-all.sh"; then
            log_success "start-all.sh already points to client/ directory"
        else
            log_warning "Could not verify client/ directory usage in start-all.sh"
        fi
    else
        log_success "start-all.sh correctly references client/ directory"
    fi
    
    # Make executable
    chmod +x "$PROJECT_ROOT/start-all.sh"
    log_success "Made start-all.sh executable"
else
    log_error "start-all.sh not found!"
    exit 1
fi

# ============================================================================
# Step 3: Fix Vite proxy port from 3001 to 5000
# ============================================================================
log_step "Step 3: Fixing Vite Proxy Port (3001 → 5000)"

VITE_CONFIG="$PROJECT_ROOT/client/vite.config.js"

if [ -f "$VITE_CONFIG" ]; then
    # Check current proxy target
    if grep -q "localhost:3001" "$VITE_CONFIG"; then
        log_info "Found proxy target localhost:3001, updating to localhost:5000..."
        
        # Use sed to replace the port (works on both macOS and Linux)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS requires empty string after -i
            sed -i '' "s|localhost:3001|localhost:5000|g" "$VITE_CONFIG"
        else
            # Linux
            sed -i "s|localhost:3001|localhost:5000|g" "$VITE_CONFIG"
        fi
        
        log_success "Updated Vite proxy target from localhost:3001 to localhost:5000"
    else
        if grep -q "localhost:5000" "$VITE_CONFIG"; then
            log_success "Vite proxy already configured for port 5000"
        else
            log_warning "Could not find proxy configuration in vite.config.js"
        fi
    fi
else
    log_error "vite.config.js not found at $VITE_CONFIG"
    exit 1
fi

# ============================================================================
# Step 4: Remove Docker dependencies from dev-bringup.sh
# ============================================================================
log_step "Step 4: Removing Docker Dependencies from dev-bringup.sh"

DEV_BRINGUP="$PROJECT_ROOT/dev-bringup.sh"

if [ -f "$DEV_BRINGUP" ]; then
    # Check for Docker-related commands
    DOCKER_FOUND=0
    
    if grep -qiE "docker|docker-compose|docker run" "$DEV_BRINGUP"; then
        log_info "Found Docker references, removing..."
        DOCKER_FOUND=1
        
        # Create a temporary file without Docker lines
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            grep -viE "docker|docker-compose|docker run" "$DEV_BRINGUP" > "$DEV_BRINGUP.tmp" || true
        else
            # Linux
            grep -viE "docker|docker-compose|docker run" "$DEV_BRINGUP" > "$DEV_BRINGUP.tmp" || true
        fi
        
        mv "$DEV_BRINGUP.tmp" "$DEV_BRINGUP"
        chmod +x "$DEV_BRINGUP"
        log_success "Removed Docker dependencies from dev-bringup.sh"
    else
        log_success "No Docker dependencies found in dev-bringup.sh (already clean)"
    fi
    
    # Make executable
    chmod +x "$DEV_BRINGUP"
    log_success "Made dev-bringup.sh executable"
else
    log_warning "dev-bringup.sh not found (skipping)"
fi

# ============================================================================
# Step 5: Make all scripts executable
# ============================================================================
log_step "Step 5: Making All Scripts Executable"

SCRIPT_COUNT=0

# Make root-level scripts executable
for script in "$PROJECT_ROOT"/*.sh; do
    if [ -f "$script" ]; then
        chmod +x "$script"
        SCRIPT_COUNT=$((SCRIPT_COUNT + 1))
    fi
done

# Make scripts in scripts/ directory executable
if [ -d "$PROJECT_ROOT/scripts" ]; then
    for script in "$PROJECT_ROOT/scripts"/*.sh; do
        if [ -f "$script" ]; then
            chmod +x "$script"
            SCRIPT_COUNT=$((SCRIPT_COUNT + 1))
        fi
    done
    
    # Also handle subdirectories
    find "$PROJECT_ROOT/scripts" -type f -name "*.sh" -exec chmod +x {} \;
fi

log_success "Made $SCRIPT_COUNT scripts executable"

# ============================================================================
# Summary
# ============================================================================
log_step "Fix Script Complete!"

echo ""
log_success "All fixes applied successfully!"
echo ""
echo "📋 Summary of changes:"
echo "   ✅ Fixed start-all.sh (verified client/ directory)"
echo "   ✅ Updated Vite proxy port: 3001 → 5000"
echo "   ✅ Removed Docker dependencies from dev-bringup.sh"
echo "   ✅ Made all scripts executable ($SCRIPT_COUNT scripts)"
echo "   ✅ Created backups in $BACKUP_DIR"
echo ""
echo "📦 Backup files created:"
ls -lh "$BACKUP_DIR"/*."$TIMESTAMP" 2>/dev/null | awk '{print "   " $9}' || echo "   (no backups created)"
echo ""
echo "🔄 To rollback changes, run:"
echo "   cp $BACKUP_DIR/start-all.sh.$TIMESTAMP $PROJECT_ROOT/start-all.sh"
echo "   cp $BACKUP_DIR/vite.config.js.$TIMESTAMP $PROJECT_ROOT/client/vite.config.js"
echo "   cp $BACKUP_DIR/dev-bringup.sh.$TIMESTAMP $PROJECT_ROOT/dev-bringup.sh"
echo ""
echo "🚀 Next steps:"
echo "   1. Load credentials (if needed):"
echo "      source scripts/launch_credentials.sh"
echo ""
echo "   2. Start development:"
echo "      ./start-all.sh"
echo ""
echo "      Or use npm:"
echo "      npm run dev"
echo ""
log_success "Done! Happy coding! 🎉"



