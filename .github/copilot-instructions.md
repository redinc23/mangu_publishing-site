# Copilot Instructions for MANGU Publishing

This repository is a **monorepo** with a React frontend (`client/`) and an Express backend (`server/`). Use this document to make code changes that match project conventions and to locate important workflows.

## 📚 Project Overview

MANGU Publishing is a modern publishing platform featuring:
- **Frontend**: React 18 + Vite + React Router for a responsive book browsing experience
- **Backend**: Express.js REST API with PostgreSQL and Redis
- **Infrastructure**: Docker-based development, Kubernetes/Terraform for production
- **Testing**: Vitest for unit tests, Playwright for E2E tests

## 🔑 Key Files to Read Before Editing

Before making any changes, familiarize yourself with these critical files:

- **`README.md`** — Quick-start guide, environment setup, and Docker guidance
- **`AGENT.md`** — One-shot setup & verification runbook for automated agents
- **`start-dev.sh`** — Canonical script to bring up local development environment
- **`test-setup.sh`** — Health-check script to validate environment setup
- **`server/src/index.js`** — Server bootstrap and application initialization
- **`server/src/app.js`** — HTTP server, DB/Redis wiring, and route definitions
- **`server/src/database/init.sql`** — Authoritative database schema (UUID PKs, enums, indexes)
- **`server/src/database/migrations/`** — Database migration files
- **`server/src/database/seeds/`** — Database seed data
- **`client/src/main.jsx`** — React application entry point
- **`client/src/App.jsx`** — Root component with routing and ErrorBoundary

## 🏗️ Architecture & Design Decisions

### Technology Stack
- **Why React + Vite**: Fast development experience, modern build tooling, optimal for SPA
- **Why Express**: Lightweight, flexible, well-suited for REST APIs
- **Why PostgreSQL**: Robust relational database with excellent full-text search capabilities
- **Why Redis**: Optional caching layer for performance optimization in production
- **Why Yarn Workspaces**: Efficient dependency management in monorepo structure

### Key Architectural Patterns

**⚠️ CRITICAL: Do NOT break these patterns**

1. **Database & Cache Wiring**
   - `server/src/index.js` initializes DB pool and Redis client via `setDbPool()` and `setRedisClient()`
   - Routes access them via `req.app.locals.db` and `req.app.locals.redis`
   - Always check if DB/Redis exists before using: `if (!req.app.locals.db) return res.status(503).json({error:'Database unavailable'})`

2. **Redis is Optional in Development**
   - Server supports `DISABLE_REDIS=1` environment variable
   - A lightweight stub is used when Redis is disabled
   - In tests and code, check for `redisClient` API shape (methods: `get`, `setEx`, `set`)
   - Never assume Redis is always available

3. **SQL-First Schema Management**
   - `server/src/database/init.sql` is the authoritative schema definition
   - Code uses raw SQL queries in routes (see `app.js`)
   - When modifying schema: update `init.sql`, create migration file, update seeds, update tests
   - Prefer minimal, backward-compatible SQL changes

4. **Health Check & Error Handling**
   - `/api/health` endpoint returns detailed status with appropriate HTTP codes
   - Returns non-200 codes for critical failures (DB down, Redis issues)
   - Use this endpoint for readiness checks in Kubernetes/load balancers
   - Maintain human-readable error messages in development (gated by NODE_ENV checks)

## 🚀 Development Workflows

### Starting the Full Local Environment (Recommended)

```bash
# 1. Load credentials (creates required environment variables)
source scripts/launch_credentials.sh

# 2. Start Docker services (Postgres, Redis, Adminer, MailHog)
./start-dev.sh

# 3. In separate terminals, start development servers:
# Terminal 1 - Frontend (http://localhost:5173)
cd client && npm run dev

# Terminal 2 - Backend (http://localhost:3001)
cd server && npm run dev
```

### Quick Commands Reference

**Installation:**
```bash
# Install all workspace dependencies (from project root)
npm install
# OR
yarn install
```

**Development:**
```bash
# Start both client and server concurrently
npm run dev

# Run database migrations
npm --prefix server run migrate

# Seed sample data
npm --prefix server run seed
```

**Testing:**
```bash
# Run all tests from root
npm test

# Run server unit tests (Vitest)
cd server && npm test

# Run client unit tests (Vitest)
cd client && npm test

# Run E2E tests (Playwright)
cd client && npm run test:e2e
```

