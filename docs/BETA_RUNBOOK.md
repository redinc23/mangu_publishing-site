# Beta Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying the MANGU Publishing platform to the beta environment at `publishing.mangu.com`. The beta includes the complete reader flow: authentication, library browsing, book details, cart management with Stripe checkout, user profiles, and admin CRUD operations.

**Target Host**: `publishing.mangu.com` (or configured beta URL)

**Main User Flow**: `/signin` → `/library` → `/book/:id` → `/cart` → `/profile`

---

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- Terraform >= 1.5.0
- Node.js >= 18.0.0
- PostgreSQL client tools (for migrations)
- Access to GitHub repository and secrets

---

## How to Deploy a Beta Build

### Option 1: Deploy via GitHub Actions (Recommended)

1. **Merge to beta branch**:
   ```bash
   git checkout -b beta
   git merge main  # or merge your feature branch
   git push origin beta
   ```

2. **Trigger deployment**:
   - If CI/CD is configured to auto-deploy on `beta` branch push, deployment will start automatically
   - Otherwise, manually trigger the deployment workflow in GitHub Actions

3. **Monitor deployment**:
   - Check GitHub Actions workflow status
   - Monitor CloudWatch logs for the beta environment
   - Verify health endpoint: `https://publishing.mangu.com/api/health`

### Option 2: Manual Deployment

1. **Build the application**:
   ```bash
   # Build frontend
   cd client
   npm ci
   npm run build
   
   # Build backend (if using Docker)
   cd ../server
   npm ci
   ```

2. **Deploy infrastructure** (if needed):
   ```bash
   cd infrastructure/terraform
   terraform init
   terraform workspace select beta  # or create beta workspace
   terraform plan
   terraform apply
   ```

3. **Deploy application**:
   - Upload frontend build to S3/CloudFront
   - Deploy backend to ECS/Lambda/EC2 (depending on infrastructure)
   - Update environment variables for beta environment

---

## Database & Migrations

### Running Migrations for Beta

**Important**: Always run migrations before deploying application code that depends on schema changes.

1. **Connect to beta database**:
   ```bash
   # Set beta database URL
   export DATABASE_URL="postgresql://user:pass@beta-db-host:5432/mangu_beta"
   ```

2. **Run migrations**:
   ```bash
   cd server
   npm run migrate
   ```

   This will:
   - Check `server/src/database/migrations/` for `.sql` files
   - Apply any migrations not yet recorded in `schema_migrations` table
   - Log each migration as it's applied

3. **Verify migrations**:
   ```bash
   # Connect to database and check
   psql $DATABASE_URL -c "SELECT filename, applied_at FROM schema_migrations ORDER BY applied_at DESC;"
   ```

### Seeding Beta Data (Optional)

If you need to seed initial data:

```bash
cd server
npm run seed
```

**Note**: Only run seeds if the beta database is empty or you want to reset test data. Seeds are typically not run in production.

### Rollback Migrations (Emergency Only)

If a migration breaks the beta:

```bash
cd server
npm run migrate:rollback
```

**Warning**: Rollbacks are destructive. Only use if absolutely necessary and you understand the implications.

---

## Smoke Tests Post-Deploy

After deployment, verify the following endpoints and flows:

### 1. Root (`/`)
- [ ] Page loads without errors
- [ ] No console errors in browser DevTools
- [ ] Navigation links work

### 2. Sign In (`/signin`)
- [ ] Page loads and displays sign-in form
- [ ] Mock auth works (if `VITE_AWS_REGION` not set)
- [ ] Real Cognito auth works (if configured)
- [ ] Successful sign-in redirects to `/library`
- [ ] Error messages display correctly on failed sign-in

### 3. Library (`/library`)
- [ ] Page loads and displays books
- [ ] Books are fetched from API (or fallback to mock data gracefully)
- [ ] Search and filter functionality works
- [ ] Clicking a book navigates to `/book/:id`
- [ ] Loading states display correctly
- [ ] Error states handle API failures gracefully

### 4. Book Detail (`/book/1`)
- [ ] Page loads with book details
- [ ] Title, description, and metadata display correctly
- [ ] "Add to Cart" button is visible and functional
- [ ] "Add to Library" button works
- [ ] Reviews tab loads reviews (or shows graceful fallback)
- [ ] Tabs (overview, reviews, details) switch correctly
- [ ] Clicking "Add to Cart" updates cart state

### 5. Cart (`/cart`)
- [ ] Page displays items added from book detail page
- [ ] Cart items show correct book information
- [ ] Quantity updates work
- [ ] Remove item functionality works
- [ ] Subtotal and totals calculate correctly
- [ ] "Checkout" button is enabled when cart has items
- [ ] Clicking "Checkout" calls `/api/payments/create-checkout-session`
- [ ] Stripe redirect works (or API call succeeds if redirect is stubbed)

### 6. Profile (`/profile`)
- [ ] Page loads without crashing
- [ ] Signed-in user information displays correctly
- [ ] Library stats are visible
- [ ] Cart stats are visible
- [ ] Sign-out functionality works
- [ ] Signed-out state shows appropriate message

