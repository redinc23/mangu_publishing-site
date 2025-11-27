#!/bin/bash

# verify-tool.sh - Comprehensive tool verification script for MANGU Publishing
# Tests all critical endpoints and services to ensure readiness for deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3001}"
HEALTH_ENDPOINT="${BASE_URL}/api/health"
PING_ENDPOINT="${BASE_URL}/api/ping"
READY_ENDPOINT="${BASE_URL}/api/health/ready"
LIVE_ENDPOINT="${BASE_URL}/api/health/live"
METRICS_ENDPOINT="${BASE_URL}/api/health/metrics"
BOOKS_ENDPOINT="${BASE_URL}/api/books"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNED=0

# Logging functions
log() {
    echo -e "${BLUE}[LOG $(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++)) || true
}

fail() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++)) || true
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((TESTS_WARNED++)) || true
}

# Test function wrapper
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local expected_content="${4:-}"
    
    log "Testing $name..."
    
    local response
    local status_code
    
    if response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null); then
        status_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$status_code" -eq "$expected_status" ]; then
            if [ -n "$expected_content" ]; then
                if echo "$body" | grep -q "$expected_content"; then
                    success "$name: Status $status_code and content match"
                    return 0
                else
                    fail "$name: Status OK but content mismatch"
                    return 1
                fi
            else
                success "$name: Status $status_code"
                return 0
            fi
        else
            fail "$name: Expected status $expected_status, got $status_code"
            return 1
        fi
    else
        fail "$name: Failed to connect"
        return 1
    fi
}

# Check if server is running
check_server_running() {
    log "Checking if server is running on $BASE_URL..."
    
    if curl -s --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
        success "Server is reachable at $BASE_URL"
        return 0
    else
        fail "Server is not reachable at $BASE_URL"
        warn "Make sure the server is running: cd server && npm start"
        return 1
    fi
}

# Test health endpoint
test_health_endpoint() {
    log "Testing comprehensive health endpoint..."
    
    local response
    if response=$(curl -s "$HEALTH_ENDPOINT" 2>/dev/null); then
        # Check if response is valid JSON
        if echo "$response" | jq . > /dev/null 2>&1; then
            local status=$(echo "$response" | jq -r '.status // "unknown"')
            local db_status=$(echo "$response" | jq -r '.checks.database.status // "unknown"')
            local redis_status=$(echo "$response" | jq -r '.checks.redis.status // "unknown"')
            
            if [ "$status" = "healthy" ]; then
                success "Health endpoint: Overall status is healthy"
            elif [ "$status" = "degraded" ]; then
                warn "Health endpoint: Status is degraded (some services unavailable)"
            else
                fail "Health endpoint: Status is $status"
            fi
            
            if [ "$db_status" = "healthy" ]; then
                success "Database: Connection healthy"
            elif [ "$db_status" = "unavailable" ]; then
                warn "Database: Not available (may be expected in dev)"
            else
                fail "Database: Status is $db_status"
            fi
            
            if [ "$redis_status" = "healthy" ]; then
                success "Redis: Connection healthy"
            elif [ "$redis_status" = "unavailable" ]; then
                warn "Redis: Not available (may be expected if disabled)"
            else
                warn "Redis: Status is $redis_status"
            fi
            
            # Display full health response
            echo ""
            log "Full health response:"
            echo "$response" | jq .
            return 0
        else
            fail "Health endpoint: Invalid JSON response"
            return 1
        fi
    else
        fail "Health endpoint: Failed to connect"
        return 1
    fi
}

# Test ping endpoint
test_ping_endpoint() {
    test_endpoint "PING endpoint" "$PING_ENDPOINT" 200 "pong"
}

# Test readiness endpoint
test_readiness_endpoint() {
    log "Testing readiness endpoint..."
    
    local response
    if response=$(curl -s "$READY_ENDPOINT" 2>/dev/null); then
        if echo "$response" | jq . > /dev/null 2>&1; then
            local ready=$(echo "$response" | jq -r '.ready // false')
            if [ "$ready" = "true" ]; then
                success "Readiness: Service is ready"
                return 0
            else
                fail "Readiness: Service is not ready"
                return 1
            fi
        else
            fail "Readiness endpoint: Invalid JSON"
            return 1
        fi
    else
        fail "Readiness endpoint: Failed to connect"
        return 1
    fi
}

