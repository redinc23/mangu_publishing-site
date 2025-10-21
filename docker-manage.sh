#!/bin/bash

# MANGU Publishing Docker Management Script
# This script helps manage Docker services for the MANGU publishing platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
}

# Function to start services
start_services() {
    print_status "Starting MANGU publishing services..."
    check_docker
    
    # Start base services
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check service status
    if docker ps | grep -q "mangu-postgres.*healthy" && docker ps | grep -q "mangu-redis.*healthy"; then
        print_success "All services are running and healthy!"
        print_status "PostgreSQL: localhost:5432"
        print_status "Redis: localhost:6379"
        print_status "Adminer (dev): localhost:8080 (use profile: dev)"
        print_status "MailHog (dev): localhost:8025 (use profile: dev)"
    else
        print_error "Some services failed to start properly. Check logs with: docker logs <container_name>"
        exit 1
    fi
}

# Function to start development services
start_dev() {
    print_status "Starting development services..."
    check_docker
    
    # Start with dev overrides
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    
    # Create dev database if it doesn't exist
    print_status "Setting up development database..."
    docker exec mangu-postgres psql -U postgres -c "CREATE DATABASE mangu_db_dev;" 2>/dev/null || true
    
    print_success "Development services started!"
    print_status "Production DB: localhost:5432"
    print_status "Development DB: localhost:5433"
    print_status "Production Redis: localhost:6379"
    print_status "Development Redis: localhost:6380"
}

# Function to stop services
stop_services() {
    print_status "Stopping MANGU publishing services..."
    docker-compose down
    print_success "Services stopped."
}

# Function to restart services
restart_services() {
    print_status "Restarting MANGU publishing services..."
    stop_services
    start_services
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    echo ""
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep mangu || echo "No MANGU services running"
    echo ""
    
    if docker ps | grep -q mangu-postgres; then
        print_status "Database connectivity test:"
        docker exec mangu-postgres psql -U postgres -d mangu_db -c "SELECT 'PostgreSQL is working!' as status;" 2>/dev/null || print_warning "Database connection failed"
    fi
    
    if docker ps | grep -q mangu-redis; then
        print_status "Redis connectivity test:"
        docker exec mangu-redis redis-cli -a HtQory2wdk1X8M8YJuwjQ ping 2>/dev/null || print_warning "Redis connection failed"
    fi
}

# Function to clean up
cleanup() {
    print_warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Cleaning up Docker resources..."
        docker-compose down -v
        docker system prune -f
        print_success "Cleanup completed."
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show logs
show_logs() {
    local service=${1:-"all"}
    case $service in
        postgres|db)
            docker logs mangu-postgres
            ;;
        redis)
            docker logs mangu-redis
            ;;
        all)
            docker-compose logs
            ;;
        *)
            print_error "Unknown service: $service. Use: postgres, redis, or all"
            exit 1
            ;;
    esac
}

# Function to show help
show_help() {
    echo "MANGU Publishing Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       Start production services"
    echo "  dev         Start development services (with dev overrides)"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  status      Show service status and connectivity"
    echo "  logs [service] Show logs (postgres|redis|all)"
    echo "  cleanup     Remove all containers, volumes, and images"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start          # Start production services"
    echo "  $0 dev            # Start development services"
    echo "  $0 logs postgres  # Show PostgreSQL logs"
    echo "  $0 status         # Check service status"
}

# Main script logic
case "${1:-help}" in
    start)
        start_services
        ;;
    dev)
        start_dev
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

