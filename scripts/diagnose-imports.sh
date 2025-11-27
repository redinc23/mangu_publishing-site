#!/bin/bash
# scripts/diagnose-imports.sh
# Comprehensive Component Diagnostic Suite

set -euo pipefail

COMPONENT=${1:-EventDetailsPage}
NUCLEAR=${2:-false}
VERBOSE=${3:-false}

# Diagnostic report
REPORT_FILE="diagnostic-report-${COMPONENT}-$(date +%Y%m%d-%H%M%S).json"
REPORT_DATA=()

log() {
    echo "🔍 $1"
    REPORT_DATA+=("$1")
}

check_file_exists() {
    local file="$1"
    if [ -f "$file" ]; then
        local size=$(wc -l < "$file")
        local bytes=$(wc -c < "$file")
        log "✅ File exists: $file ($size lines, $bytes bytes)"
        return 0
    else
        log "❌ File NOT found: $file"
        return 1
    fi
}

check_exports() {
    local file="$1"
    local default_export=$(grep -n "export default" "$file" | head -1 || echo "")
    local named_exports=$(grep -n "export const\|export function\|export class" "$file" | wc -l)
    
    if [ -n "$default_export" ]; then
        log "✅ Default export found at: $default_export"
    else
        log "❌ No default export found"
    fi
    
    log "📊 Named exports: $named_exports"
}

check_imports() {
    local component="$1"
    local app_file="src/App.jsx"
    
    if [ ! -f "$app_file" ]; then
        log "❌ App.jsx not found"
        return
    fi
    
    local import_line=$(grep -n "import.*$component" "$app_file" | head -1 || echo "")
    if [ -n "$import_line" ]; then
        log "✅ Import found: $import_line"
    else
        log "❌ Import NOT found in App.jsx"
    fi
    
    # Check route usage
    local route_line=$(grep -n "path.*events.*$component\|element.*<$component" "$app_file" | head -1 || echo "")
    if [ -n "$route_line" ]; then
        log "✅ Route configured: $route_line"
    else
        log "⚠️  Route not found"
    fi
}

check_syntax() {
    local file="$1"
    if node --check "$file" 2>/dev/null; then
        log "✅ Syntax valid"
        return 0
    else
        log "❌ Syntax errors detected"
        node --check "$file" 2>&1 | head -5
        return 1
    fi
}

check_dependencies() {
    log "📦 Checking dependencies..."
    local file="$1"
    local imports=$(grep -o "import.*from ['\"].*['\"]" "$file" | sed "s/import.*from ['\"]//;s/['\"]//" || echo "")
    
    for imp in $imports; do
        if [[ "$imp" == ./* ]] || [[ "$imp" == ../* ]]; then
            local resolved="src/${imp#./}"
            if [ -f "${resolved}.jsx" ] || [ -f "${resolved}.js" ] || [ -f "${resolved}/index.jsx" ]; then
                log "  ✅ $imp"
            else
                log "  ❌ $imp (not found)"
            fi
        fi
    done
}

generate_report() {
    cat > "$REPORT_FILE" << EOF
{
  "component": "$COMPONENT",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "diagnostics": [
$(printf '    "%s",\n' "${REPORT_DATA[@]}" | sed '$s/,$//')
  ],
  "recommendations": [
    "Run 'npm run lint' to check code quality",
    "Run 'npm test' to verify functionality",
    "Check browser console for runtime errors"
  ]
}
EOF
    log "📄 Report saved: $REPORT_FILE"
}

# Main execution
log "🔍 MANGU Diagnostic Suite"
log "========================="
log "Component: $COMPONENT"
log ""

cd "$(dirname "$0")/../client" || exit 1

FILE_PATH="src/pages/${COMPONENT}.jsx"

# Run checks
check_file_exists "$FILE_PATH" || exit 1
check_exports "$FILE_PATH"
check_imports "$COMPONENT"
check_syntax "$FILE_PATH"
check_dependencies "$FILE_PATH"

# Nuclear option
if [ "$NUCLEAR" = "--nuclear" ] || [ "$NUCLEAR" = "true" ]; then
    log ""
    log "💥 NUCLEAR OPTION ENGAGED"
    log "========================="
    read -p "⚠️  This will remove all node_modules. Continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Removing node_modules..."
        rm -rf node_modules package-lock.json
        log "Reinstalling dependencies..."
        npm install
        log "✅ Nuclear option complete"
    fi
fi

generate_report

log ""
log "📋 Diagnostic Complete"
log "View full report: cat $REPORT_FILE"





