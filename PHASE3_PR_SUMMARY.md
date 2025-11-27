# Phase 3: Analytics & Monitoring Infrastructure

## PR Summary

This PR implements comprehensive production hardening for MANGU Publishing, adding analytics tracking, health monitoring, automated smoke tests, and error monitoring capabilities.

## ✅ Completed Tasks

### 1. Analytics Setup (Mixpanel) - 30 min ✓
**Package Installed:** `mixpanel-browser`

**Implementation:**
- Created analytics wrapper: `client/src/lib/analytics.js`
- Automatic page view tracking: `client/src/hooks/usePageTracking.js`
- Integrated into `App.jsx` via `usePageTracking()` hook

**Events Tracked:**
- ✅ **User Sign Up** - Ready for implementation in signup flow
- ✅ **User Sign In** - Implemented in `SignInPageV2.jsx`
  - Tracks both mock and Cognito authentication
  - Identifies users with `analytics.identify(email)`
- ✅ **Page Views** - Automatic tracking on all route changes
  - Captures pathname, search params, and hash
  - Tracks every navigation automatically
- ✅ **Add to Cart** - Implemented in `CartContext.jsx`
  - Tracks book ID, title, and price
  - Triggers on every add-to-cart action
- ✅ **Purchase Completed** - Helper function ready
  - Ready for integration in checkout flow
  - Tracks order ID, items, and total amount

**Development Mode:**
- Events logged to console with `[Analytics]` prefix when no token configured
- No external calls in development
- Easy debugging and verification

### 2. Health Check Endpoint - 15 min ✓
**Status:** ✅ Already exists with comprehensive implementation

**Endpoints Available:**
- `GET /api/health` - Detailed system health with metrics
  - Database status and pool stats
  - Redis connectivity
  - Memory usage (heap and system)
  - Disk I/O status
  - Overall health determination (healthy/degraded/unhealthy)
  - Returns 200, 503 status codes appropriately

- `GET /api/health/ready` - Kubernetes readiness probe
  - Database connection validation
  - Ready/not ready status

- `GET /api/health/live` - Kubernetes liveness probe
  - Process alive confirmation
  - Uptime tracking

- `GET /api/health/metrics` - Prometheus/CloudWatch metrics
  - System resources (CPU, memory, load)
  - Database pool statistics
  - Process metrics

- `GET /ping` - Simple load balancer check
  - Returns "pong"

**Implementation:** `server/src/routes/health.js`

### 3. Automated Smoke Tests - 30 min ✓
**File:** `scripts/smoke_test.js`

**Test Coverage (10 tests):**
1. ✅ Health endpoint returns 200
2. ✅ Liveness probe returns 200
3. ✅ Readiness probe returns 200 or 503
4. ✅ Books list endpoint returns 200
5. ✅ Featured books endpoint returns 200
6. ✅ Trending books endpoint returns 200
7. ✅ User profile without token returns 401
8. ✅ Cart without token returns 401
9. ✅ Invalid book ID returns 404
10. ✅ Search endpoint returns 200

**Features:**
- Color-coded terminal output
- Detailed pass/fail reporting
- 5-second timeout per request
- Environment variable support: `API_URL`
- Exit code 0 on success, 1 on failure (CI-ready)
- Comprehensive summary report

**Usage:**
```bash
npm run smoke-test
API_URL=https://staging.mangu.studio npm run smoke-test
```

### 4. Error Monitoring (Sentry) - 15 min ✓
**Packages Installed:**
- Client: `@sentry/react`
- Server: Already had `@sentry/node` and `@sentry/profiling-node`

**Client Implementation:**
- Sentry configuration: `client/src/lib/sentry.js`
  - Browser tracing integration
  - Session replay on errors
  - Environment-aware sampling rates
  - Disabled by default in development

- ErrorBoundary Integration: `client/src/main.jsx`
  - Automatic error capture
  - Context passing to Sentry

- Development Testing: `client/src/components/DevErrorTest.jsx`
  - Floating bug button (🐛) in bottom-right corner
  - Test frontend error capture
  - Test info message logging
  - Test uncaught error (ErrorBoundary)
  - Test backend error endpoint
  - **Only visible in development mode**

**Server Implementation:**
- Test error endpoint: `POST /api/test-error`
  - Only available in development (`NODE_ENV=development`)
  - Triggers Sentry error capture
  - Returns 500 with error details

**Helper Functions:**
```javascript
import { captureException, captureMessage } from '../lib/sentry';

captureException(error, { context });
captureMessage('Info message', 'info', { context });
```

## 📦 Dependencies Added

### Root Package
- `node-fetch@2` (devDependency) - For smoke tests

### Client Package
- `mixpanel-browser` - Analytics tracking
- `@sentry/react` - Error monitoring

## 📝 Configuration Required

### Environment Variables

**Client (`.env`):**
```env
# Analytics (optional - logs to console in dev if not set)
VITE_MIXPANEL_TOKEN=your_mixpanel_project_token

# Error Monitoring (optional - logs to console in dev if not set)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ENABLED=true  # Optional, enables Sentry in dev mode
```

**Server (`.env`):**
```env
# Error Monitoring (optional)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

## 🧪 Testing Instructions

### 1. Test Analytics (Development)
```bash
cd client
npm run dev
```
- Navigate between pages → Check console for `[Analytics] Page View` logs
- Sign in → Check console for `[Analytics] User Sign In` log
- Add book to cart → Check console for `[Analytics] Add to Cart` log

### 2. Test Health Endpoints
```bash
curl http://localhost:3000/api/health | jq
curl http://localhost:3000/api/health/live | jq
curl http://localhost:3000/api/health/ready | jq
```

### 3. Test Smoke Tests
```bash
# Start the server first
npm run dev