**Validation:**
```bash
# Validate environment setup before running tests
./test-setup.sh

# Check health endpoint
curl http://localhost:5000/api/health
```

## 📝 Code Conventions & Style

### JavaScript/TypeScript
- Both `client/` and `server/` use **ESM modules** (`type: "module"` in package.json)
- Client uses Vite + optional TypeScript checks (via `type-check` script)
- **Always** stick to existing ESLint configs in each workspace
- `lint-staged` and Husky hooks are configured — don't bypass them

### Logging & Error Handling
- Server uses `console` for simple logging and `winston` for structured logging
- **Maintain human-readable console output** for development
- **DO NOT remove** detailed error messages gated by `NODE_ENV` checks
- Example: `if (process.env.NODE_ENV !== 'production') { console.log('Detailed debug info...') }`

### Route Organization
- Many routes live inline in `server/src/app.js` (books, featured, trending)
- For **larger features**, create new files under `server/src/routes/` and import into `app.js`
- This keeps `app.js` manageable and improves code organization

### File Naming
- React components: PascalCase (e.g., `BookCard.jsx`, `LibraryPage.jsx`)
- Utilities/helpers: camelCase (e.g., `formatDate.js`, `apiClient.js`)
- Tests: `*.test.js` or `*.test.jsx` in `tests/` directories

## 🔌 Integration Points & External Services

### PostgreSQL Database
- **Purpose**: Primary data store for books, users, orders
- **Connection**: Via `DATABASE_URL` environment variable
- **Schema**: Authoritative definition in `server/src/database/init.sql`
- **Access**: Via `req.app.locals.db` in routes
- **Features**: UUID primary keys, enums for status fields, full-text search indexes

### Redis Cache
- **Purpose**: Performance optimization through caching
- **Optional**: Can be disabled in dev with `DISABLE_REDIS=1`
- **Access**: Via `req.app.locals.redis` in routes
- **Key Patterns**: Use namespaced keys like `books:featured`, `books:trending:{category}`
- **TTL**: Set appropriate expiration with `setEx(key, ttl, value)`

### AWS Services
- **SDK Version**: Using `@aws-sdk/*` (AWS SDK v3)
- **Services Used**:
  - **S3**: Book cover images, PDF storage (see `server/src/services/s3.js`)
  - **SES**: Transactional email (see `server/src/services/ses.js`)
  - **DynamoDB**: Session storage or user activity logs
- **Credentials**: Managed via `scripts/credentials/*.sh` files

### Third-Party Services
- **Stripe**: Payment processing for book purchases
- **AWS Cognito**: User authentication and authorization
- **Configuration**: All credentials stored in `scripts/credentials/*.sh` and `.env` files
- **Security**: Never commit real credentials — use `.env.example` as template

## 🧪 Testing Strategy

### Test Framework
- **Unit Tests**: Vitest (for both client and server)
- **E2E Tests**: Playwright (in `client/tests/`)
- **Location**: Tests colocated with code in `tests/` directories

### Running Tests Locally
```bash
# Validate environment first
./test-setup.sh

# Run all unit tests
npm --prefix server run test
npm --prefix client run test

# Run E2E tests
cd client && npm run test:e2e
```

### Writing Tests
- Follow existing test patterns in the codebase
- Mock external services (DB, Redis, AWS) in unit tests
- Use Playwright for user flow testing (login, browse, checkout)
- Ensure tests are idempotent and can run independently

### CI/CD Pipeline

CI runs comprehensive validation on every PR (see `.github/workflows/ci.yml`):

1. **Migration Validation**: Clean apply + rollback testing
2. **Security Scanning**: npm audit + CodeQL Analysis  
3. **Lint & Test Suite**: Server, client, and E2E tests
4. **Infrastructure Validation**: Docker Compose, K8s manifests, Terraform configs
5. **Preview Environment**: Automatic deployment for PRs

**Important**: 
- `lint-staged` and Husky hooks are enforced — don't bypass them
- All checks must pass before merging
- Fix failing tests; don't disable or skip them

## 💡 Code Examples & Patterns

### Accessing Database in Routes
```javascript
// Always check if DB is available
const db = req.app.locals.db;
if (!db) {
  return res.status(503).json({ error: 'Database unavailable' });
}

// Execute query
const result = await db.query('SELECT * FROM books WHERE id = $1', [bookId]);
```

