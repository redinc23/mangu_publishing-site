#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║        MANGU Development Environment         ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_port() {
    local port=$1
    local service=$2
    
    if lsof -i:"$port" >/dev/null 2>&1; then
        log_error "Port $port is already in use (needed for $service)"
        echo "  Kill process: lsof -ti:$port | xargs kill -9"
        return 1
    fi
    return 0
}

wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    local max_attempts=${4:-30}
    local attempt=0
    
    log_info "Waiting for $service to be ready..."
    
    while [ $attempt -lt $max_attempts ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            log_success "$service is ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    echo ""
    log_warning "$service didn't start within expected time"
    return 1
}

main() {
    print_banner
    
    # Check for required tools
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is required but not installed"
        echo "  Install from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        log_error "Docker Compose is required but not installed"
        echo "  Usually included with Docker Desktop"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        echo "  Start Docker Desktop or run: sudo systemctl start docker"
        exit 1
    fi
    
    # Check critical ports
    local ports_ok=true
    if ! check_port 5432 "PostgreSQL"; then ports_ok=false; fi
    if ! check_port 6379 "Redis"; then ports_ok=false; fi
    if ! check_port 8080 "Adminer"; then ports_ok=false; fi
    
    if [ "$ports_ok" = false ]; then
        echo ""
        echo "Resolve port conflicts and try again."
        exit 1
    fi
    
    log_info "Starting development services..."
    
    # Start services with proper ordering
    if ! docker-compose up -d postgres redis; then
        log_error "Failed to start core services"
        exit 1
    fi
    
    # Wait for core services
    wait_for_service localhost 5432 "PostgreSQL"
    wait_for_service localhost 6379 "Redis"
    
    # Start additional services
    if ! docker-compose up -d adminer mailhog; then
        log_warning "Failed to start additional services (non-critical)"
    fi
    
    # Verify services are healthy
    log_info "Verifying service health..."
    
    # Test PostgreSQL
    if docker-compose exec postgres pg_isready -U mangu_user >/dev/null 2>&1; then
        log_success "PostgreSQL is healthy"
    else
        log_warning "PostgreSQL health check failed"
    fi
    
    # Test Redis
    if docker-compose exec redis redis-cli ping >/dev/null 2>&1; then
        log_success "Redis is healthy"
    else
        log_warning "Redis health check failed"
    fi
    
    echo ""
    log_success "Development environment is ready!"
    echo ""
    echo -e "${BLUE}🔗 Access Points:${NC}"
    echo "   Frontend:  http://localhost:5173"
    echo "   Backend:   http://localhost:5000"
    echo "   Database:  http://localhost:8080 (Adminer)"
    echo "   Mail:      http://localhost:8025 (MailHog)"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "   1. Terminal 1: cd client && npm run dev"
    echo "   2. Terminal 2: cd server && npm run dev"
    echo ""
    echo -e "${BLUE}🛠️  Management Commands:${NC}"
    echo "   Stop:     docker-compose down"
    echo "   Logs:     docker-compose logs -f [service]"
    echo "   Reset:    docker-compose down -v && ./start-dev.sh"
    echo ""
    echo -e "${YELLOW}💡 Tip: Run './test-setup.sh' to verify everything is working${NC}"
}

main "$@"