# Test liveness endpoint
test_liveness_endpoint() {
    log "Testing liveness endpoint..."
    
    local response
    if response=$(curl -s "$LIVE_ENDPOINT" 2>/dev/null); then
        if echo "$response" | jq . > /dev/null 2>&1; then
            local alive=$(echo "$response" | jq -r '.alive // false')
            if [ "$alive" = "true" ]; then
                success "Liveness: Service is alive"
                return 0
            else
                fail "Liveness: Service reports not alive"
                return 1
            fi
        else
            fail "Liveness endpoint: Invalid JSON"
            return 1
        fi
    else
        fail "Liveness endpoint: Failed to connect"
        return 1
    fi
}

# Test metrics endpoint
test_metrics_endpoint() {
    log "Testing metrics endpoint..."
    
    local response
    if response=$(curl -s "$METRICS_ENDPOINT" 2>/dev/null); then
        if echo "$response" | jq . > /dev/null 2>&1; then
            success "Metrics endpoint: Valid JSON response"
            return 0
        else
            fail "Metrics endpoint: Invalid JSON"
            return 1
        fi
    else
        fail "Metrics endpoint: Failed to connect"
        return 1
    fi
}

# Test books API endpoint
test_books_endpoint() {
    log "Testing books API endpoint..."
    
    local response
    if response=$(curl -s "$BOOKS_ENDPOINT" 2>/dev/null); then
        if echo "$response" | jq . > /dev/null 2>&1; then
            success "Books API: Valid JSON response"
            # Check if it's an array
            if echo "$response" | jq 'type' | grep -q "array"; then
                local count=$(echo "$response" | jq 'length')
                log "Books API: Retrieved $count book(s)"
            fi
            return 0
        else
            fail "Books API: Invalid JSON"
            return 1
        fi
    else
        fail "Books API: Failed to connect"
        return 1
    fi
}

# Check required dependencies
check_dependencies() {
    log "Checking required dependencies..."
    
    local missing_deps=()
    
    for cmd in curl jq; do
        if ! command -v "$cmd" > /dev/null 2>&1; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [ ${#missing_deps[@]} -eq 0 ]; then
        success "All required dependencies are installed"
        return 0
    else
        fail "Missing dependencies: ${missing_deps[*]}"
        warn "Install missing dependencies:"
        warn "  macOS: brew install curl jq"
        warn "  Ubuntu/Debian: sudo apt-get install curl jq"
        return 1
    fi
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "🔍 MANGU Publishing Tool Verification"
    echo "=========================================="
    echo ""
    log "Base URL: $BASE_URL"
    echo ""
    
    # Check dependencies first
    if ! check_dependencies; then
        echo ""
        fail "Cannot proceed without required dependencies"
        exit 1
    fi
    
    echo ""
    
    # Check if server is running
    if ! check_server_running; then
        echo ""
        fail "Server is not running. Please start it first."
        exit 1
    fi
    
    echo ""
    echo "----------------------------------------"
    echo "Testing API Endpoints"
    echo "----------------------------------------"
    echo ""
    
    # Run all tests
    test_ping_endpoint
    echo ""
    
    test_health_endpoint
    echo ""
    
    test_readiness_endpoint
    echo ""
    
    test_liveness_endpoint
    echo ""
    
    test_metrics_endpoint
    echo ""
    
    test_books_endpoint
    echo ""
    
    # Summary
    echo "=========================================="
    echo "📊 Test Summary"
    echo "=========================================="
    echo ""
    success "Passed: $TESTS_PASSED"
    [ $TESTS_WARNED -gt 0 ] && warn "Warnings: $TESTS_WARNED"
    [ $TESTS_FAILED -gt 0 ] && fail "Failed: $TESTS_FAILED"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        if [ $TESTS_WARNED -eq 0 ]; then
            success "All checks passed! Tool is ready for deployment."
            exit 0
        else
            warn "Tool is functional but has some warnings. Review above."
            exit 0
        fi
    else
        fail "Some checks failed. Please fix issues before deployment."
        exit 1
    fi
}

# Run main function
main "$@"