### 7. Admin (`/admin`)
- [ ] Admin dashboard loads (requires authentication)
- [ ] Books list page displays books
- [ ] "Edit" button navigates to edit page
- [ ] "Delete" button removes book (with confirmation)
- [ ] "New Book" button navigates to create page
- [ ] Book form saves correctly (create and edit)

### Quick Health Check Script

```bash
# Test API health
curl https://publishing.mangu.com/api/health

# Expected response:
# {"status":"ok","database":"connected","redis":"connected","timestamp":"..."}
```

---

## Running the E2E Test

### Local Testing

Run the golden path test against local dev servers:

```bash
# Start dev servers (in separate terminals)
npm run dev  # Starts both frontend and backend

# Run Playwright test
cd client
npm run test:e2e tests/e2e/golden-path.spec.js
```

**Note**: The test expects:
- Frontend running on `http://localhost:5179`
- Backend API running on `http://localhost:3009`
- Test will auto-start servers if not running (via `webServer` config)

### Testing Against Beta

Run the golden path test against the deployed beta environment:

```bash
cd client
PLAYWRIGHT_BASE_URL=https://publishing.mangu.com npm run test:e2e tests/e2e/golden-path.spec.js
```

**What the test verifies**:
1. Sign-in flow (mock or real auth)
2. Library page displays books
3. Book detail page loads and "Add to Cart" works
4. Cart page shows added items
5. Checkout button triggers Stripe API call
6. Profile page displays signed-in user info

**Note**: The test stubs the Stripe redirect to avoid brittle external redirects. It verifies the API call is made instead.

---

## Rollback

If the beta deployment is broken, roll back using one of these methods:

### Option 1: Revert Git Branch (Recommended)

```bash
# Revert to previous commit
git checkout beta
git revert HEAD
git push origin beta

# Or reset to specific commit
git reset --hard <previous-commit-hash>
git push origin beta --force  # Use with caution
```

This will trigger a new deployment with the previous code.

### Option 2: Revert Infrastructure (Terraform)

If infrastructure changes broke the deployment:

```bash
cd infrastructure/terraform
terraform workspace select beta
terraform plan  # Review what will be reverted
terraform apply  # Apply previous state
```

### Option 3: Manual Rollback

1. **Revert application code**:
   - Re-deploy previous Docker image/artifact
   - Or manually revert code changes and rebuild

2. **Revert database migrations** (if needed):
   ```bash
   cd server
   npm run migrate:rollback
   ```

3. **Verify rollback**:
   - Run smoke tests (see above)
   - Check health endpoint
   - Verify golden path test passes

---

## Troubleshooting

### Common Issues

**Issue**: Health endpoint returns 503 (Database unavailable)
- **Fix**: Check database connection string and network access
- **Verify**: `psql $DATABASE_URL -c "SELECT 1;"`

**Issue**: Frontend shows "API Error" or blank pages
- **Fix**: Check `VITE_API_URL` environment variable matches backend URL
- **Verify**: Backend health endpoint is accessible from frontend origin

**Issue**: Stripe checkout fails
- **Fix**: Verify Stripe keys are set in backend environment variables
- **Check**: Stripe webhook endpoint is configured and accessible

**Issue**: Cart items disappear after page refresh
- **Fix**: Verify localStorage is enabled and not blocked
- **Check**: Cart context is properly saving to localStorage

**Issue**: E2E test fails on beta URL
- **Fix**: Ensure beta URL is accessible and CORS is configured
- **Check**: Test network requests in browser DevTools

### Getting Help

- Check logs: CloudWatch (AWS) or server logs
- Review recent commits: `git log --oneline -10`
- Run health checks: `/api/health` endpoint
- Check environment variables: Ensure all required vars are set

---

## Pre-Beta Checklist

Before inviting external testers, ensure:

- [ ] All smoke tests pass (see above)
- [ ] Golden path e2e test passes against beta
- [ ] Database migrations are applied
- [ ] Environment variables are configured correctly
- [ ] Stripe keys are set (for checkout flow)
- [ ] Cognito is configured (if using real auth)
- [ ] Error monitoring is set up (e.g., CloudWatch alarms)
- [ ] Rollback procedure is documented and tested
- [ ] Support contact information is available for testers

---

## Post-Deployment

After successful deployment:

1. **Monitor**:
   - Watch error logs for first 30 minutes
   - Check API response times
   - Monitor database connection pool

2. **Test**:
   - Run golden path test against beta
   - Perform manual smoke tests
   - Test with real Stripe test cards

3. **Document**:
   - Note any issues encountered
   - Update this runbook if procedures change
   - Record deployment time and commit hash

---

## File Locations

- **Migrations**: `server/src/database/migrations/`
- **Seeds**: `server/src/database/seeds/` or `server/src/database/seed.sql`
- **E2E Tests**: `tests/e2e/golden-path.spec.js`
- **Playwright Config**: `tests/e2e/playwright.config.js`
- **Deployment Scripts**: `deploy-to-production.sh`, `scripts/`
- **Infrastructure**: `infrastructure/terraform/`

---

**Last Updated**: 2024
**Maintainer**: Engineering Team

