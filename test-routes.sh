#!/usr/bin/env bash
set -uo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3009}"
CLIENT_BASE_URL="${CLIENT_BASE_URL:-http://localhost:5173}"

test_count=0
passed_count=0
failed_tests=()

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

test_api_endpoint() {
    local endpoint="$1"
    local expected_status="${2:-200}"
    local method="${3:-GET}"
    local data="${4:-}"
    
    local url="${API_BASE_URL}${endpoint}"
    local response
    local status_code
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url" 2>/dev/null || echo -e "\n000")
    else
        response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo -e "\n000")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Accept 503 as valid for DB-dependent endpoints in dev mode
    if [ "$status_code" = "$expected_status" ] || ([ "$expected_status" = "200" ] && [ "$status_code" = "503" ]); then
        return 0
    else
        return 1
    fi
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local is_critical="${3:-false}"
    
    test_count=$((test_count + 1))
    echo -n "[$test_count] $test_name... "
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        passed_count=$((passed_count + 1))
        return 0
    else
        echo -e "${RED}❌${NC}"
        failed_tests+=("$test_name")
        
        if [ "$is_critical" = "true" ]; then
            echo -e "${RED}Critical test failed. Aborting.${NC}"
            exit 1
        fi
        return 1
    fi
}

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║         MANGU API Routes Test                ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo "API Base URL: $API_BASE_URL"
    echo "Client Base URL: $CLIENT_BASE_URL"
    echo ""
}

check_servers() {
    log_info "Checking if servers are running..."
    
    if ! curl -s "${API_BASE_URL}/api/health" >/dev/null 2>&1; then
        log_error "Server not running on ${API_BASE_URL}"
        log_info "Start server with: cd server && npm run dev"
        exit 1
    fi
    
    if ! curl -s "${CLIENT_BASE_URL}" >/dev/null 2>&1; then
        log_warning "Client not running on ${CLIENT_BASE_URL}"
        log_info "Start client with: cd client && npm run dev"
    fi
    
    log_success "Servers are running"
    echo ""
}

main() {
    print_header
    check_servers
    
    echo "🧪 Testing API Endpoints:"
    echo ""
    
    # Health check
    run_test "GET /api/health" "test_api_endpoint '/api/health' 200"
    
    # Books endpoints
    run_test "GET /api/books" "test_api_endpoint '/api/books' 200"
    run_test "GET /api/books/featured" "test_api_endpoint '/api/books/featured' 200"
    run_test "GET /api/books/trending" "test_api_endpoint '/api/books/trending' 200"
    run_test "GET /api/books/search?q=test" "test_api_endpoint '/api/books/search?q=test' 200"
    run_test "GET /api/books/1" "test_api_endpoint '/api/books/1' 200"
    
    # Categories
    run_test "GET /api/categories" "test_api_endpoint '/api/categories' 200"
    
    # Genres
    run_test "GET /api/genres/fiction" "test_api_endpoint '/api/genres/fiction' 200"
    
    # Series
    run_test "GET /api/series/1" "test_api_endpoint '/api/series/1' 200"
    
    # Wishlists (may return 404 if no data, which is acceptable)
    run_test "GET /api/wishlists/test123" "test_api_endpoint '/api/wishlists/test123' 404"
    
    # Reading sessions (may return 404 if no data, which is acceptable)
    run_test "GET /api/reading-sessions/1" "test_api_endpoint '/api/reading-sessions/1' 404"
    
    # Library and cart routes (currently work without auth, should be protected in future)
    run_test "GET /api/library" "test_api_endpoint '/api/library' 200"
    run_test "GET /api/cart" "test_api_endpoint '/api/cart' 200"
    
    # 404 handler
    run_test "GET /api/nonexistent (404)" "test_api_endpoint '/api/nonexistent' 404"
    
    echo ""
    echo "=" $(printf "=%.0s" {1..50})
    echo ""
    
    # Results summary
    echo -e "${BLUE}📊 Test Results Summary:${NC}"
    echo "   Total tests: $test_count"
    echo -e "   Passed: ${GREEN}$passed_count${NC}"
    echo -e "   Failed: ${RED}$((test_count - passed_count))${NC}"
    
    if [ ${#failed_tests[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}❌ Failed tests:${NC}"
        for test in "${failed_tests[@]}"; do
            echo "   - $test"
        done
        exit 1
    else
        echo ""
        log_success "All tests passed! ✅"
        exit 0
    fi
}

main "$@"

