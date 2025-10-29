#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

test_count=0
passed_count=0
failed_tests=()

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

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

test_api_endpoint() {
    local endpoint="$1"
    local expected_status="${2:-200}"
    
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000$endpoint" 2>/dev/null || echo "000")
    
    [ "$response" = "$expected_status" ]
}

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║              MANGU Setup Test                ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"
}

main() {
    print_header
    
    log_info "Running comprehensive setup verification..."
    echo ""
    
    # System dependencies
    echo "🔧 System Dependencies:"
    run_test "Node.js installed" "command -v node" true
    run_test "npm installed" "command -v npm" true
    run_test "Git installed" "command -v git" true
    
    if command -v node >/dev/null 2>&1; then
        local node_version
        node_version=$(node --version | sed 's/v//')
        local major_version
        major_version=$(echo "$node_version" | cut -d'.' -f1)
        run_test "Node.js version 18+" "[ $major_version -ge 18 ]" true
    fi
    
    echo ""
    
    # Project structure
    echo "📁 Project Structure:"
    run_test "Client directory exists" "test -d client" true
    run_test "Server directory exists" "test -d server" true
    run_test "Infrastructure directory exists" "test -d infrastructure"
    run_test "Tests directory exists" "test -d tests"
    run_test "Docs directory exists" "test -d docs"
    
    echo ""
    
    # Configuration files
    echo "⚙️  Configuration Files:"
    run_test "Client package.json exists" "test -f client/package.json" true
    run_test "Server package.json exists" "test -f server/package.json" true
    run_test "Server .env file exists" "test -f server/.env" true
    run_test "Client .env file exists" "test -f client/.env" true
    run_test "Database schema exists" "test -f server/src/database/init.sql"
    
    echo ""
    
    # Dependencies
    echo "📦 Dependencies:"
    run_test "Client node_modules exists" "test -d client/node_modules"
    run_test "Server node_modules exists" "test -d server/node_modules"
    
    if [ -d "client/node_modules" ]; then
        run_test "React installed" "test -d client/node_modules/react"
        run_test "Vite installed" "test -d client/node_modules/vite"
    fi
    
    if [ -d "server/node_modules" ]; then
        run_test "Express installed" "test -d server/node_modules/express"
        run_test "PostgreSQL driver installed" "test -d server/node_modules/pg"
    fi
    
    echo ""
    
    # Database services (if running)
    echo "💾 Database Services:"
    if command -v psql >/dev/null 2>&1; then
        run_test "PostgreSQL client installed" "command -v psql"
        if psql -h localhost -U mangu_user -d mangu_db -c '\q' 2>/dev/null; then
            run_test "PostgreSQL accepting connections" "psql -h localhost -U mangu_user -d mangu_db -c '\q'"
        else
            log_warning "PostgreSQL not accepting connections (ensure PostgreSQL is running)"
        fi
    else
        log_warning "PostgreSQL client not installed"
    fi
    
    if command -v redis-cli >/dev/null 2>&1; then
        run_test "Redis client installed" "command -v redis-cli"
        if redis-cli ping >/dev/null 2>&1; then
            run_test "Redis responding to ping" "redis-cli ping"
        else
            log_warning "Redis not responding (ensure Redis is running, or set DISABLE_REDIS=1)"
        fi
    else
        log_warning "Redis client not installed"
    fi
    
    echo ""
    
    # API tests (if server is running)
    echo "🌐 API Tests:"
    if curl -s "http://localhost:5000/api/health" >/dev/null 2>&1; then
        run_test "Server health endpoint responds" "test_api_endpoint '/api/health' 200"
        run_test "Books featured endpoint works" "test_api_endpoint '/api/books/featured'"
        run_test "Books trending endpoint works" "test_api_endpoint '/api/books/trending'"
        run_test "Categories endpoint works" "test_api_endpoint '/api/categories'"
        run_test "404 handler works" "test_api_endpoint '/api/nonexistent' 404"
    else
        log_warning "Server not running on port 5000 (start with: cd server && npm run dev)"
    fi
    
    echo ""
    
    # Frontend tests (if running)
    echo "🖥️  Frontend Tests:"
    if curl -s "http://localhost:5173" >/dev/null 2>&1; then
        run_test "Frontend responds" "curl -s http://localhost:5173 | grep -q 'MANGU'"
    else
        log_warning "Frontend not running on port 5173 (start with: cd client && npm run dev)"
    fi
    
    echo ""
    
    # Security checks
    echo "🔒 Security Checks:"
    run_test ".env files not in git" "! git ls-files | grep -q '\.env
    "
    run_test "JWT secret is secure" "test \$(grep JWT_SECRET server/.env | cut -d= -f2 | wc -c) -gt 32"
    
    # Git repository
    echo ""
    echo "📊 Git Repository:"
    run_test "Git repository initialized" "test -d .git"
    if [ -d ".git" ]; then
        run_test "Initial commit exists" "git log --oneline | wc -l | grep -q '^[1-9]'"
        run_test ".gitignore exists" "test -f .gitignore"
    fi
    
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
    fi
    
    echo ""
    
    if [ $passed_count -eq $test_count ]; then
        log_success "🎉 All tests passed! Your MANGU setup is perfect!"
        echo ""
        echo -e "${BLUE}🚀 Ready to start development:${NC}"
        echo "   1. ./start-all.sh              # Start both client and server"
        echo "   2. cd client && npm run dev    # Start frontend only"
        echo "   3. cd server && npm run dev    # Start backend only"
        
    elif [ $((test_count - passed_count)) -le 3 ]; then
        log_warning "⚠️  Setup is mostly ready with minor issues"
        echo ""
        echo -e "${BLUE}🔧 Recommended actions:${NC}"
        echo "   - Review failed tests above"
        echo "   - Most issues are non-critical"
        echo "   - You can still start development"
        
    else
        log_error "❌ Setup has significant issues"
        echo ""
        echo -e "${BLUE}🔧 Required actions:${NC}"
        echo "   - Fix critical failures (marked above)"
        echo "   - Re-run this test after fixes"
        echo "   - Check setup documentation"
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}📖 Useful commands:${NC}"
    echo "   Test again:       ./test-setup.sh"
    echo "   Start all:        ./start-all.sh"
    echo "   Start client:     ./start-client.sh"
    echo "   Start server:     ./start-server.sh"
    echo "   Health check:     curl http://localhost:5000/api/health"
}

main "$@"
