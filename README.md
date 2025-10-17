# MANGU Publishing Platform

A modern, scalable publishing platform built with React, Node.js, PostgreSQL, and Redis.

## 🚀 Quick Start

```bash
# 1. Verify setup
./test-setup.sh

# 2. Start services
./start-dev.sh

# 3. Start development servers (in separate terminals)
cd client && npm run dev
cd server && npm run dev
```

## 🛠️ Local Development

```bash
# Install all workspace dependencies
npm install

# Start the Express API (http://localhost:3001)
npm --prefix server run dev

# Start the React client (http://localhost:5173)
npm --prefix client run dev
```

- Open `http://localhost:5173` to preview the MANGU UI. You should see the hero banner, search bar, and library tabs ready for interaction.
- Vite proxies `/api` requests to `http://localhost:3001`, so data loads automatically when the server process is running. Set `DISABLE_REDIS=1` if you have no Redis instance locally.

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

## 🎯 Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Database Admin:** http://localhost:8080
- **Mail Testing:** http://localhost:8025

## 🔧 Development

```bash
# Install dependencies
cd client && npm install
cd server && npm install

# Run tests
npm test                    # Run all tests
npm run test:coverage      # With coverage
npm run lint               # Check code style

# Database operations
npm run migrate            # Run migrations
npm run seed              # Seed sample data

# Build for production
npm run build
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service]

# Stop services
docker-compose down

# Reset database
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache
```

## 📚 Features

- ✅ Modern React frontend with responsive design
- ✅ Express.js API with comprehensive endpoints
- ✅ PostgreSQL database with full-text search
- ✅ Redis caching for performance
- ✅ Docker development environment
- ✅ Comprehensive test suite
- ✅ Security best practices
- ✅ Production-ready deployment configs

## 🔒 Security

- Environment variables for secrets
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Security headers with Helmet.js

## 📖 API Documentation

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/books/featured` - Featured book
- `GET /api/books/trending` - Trending books
- `GET /api/books/search` - Search books
- `GET /api/categories` - Book categories

### Authentication Required
- `GET /api/library` - User library
- `POST /api/cart/add` - Add to cart

## 🛠️ Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Find and kill processes
lsof -ti:5000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

**Database issues:**
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
```

**Dependency issues:**
```bash
# Clear caches
rm -rf node_modules package-lock.json
npm install
```

## 📁 Project Structure

```
mangu-publishing/
├── client/                 # React frontend
├── server/                 # Express.js backend
├── infrastructure/         # Docker, K8s, Terraform
├── tests/                 # Test suites
├── docs/                  # Documentation
└── scripts/               # Utility scripts
```

## 🚀 Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Deploy to AWS
cd infrastructure/terraform
terraform apply

# Or deploy to other platforms
# See docs/deployment/ for guides
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

Copyright © 2024 MANGU Publishing. All rights reserved.