### Using Redis Cache
```javascript
const redisClient = req.app.locals.redis;

// Try to get from cache
if (redisClient) {
  const cached = await redisClient.get('books:featured');
  if (cached) {
    return res.json(JSON.parse(cached));
  }
}

// Fetch from database
const books = await db.query('SELECT * FROM books WHERE featured = true');

// Cache the result (TTL: 1 hour = 3600 seconds)
if (redisClient) {
  await redisClient.setEx('books:featured', 3600, JSON.stringify(books.rows));
}

res.json(books.rows);
```

### Creating a New API Route
```javascript
// In server/src/app.js or server/src/routes/myFeature.js
app.get('/api/my-feature/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    const result = await db.query('SELECT * FROM my_table WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error in my-feature:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Error Handling Pattern
```javascript
try {
  // Your code here
} catch (error) {
  console.error('Descriptive error message:', error);
  
  // In development, include details
  if (process.env.NODE_ENV !== 'production') {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack 
    });
  }
  
  // In production, generic error
  res.status(500).json({ error: 'Internal server error' });
}
```

## ⚠️ What NOT to Do

### Database & Schema
- ❌ **Don't** modify `init.sql` without creating a corresponding migration file
- ❌ **Don't** use ORMs (this project uses raw SQL by design)
- ❌ **Don't** assume Redis is always available — always check first
- ❌ **Don't** forget to update seed data when changing schema

### Code Organization
- ❌ **Don't** add large features directly to `app.js` — create separate route files
- ❌ **Don't** remove or modify existing health check endpoints
- ❌ **Don't** bypass ESLint rules without team discussion
- ❌ **Don't** disable `lint-staged` or Husky hooks

### Dependencies
- ❌ **Don't** add dependencies without justification
- ❌ **Don't** update major versions without testing thoroughly
- ❌ **Don't** commit `node_modules/` or lock files to version control (they're gitignored)

### Security
- ❌ **Don't** commit real credentials or API keys
- ❌ **Don't** expose sensitive data in error messages (production)
- ❌ **Don't** disable security headers or CORS protections
- ❌ **Don't** commit `.env` files with real values

### Testing
- ❌ **Don't** skip or disable failing tests
- ❌ **Don't** commit code that breaks existing tests
- ❌ **Don't** forget to run `./test-setup.sh` before running test suite

## 📂 Project Structure

```
mangu_publishing-site/
├── client/                  # React frontend (Vite + React Router)
│   ├── src/
│   │   ├── main.jsx        # App entry point
│   │   ├── App.jsx         # Root component with routing
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page-level components
│   │   └── services/       # API client and utilities
│   ├── tests/              # Client-side tests
│   └── public/             # Static assets
├── server/                  # Express.js backend
│   ├── src/
│   │   ├── index.js        # Server bootstrap
│   │   ├── app.js          # Route definitions and middleware
│   │   ├── database/       # Schema, migrations, seeds
│   │   ├── routes/         # Route handlers (for larger features)
│   │   └── services/       # Business logic and external services
│   └── tests/              # Server-side tests
├── scripts/                 # Utility scripts
│   ├── credentials/        # Credential management (gitignored)
│   └── launch_credentials.sh
├── infrastructure/          # Deployment configs
│   ├── kubernetes/         # K8s manifests
│   └── terraform/          # Infrastructure as Code
├── docs/                    # Project documentation
├── .github/
│   ├── workflows/          # CI/CD pipelines
│   └── copilot-instructions.md  # This file
├── start-dev.sh            # Start local Docker services
├── test-setup.sh           # Validate environment setup
└── package.json            # Workspace root configuration
```

## 🔍 When in Doubt

If you're unsure about any aspect of the codebase:

1. **Check existing patterns** in similar files before creating new patterns
2. **Read referenced files** mentioned in this document
3. **Validate changes** by running `./test-setup.sh` and the test suite
4. **Ask for clarification** rather than making assumptions

### Making Significant Changes

If you plan to:
- Change database migration tooling
- Remove or modify `start-dev.sh` assumptions
- Alter core architectural patterns
- Update major dependencies

Then:
1. Document your changes in a separate migration/upgrade guide
2. Update `README.md` with new instructions
3. Update `test-setup.sh` to validate the new approach
4. Ensure all CI checks still pass

---

**Last Updated**: 2024-11-24  
**Maintained by**: MANGU Publishing Development Team