# In another terminal
npm run smoke-test
```
Expected output: All 10 tests pass with green checkmarks

### 4. Test Error Monitoring (Development)
```bash
npm run dev
```
- Visit any page in the app
- Click the floating bug button (🐛) in bottom-right
- Try each test button:
  - **Test Frontend Error** → Check console for Sentry log
  - **Test Info Message** → Check console for Sentry log
  - **Test Uncaught Error** → Triggers ErrorBoundary
  - **Test Backend Error** → Server logs error

## 📊 Monitoring & Observability

### Analytics Dashboard
Once configured with Mixpanel token:
- View real-time user activity
- Track funnel conversion (view → add to cart → purchase)
- Monitor page view trends
- Analyze user behavior patterns

### Health Monitoring
Integrate with monitoring tools:
- **Kubernetes:** Use `/api/health/ready` and `/api/health/live` probes
- **Load Balancers:** Use `/ping` or `/api/health`
- **Prometheus:** Use `/api/health/metrics` for scraping
- **CloudWatch:** Parse `/api/health` JSON for custom metrics

### Error Tracking
Once configured with Sentry DSN:
- Real-time error notifications
- Stack traces with source maps
- User impact analysis
- Performance monitoring
- Session replay for errors
- Release tracking

## 🚀 Deployment Checklist

- [ ] Set `VITE_MIXPANEL_TOKEN` in production environment
- [ ] Set `VITE_SENTRY_DSN` in production environment
- [ ] Set `SENTRY_DSN` in server production environment
- [ ] Run smoke tests against staging: `API_URL=https://staging npm run smoke-test`
- [ ] Configure monitoring alerts for health endpoints
- [ ] Set up Sentry alerts for error spikes
- [ ] Verify Mixpanel events in production dashboard
- [ ] Configure load balancer health checks
- [ ] Update CI/CD to include smoke tests

## 📚 Documentation

Comprehensive documentation created:
- **`docs/PHASE3_PRODUCTION_HARDENING.md`**
  - Detailed implementation guide
  - Configuration instructions
  - Usage examples
  - Testing procedures
  - Troubleshooting guide
  - CI/CD integration examples

## 🎯 Success Metrics

After deployment, monitor:
1. **Analytics Coverage:** 100% of page navigations tracked
2. **Health Check Uptime:** <1s response time, 99.9% availability
3. **Smoke Test Pass Rate:** 100% in CI/CD pipeline
4. **Error Detection:** <5 min from error to Sentry notification
5. **User Experience:** No performance degradation from monitoring

## 🎯 Additional Features (Bonus)

### 5. Admin Analytics Dashboard ✅
**New:** Real-time analytics and metrics dashboard for administrators

**API Implementation:**
- Endpoint: `GET /api/admin/analytics`
- Aggregate statistics: users, books, orders, revenue
- Recent orders with user details
- Top 5 selling books with sales metrics
- Protected with admin authentication

**UI Dashboard:**
- Beautiful gradient stat cards with icons
- Recent orders table with status badges
- Top selling books with rankings
- Responsive design with loading/error states
- Refresh data functionality
- Route: `/admin/analytics` (protected)

### 6. Performance Monitoring ✅
**New:** Comprehensive request performance tracking

**Features:**
- High-resolution timing for all requests
- X-Response-Time header on responses
- Automatic slow request detection (>1000ms warnings, >3000ms errors)
- Per-endpoint metrics collection (count, avg, min, max times)
- Admin endpoint: `GET /api/admin/performance`
- Minimal overhead, integrated with structured logging

## 🔄 Next Steps (Post-Merge)

1. Configure Mixpanel project and add token to production env
2. Configure Sentry project and add DSN to production env
3. Add smoke tests to CI/CD pipeline
4. Set up monitoring alerts (PagerDuty, Slack, etc.)
5. Configure session replay settings in Sentry
6. Add custom dashboards in Mixpanel
7. Implement Purchase Completed tracking in checkout flow
8. **Monitor performance metrics via /api/admin/performance**
9. **Use admin analytics dashboard to track business metrics**
10. **Set up alerts for slow requests (>1000ms)**

## ⚠️ Breaking Changes

None. All changes are additive and backward compatible.

## 📸 Screenshots

### Development Error Testing Panel
The floating bug button provides easy access to error monitoring tests:
- Only visible in development mode
- Clean UI with color-coded buttons
- Immediate feedback via alerts

### Smoke Test Output
```
═══════════════════════════════════════════
      MANGU Publishing - Smoke Tests      
═══════════════════════════════════════════
Testing API at: http://localhost:3000

Testing: GET /api/health returns 200... ✓ PASS
Testing: GET /api/health/live returns 200... ✓ PASS
[... 8 more tests ...]

═══════════════════════════════════════════
              Test Summary                 
═══════════════════════════════════════════
Total Tests: 10
Passed: 10
Failed: 0

✓ All smoke tests passed!
═══════════════════════════════════════════
```

## 👥 Reviewers

Please review:
- [ ] Analytics tracking implementation and event coverage
- [ ] Smoke test coverage and assertions
- [ ] Error monitoring integration
- [ ] Documentation completeness
- [ ] Environment variable naming
- [ ] Development testing UX

---

**Time Spent:** ~2.5 hours total
- Phase 3 Core: 1.5 hours
- Admin Analytics & Performance: 1 hour

**Branch:** `copilot/production-readiness`
**Commits:** 
1. Phase 3: Analytics & Monitoring Infrastructure
2. docs: Add Phase 3 PR summary
3. feat: Complete admin analytics dashboard + performance monitoring

**Total Files Changed:** 21 files (7 new, 14 modified)
