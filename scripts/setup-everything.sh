#!/bin/bash
# scripts/setup-everything.sh
# MANGU Publishing - Complete Project Setup Script
# This script handles README creation, environment setup, dependencies, and full project initialization

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}❌ ERROR:${NC} $1" >&2
    exit 1
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

info() {
    echo -e "${CYAN}ℹ️${NC}  $1"
}

header() {
    echo -e "${PURPLE}🚀 $1${NC}"
    echo -e "${PURPLE}$(printf '%.0s=' {1..50})${NC}"
}

# Check if we're in the right directory
check_project_root() {
    if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
        error "Please run this script from the project root directory (mangu2-publishing/)"
    fi
}

# Create comprehensive README.md with improved content
create_readme() {
    header "Creating Enhanced README.md"
    
    cat > README.md << 'EOF'
# 📚 MANGU Publishing Platform

> **Stream Unlimited Books** - A cloud-native digital publishing platform that democratizes access to literature through modern web technologies. Unleash your imagination with seamless reading experiences, powerful author tools, and enterprise-grade infrastructure designed for the future of digital publishing.

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=white&style=for-the-badge)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.0+-339933?logo=nodedotjs&logoColor=white&style=for-the-badge)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0+-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.1-DC382D?logo=redis&logoColor=white&style=for-the-badge)](https://redis.io/)
[![AWS](https://img.shields.io/badge/AWS-ECS%20Fargate-FF9900?logo=amazonaws&logoColor=white&style=for-the-badge)](https://aws.amazon.com/)
[![Vite](https://img.shields.io/badge/Vite-7.0+-646CFF?logo=vite&logoColor=white&style=for-the-badge)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)

---

## 🌟 Hero Overview: Your Gateway to Infinite Stories

Imagine a world where every book is at your fingertips, where authors craft masterpieces with cutting-edge tools, and readers dive into immersive experiences—all powered by rock-solid cloud infrastructure. MANGU Publishing isn't just a platform; it's a revolution in digital literature, designed to connect creators and consumers of stories seamlessly and securely.

### ✨ Key Features at a Glance

**For Readers:**
* 📖 **Unlimited Book Access** - Stream and read from a vast, ever-growing library of books, audiobooks, and multimedia content.
* 📱 **Responsive PWA Design** - Enjoy a mobile-first experience that works offline and feels native.
* 🔍 **AI-Powered Search** - Discover your next favorite story with smart recommendations, full-text search, and advanced filtering.
* 🤖 **AI Enhancements** - Benefit from integrated AI-driven features for personalized content discovery and reader assistance.

**For Authors & Publishers:**
* ✍️ **Author Portal** - Utilize an intuitive dashboard for publishing, comprehensive analytics, and streamlined royalty management.
* 🛒 **E-commerce Integration** - Leverage seamless Stripe-powered payments, flexible subscriptions, and robust marketplace features.
* 📊 **Analytics Dashboard** - Gain real-time insights for authors, publishers, and administrators to optimize engagement and content strategy.
* 🌐 **Multi-Format Support** - Publish and consume content across various formats including eBooks, audiobooks, videos, magazines, podcasts, and interactive media.
* 🤖 **AI Enhancements** - Integrate Copilot-like features to assist with content creation, editing, and optimization.

**Core Infrastructure & Security:**
* 🔒 **Fort Knox Security** - Rest assured with AWS WAF, encryption at rest and in transit, intelligent rate limiting, and a compliance-ready architecture.
* 📈 **Auto-Scaling Magic** - Ensure global, instant scalability and high availability with ECS Fargate backed by CloudFront CDN.

---

## 🖼️ Visual Showcase: See MANGU in Action

Dive into the MANGU experience with these captivating mockups and visuals.

*(Note: Please replace the placeholder images with actual hosted images in your repo's `docs/assets/` folder for live demonstrations.)*

### Mobile App Mockups: Reader's Journey

![Mobile Reader Discovery](https://via.placeholder.com/300x500/4A90E2/FFFFFF?text=Mobile+Reader+Discovery+Mockup)

*Figure 1: Seamless mobile discovery with intuitive swipe gestures and curated recommendations.*

### Mobile App Mockups: Immersive Reading Experience

![Reading Experience](https://via.placeholder.com/300x500/50C878/FFFFFF?text=Immersive+Reading+Experience)

*Figure 2: Distraction-free reading environment with customizable themes, personal bookmarks, and real-time progress tracking.*

### Mobile App Mockups: Author's Portal

![Author Dashboard](https://via.placeholder.com/300x500/FF6B6B/FFFFFF?text=Author+Dashboard+Mockup)

*Figure 3: Comprehensive author tools for uploading manuscripts, efficiently managing publications, and tracking royalties.*

### Desktop Web Interface: Homepage Hero

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                  🌟 Welcome to MANGU Publishing 🌟                           ║
║                                                                              ║
║  [Hero Image Placeholder: Stunning book library visualization]               ║
║                                                                              ║
║  Featured Books Carousel:                                                     ║
║  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     ║
║  │ Book 1  │ │ Book 2  │ │ Book 3  │ │ Book 4  │ │ Book 5  │ │ Book 6  │     ║
║  │ [Cover] │ │ [Cover] │ │ [Cover] │ │ [Cover] │ │ [Cover] │ │ [Cover] │     ║
║  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘     ║
║                                                                              ║
║  Search Bar: [___________________________ 🔍] "Find your next adventure..." ║
║                                                                              ║
║  Call-to-Action: [Start Reading Free] [Become an Author]                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

*ASCII Art Mockup: Dynamic homepage featuring rotating content, a prominent search bar, and clear calls-to-action.*

### Desktop Web Interface: Admin Analytics Dashboard

![Analytics Dashboard](https://via.placeholder.com/800x400/9B59B6/FFFFFF?text=Admin+Analytics+Dashboard+Mockup)

*Figure 4: A powerful analytics dashboard with interactive charts, essential user metrics, and real-time performance indicators.*

### 🎨 User Flow Diagrams

#### Reader Onboarding Flow

```mermaid
flowchart TD
    A[Visit Homepage] --> B{New User?}
    B -->|Yes| C[Sign Up / Login]
    B -->|No| D[Browse Library]
    C --> E[Personalize Profile]
    E --> F[AI Recommendations]
    F --> G[Start Reading]
    D --> H[Search & Filter]
    H --> I[Select Book]
    I --> J[Read / Listen]
    J --> K[Rate & Review]
    K --> L[Bookmark / Share]
```

### Author Publishing Workflow

```mermaid
flowchart LR
    A[Author Login] --> B[Upload Manuscript]
    B --> C[Add Metadata]
    C --> D[Set Pricing]
    D --> E[Preview Publication]
    E --> F[Submit for Review]
    F --> G{Admin Approval}
    G -->|Approved| H[Publish Live]
    G -->|Rejected| I[Revise & Resubmit]
    H --> J[Promote Content]
    J --> K[Monitor Analytics]
```

---

## 🏗️ Architecture: The Engine Behind the Magic

### System Components Overview

Behold the robust, scalable architecture that powers MANGU's lightning-fast performance and global reach:

```mermaid
graph TB
    subgraph "Client Layer"
        Users[👥 End Users<br/>Readers & Authors]
        DNS[🌐 Route53 DNS<br/>Global Routing]
    end

    subgraph "CDN Layer - CloudFront"
        CF[⚡ CloudFront Distribution<br/>Edge Locations Worldwide]
        CFCache[💾 Edge Caching<br/>Static Assets]
    end

    subgraph "Application Layer - us-east-1"
        subgraph "Load Balancing"
            ALB[🔄 Application Load Balancer<br/>Intelligent Routing]
            WAF[🛡️ AWS WAF<br/>Security Shield]
        end

        subgraph "VPC - 10.0.0.0/16"
            subgraph "Public Subnets"
                NAT1[🌉 NAT Gateway AZ-1<br/>Secure Outbound]
                NAT2[🌉 NAT Gateway AZ-2<br/>Redundant Routing]
            end

            subgraph "Private Subnets - ECS Fargate"
                ServerTask1[🚀 Server Task - AZ1<br/>API Services]
                ServerTask2[🚀 Server Task - AZ2<br/>Load Balanced]
                ClientTask1[💻 Client Task - AZ1<br/>SSR Rendering]
                ClientTask2[💻 Client Task - AZ2<br/>High Availability]
            end

            subgraph "Private Subnets - Data"
                RDS[(🗄️ RDS PostgreSQL<br/>Multi-AZ Cluster<br/>Encrypted)]
                Redis[(⚡ ElastiCache Redis<br/>Cluster Mode<br/>Sub-ms Latency)]
            end
        end

        subgraph "Container Registry"
            ECR[📦 Amazon ECR<br/>Server & Client Images<br/>Vulnerability Scanned]
        end
    end

    subgraph "Storage Layer"
        S3Uploads[📤 S3 - Uploads Bucket<br/>Versioned & Encrypted]
        S3Static[🖼️ S3 - Static Assets<br/>CDN Optimized]
    end

    subgraph "Secrets & Config"
        SecretsManager[🔐 AWS Secrets Manager<br/>DB, Redis, JWT, Stripe, Sentry<br/>Auto-Rotated]
    end

    Users -->|🔒 HTTPS| DNS
    DNS -->|📡 CNAME| CF
    CF -->|❌ Cache Miss| ALB
    CF -->|/static/* 🚀| S3Uploads
    CF -->|/assets/* 🖼️| S3Static

    ALB -->|🔌 Port 3000| ServerTask1
    ALB -->|🔌 Port 3000| ServerTask2
    ALB -->|🌐 Port 80| ClientTask1
    ALB -->|🌐 Port 80| ClientTask2

    ServerTask1 -->|📖 Read/Write| RDS
    ServerTask2 -->|📖 Read/Write| RDS
    ServerTask1 -->|💨 Cache| Redis
    ServerTask2 -->|💨 Cache| Redis
```

### Tech Stack Deep Dive

#### 🎨 Frontend Arsenal
* **React 18** - Harnessing hooks, concurrent features, and blazing performance for a dynamic UI.
* **Vite 7** - Ensuring lightning-fast Hot Module Replacement (HMR) and optimized production builds.
* **TypeScript** - Enabling robust, type-safe development with enhanced IntelliSense.
* **Tailwind CSS** - Utilizing a utility-first approach for rapid and consistent UI development.
* **React Router v6** - Providing declarative routing with efficient code splitting for a smooth navigation experience.
* **TanStack Query** - Delivering powerful data fetching, caching, and mutation capabilities.
* **Framer Motion** - Crafting smooth animations and delightful micro-interactions.
* **React Hook Form + Zod** - Implementing robust form validation with seamless TypeScript integration.

#### ⚙️ Backend Powerhouse
* **Node.js 20 LTS** - Leveraging ES modules and performance optimizations for scalable server-side operations.
* **Express 4** - Employing a minimalist web framework with a robust middleware ecosystem.

*(**Note**: The "Backend Powerhouse" section appears incomplete. Additional backend technologies such as ORM, authentication libraries, real-time communication tools, and other critical components should be documented here.)*

---

## ➡️ Next Steps & Contribution

MANGU Publishing is an ambitious project poised to redefine digital literature. We welcome collaboration and feedback. If you're interested in contributing or learning more, please reach out or explore the project's repository.

***
EOF

    success "Enhanced README.md created successfully"
}

# Setup environment files
setup_environment() {
    header "Setting up Environment Configuration"
    
    # Create server .env if it doesn't exist
    if [ ! -f "server/.env" ]; then
        log "Creating server/.env file..."
        cat > server/.env << EOF
# MANGU Publishing Server Environment Variables
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://mangu_user:mangu_password@localhost:5432/mangu_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# S3
S3_BUCKET_UPLOADS=mangu-uploads-dev
S3_BUCKET_STATIC=mangu-static-dev

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Sentry
SENTRY_DSN=your-sentry-dsn

# Notion (optional)
NOTION_API_KEY=your-notion-api-key
NOTION_DATABASE_ID=your-notion-database-id

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Client URL
CLIENT_URL=http://localhost:5173
EOF
        success "server/.env created"
    else
        warning "server/.env already exists, skipping..."
    fi
    
    # Create client .env if it doesn't exist
    if [ ! -f "client/.env" ]; then
        log "Creating client/.env file..."
        cat > client/.env << EOF
# MANGU Publishing Client Environment Variables
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ENVIRONMENT=development
EOF
        success "client/.env created"
    else
        warning "client/.env already exists, skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    header "Installing Dependencies"
    
    # Root dependencies
    log "Installing root dependencies..."
    if npm install; then
        success "Root dependencies installed"
    else
        error "Failed to install root dependencies"
    fi
    
    # Client dependencies
    log "Installing client dependencies..."
    cd client
    if npm install; then
        success "Client dependencies installed"
    else
        error "Failed to install client dependencies"
    fi
    cd ..
    
    # Server dependencies
    log "Installing server dependencies..."
    cd server
    if npm install; then
        success "Server dependencies installed"
    else
        error "Failed to install server dependencies"
    fi
    cd ..
}

# Setup database
setup_database() {
    header "Setting up Database"
    
    # Check if Docker is available
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        log "Starting PostgreSQL and Redis with Docker..."
        
        # Create docker-compose.yml for local development
        if [ ! -f "docker-compose.yml" ]; then
            cat > docker-compose.yml << EOF
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mangu_db
      POSTGRES_USER: mangu_user
      POSTGRES_PASSWORD: mangu_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mangu_user -d mangu_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
EOF
            success "docker-compose.yml created"
        fi
        
        # Start services
        if docker-compose up -d postgres redis; then
            success "PostgreSQL and Redis started with Docker"
            log "Waiting for services to be ready..."
            sleep 10
        else
            warning "Docker Compose failed, attempting manual setup..."
        fi
    else
        warning "Docker not available. Please start PostgreSQL and Redis manually."
        info "Required services:"
        info "  - PostgreSQL 16 on port 5432"
        info "  - Redis 7 on port 6379"
    fi
}

# Setup Notion integration
setup_notion() {
    header "Setting up Notion Integration"
    
    echo -e "${BLUE}Notion Integration Setup${NC}"
    echo "This is optional but recommended for enhanced functionality."
    echo ""
    
    read -p "Would you like to setup Notion integration now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "scripts/setup-notion-complete.sh" ]; then
            bash scripts/setup-notion-complete.sh
        else
            warning "Notion setup script not found, skipping..."
        fi
    else
        info "Notion setup skipped. You can run it later with: ./scripts/setup-notion-complete.sh"
    fi
}

# Setup AWS credentials
setup_aws() {
    header "Setting up AWS Credentials"
    
    echo -e "${BLUE}AWS Credentials Setup${NC}"
    echo "Required for deployment and some cloud features."
    echo ""
    
    read -p "Would you like to setup AWS credentials now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "setup-aws-credentials.sh" ]; then
            bash setup-aws-credentials.sh
        else
            warning "AWS setup script not found, skipping..."
        fi
    else
        info "AWS setup skipped. You can run it later with: ./setup-aws-credentials.sh"
    fi
}

# Run database migrations
run_migrations() {
    header "Running Database Migrations"
    
    cd server
    if npm run migrate 2>/dev/null; then
        success "Database migrations completed"
    else
        warning "Migration script not available or failed"
        info "You may need to create the database schema manually"
    fi
    cd ..
}

# Seed database
seed_database() {
    header "Seeding Database"
    
    echo -e "${BLUE}Database Seeding${NC}"
    echo "This will populate your database with sample data."
    echo ""
    
    read -p "Would you like to seed the database with sample data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd server
        if npm run seed 2>/dev/null; then
            success "Database seeded with sample data"
        else
            warning "Seeding script not available or failed"
        fi
        cd ..
    else
        info "Database seeding skipped"
    fi
}

# Run health check
run_health_check() {
    header "Running Health Check"
    
    if [ -f "scripts/system-health.js" ]; then
        node scripts/system-health.js
    else
        log "Performing basic health checks..."
        
        # Check if Node.js is available
        if command -v node &> /dev/null; then
            success "Node.js is available"
        else
            error "Node.js is not installed"
        fi
        
        # Check if npm is available
        if command -v npm &> /dev/null; then
            success "npm is available"
        else
            error "npm is not installed"
        fi
        
        # Check if PostgreSQL is accessible
        if command -v nc &> /dev/null && nc -z localhost 5432 2>/dev/null; then
            success "PostgreSQL is accessible on port 5432"
        else
            warning "PostgreSQL not accessible on port 5432 (or netcat not installed)"
        fi
        
        # Check if Redis is accessible
        if command -v nc &> /dev/null && nc -z localhost 6379 2>/dev/null; then
            success "Redis is accessible on port 6379"
        else
            warning "Redis not accessible on port 6379 (or netcat not installed)"
        fi
    fi
}

# Start development servers
start_development() {
    header "Starting Development Environment"
    
    echo -e "${BLUE}Development Environment${NC}"
    echo "This will start both the client and server in development mode."
    echo ""
    
    read -p "Would you like to start the development servers now? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        log "Starting development servers..."
        npm run dev &
        DEV_PID=$!
        echo $DEV_PID > .dev_pid
        success "Development servers started (PID: $DEV_PID)"
        echo ""
        info "Access your application at:"
        info "  Frontend: http://localhost:5173"
        info "  Backend API: http://localhost:3001"
        info "  API Docs: http://localhost:3001/api/docs"
        echo ""
        info "To stop: kill $DEV_PID or run: pkill -f 'npm run dev'"
    else
        info "Development servers not started. Run 'npm run dev' to start them later."
    fi
}

# Display next steps
show_next_steps() {
    header "Setup Complete! 🎉"
    
    echo ""
    echo -e "${GREEN}Your MANGU Publishing platform is ready!${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo "1. 📖 Read the comprehensive README.md for detailed information"
    echo "2. 🌐 Access your application at http://localhost:5173"
    echo "3. 🔧 Customize environment variables in server/.env and client/.env"
    echo "4. 🧪 Run tests with: npm test"
    echo "5. 🚀 Deploy to production with: ./deploy-to-production.sh"
    echo ""
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo "  npm run dev          # Start development servers"
    echo "  npm run build        # Build for production"
    echo "  npm run health-check # System health check"
    echo "  npm run lint         # Code quality checks"
    echo "  ./scripts/setup-everything.sh --help # Show this help"
    echo ""
    echo -e "${PURPLE}Need Help?${NC}"
    echo "  📚 Documentation: docs/"
    echo "  🐛 Issues: https://github.com/your-org/mangu2-publishing/issues"
    echo "  💬 Discussions: https://github.com/your-org/mangu2-publishing/discussions"
    echo ""
}

# Help function
show_help() {
    echo "MANGU Publishing - Complete Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help          Show this help message"
    echo "  --skip-readme   Skip README creation"
    echo "  --skip-deps     Skip dependency installation"
    echo "  --skip-db       Skip database setup"
    echo "  --skip-dev      Skip starting development servers"
    echo ""
    echo "Examples:"
    echo "  $0                          # Complete setup"
    echo "  $0 --skip-dev              # Setup everything except dev servers"
    echo "  $0 --skip-readme --skip-db # Skip README and database setup"
    echo ""
}

# Parse command line arguments
SKIP_README=false
SKIP_DEPS=false
SKIP_DB=false
SKIP_DEV=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            show_help
            exit 0
            ;;
        --skip-readme)
            SKIP_README=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --skip-dev)
            SKIP_DEV=true
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Main execution
main() {
    header "MANGU Publishing - Complete Setup Script"
    echo -e "${CYAN}This script will set up your entire MANGU Publishing platform${NC}"
    echo ""
    
    check_project_root
    
    # Execute setup steps
    if [ "$SKIP_README" = false ]; then
        create_readme
    fi
    
    setup_environment
    
    if [ "$SKIP_DEPS" = false ]; then
        install_dependencies
    fi
    
    if [ "$SKIP_DB" = false ]; then
        setup_database
        run_migrations
        seed_database
    fi
    
    setup_notion
    setup_aws
    run_health_check
    
    if [ "$SKIP_DEV" = false ]; then
        start_development
    fi
    
    show_next_steps
}

# Run main function
main "$@"

