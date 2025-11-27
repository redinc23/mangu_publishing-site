# Phase 3: Production Hardening - Implementation Guide

## Overview
This document details the production hardening features implemented in Phase 3, including analytics tracking, health monitoring, automated smoke tests, and error monitoring.

## 1. Analytics Setup (Mixpanel)

### Installation
```bash
cd client
npm install mixpanel-browser
```

### Configuration
Analytics are configured via environment variables:
```env
VITE_MIXPANEL_TOKEN=your_mixpanel_project_token
```

### Implementation Files
- `client/src/lib/analytics.js` - Analytics wrapper and helper functions
- `client/src/hooks/usePageTracking.js` - Automatic page view tracking hook

### Tracked Events

#### User Sign Up
```javascript
analytics.trackSignUp('email' | 'mock' | 'cognito');
```
- Triggered on successful user registration
- Includes authentication method

#### User Sign In
```javascript
analytics.trackSignIn('email' | 'mock' | 'cognito');
```
- Triggered on successful authentication
- User identification via `analytics.identify(userId)`
- Implemented in: `client/src/pages/SignInPageV2.jsx`

#### Page Views
```javascript
analytics.trackPageView(pageName, { search, hash });
```
- Automatically tracked on every route change
- Integrated via `usePageTracking()` hook in `App.jsx`
- Captures pathname, search params, and hash

#### Add to Cart
```javascript
analytics.trackAddToCart(bookId, bookTitle, price);
```
- Triggered when user adds book to cart
- Includes book metadata (ID, title, price)
- Implemented in: `client/src/context/CartContext.jsx`

#### Purchase Completed
```javascript
analytics.trackPurchaseCompleted(orderId, items, total);
```
- Triggered on successful purchase
- Includes order details, item count, and total amount
- Ready for integration with checkout flow

### Development Mode
In development without a Mixpanel token:
- Events are logged to console with `[Analytics]` prefix
- No data is sent to Mixpanel
- Useful for debugging tracking implementation

### Usage Example
```javascript
import analytics from '../lib/analytics';

// Track custom event
analytics.track('Custom Event', { 
  property1: 'value1',
  property2: 'value2'
});

// Set user properties
analytics.setUserProperties({
  plan: 'premium',
  subscription_date: '2025-01-01'
});
```

## 2. Health Check Endpoint

### Endpoints
The health check system provides multiple endpoints for different monitoring needs:

#### GET `/api/health`
Comprehensive health check with detailed system status:
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2025-01-27T22:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 86400,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 15,
      "pool": {
        "total": 20,
        "idle": 18,
        "waiting": 0
      }
    },
    "redis": {
      "status": "healthy",
      "responseTime": 5
    },
    "memory": {
      "status": "healthy",
      "heapUsed": 128,
      "heapTotal": 256,
      "systemUsedPercent": 45
    },
    "disk": {
      "status": "healthy"
    }
  },
  "responseTime": 25
}
```

**HTTP Status Codes:**
- `200` - Healthy or degraded (non-critical issues)
- `503` - Unhealthy (critical failures)

#### GET `/api/health/ready`
Kubernetes/ECS readiness probe:
```json
{
  "ready": true,
  "timestamp": "2025-01-27T22:00:00.000Z"
}
```

#### GET `/api/health/live`
Kubernetes/ECS liveness probe:
```json
{
  "alive": true,
  "timestamp": "2025-01-27T22:00:00.000Z",
  "uptime": 86400
}
```

#### GET `/api/health/metrics`
Prometheus/CloudWatch metrics endpoint with detailed system metrics.

#### GET `/ping`
Simple ping endpoint for basic load balancer checks.

### Implementation
- Located in: `server/src/routes/health.js`
- Already existed in codebase (comprehensive implementation)
- Checks database, Redis, memory, and disk health
- Monitors connection pool statistics
- Tracks system resource usage

### Integration with Monitoring Systems
```yaml
# Kubernetes example
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

## 3. Automated Smoke Tests

### Overview
Comprehensive smoke test suite to validate critical API endpoints and ensure application functionality.

### Running Tests
```bash
# Run all smoke tests
npm run smoke-test

# With custom API URL
API_URL=https://staging.mangu.studio npm run smoke-test
```

### Test Coverage

#### Critical Endpoints (200 OK)
1. ✅ Health check endpoint
2. ✅ Liveness probe
3. ✅ Readiness probe
4. ✅ Books list endpoint
5. ✅ Featured books endpoint
6. ✅ Trending books endpoint
7. ✅ Search endpoint

#### Authentication Tests (401 Unauthorized)
8. ✅ Protected user endpoint without token
9. ✅ Protected cart endpoint without token

#### Error Handling (404 Not Found)
10. ✅ Invalid book ID returns 404

### Test Output
```
═══════════════════════════════════════════
      MANGU Publishing - Smoke Tests      
═══════════════════════════════════════════
Testing API at: http://localhost:3000

Testing: GET /api/health returns 200... ✓ PASS
Testing: GET /api/health/live returns 200... ✓ PASS
Testing: GET /api/health/ready returns 200 or 503... ✓ PASS
Testing: GET /api/books returns 200... ✓ PASS
Testing: GET /api/books/featured returns 200... ✓ PASS
Testing: GET /api/books/trending returns 200... ✓ PASS
Testing: GET /api/users/me without token returns 401... ✓ PASS
Testing: GET /api/cart without token returns 401... ✓ PASS
Testing: GET /api/books/invalid-id returns 404... ✓ PASS
Testing: GET /api/search returns 200... ✓ PASS

═══════════════════════════════════════════
              Test Summary                 
═══════════════════════════════════════════
Total Tests: 10
Passed: 10
Failed: 0

✓ All smoke tests passed!
═══════════════════════════════════════════
```

### CI Integration
Add to GitHub Actions workflow:
```yaml
- name: Run Smoke Tests
  run: npm run smoke-test
  env:
    API_URL: ${{ env.API_URL }}
```

### Implementation
- File: `scripts/smoke_test.js`
- Uses `node-fetch` for HTTP requests
- 5-second timeout per request
- Color-coded terminal output
- Exit code 0 on success, 1 on failure

## 4. Error Monitoring (Sentry)

### Client Setup

#### Installation
```bash
cd client
npm install @sentry/react
```

#### Configuration
```env
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ENABLED=true  # Optional, for dev mode testing
```

#### Implementation Files
- `client/src/lib/sentry.js` - Sentry configuration and helpers
- `client/src/main.jsx` - ErrorBoundary integration
- `client/src/components/DevErrorTest.jsx` - Development testing component

#### Features
- Automatic error capture via ErrorBoundary
- Browser performance tracing
- Session replay on errors
- Custom error capturing with context
- Environment-aware configuration

### Server Setup
Server already has Sentry configured:
- Package: `@sentry/node` and `@sentry/profiling-node`
- Configuration in: `server/src/app.js`
- Request handler middleware installed
- Error handler middleware at the end of middleware stack

### Testing Error Monitoring

#### Development Mode
In development, a floating bug button (🐛) appears in the bottom-right corner with test options:

1. **Test Frontend Error** - Captured exception with context
2. **Test Info Message** - Log message tracking
3. **Test Uncaught Error** - Triggers ErrorBoundary
4. **Test Backend Error** - POST `/api/test-error` (dev only)

#### Backend Test Endpoint
```bash
curl -X POST http://localhost:3000/api/test-error
```
Response:
```json
{
  "error": "Test error sent to Sentry",
  "message": "Test Backend Error - This is a test error for Sentry monitoring"
}
```

**Note:** Only available in development mode (`NODE_ENV=development`)

### Error Capture Examples

#### Manual Error Capture
```javascript
import { captureException, captureMessage } from '../lib/sentry';

try {
  // Some operation
} catch (error) {
  captureException(error, {
    userId: user.id,
    operation: 'checkout',
    timestamp: new Date()
  });
}
```

#### Message Logging
```javascript
captureMessage('User completed onboarding', 'info', {
  userId: user.id,
  duration: 120
});
```

### Sentry Dashboard
Monitor errors at: https://sentry.io/organizations/your-org/issues/

Features:
- Real-time error tracking
- Stack traces with source maps
- User impact analysis
- Performance monitoring
- Session replay on errors
- Release tracking

## Environment Variables Summary

### Client (.env)
```env
# Analytics
VITE_MIXPANEL_TOKEN=your_mixpanel_token

# Error Monitoring
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ENABLED=true  # Optional, for dev testing
```

### Server (.env)
```env
# Error Monitoring
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NODE_ENV=development|production
```

## Testing Checklist

### Pre-deployment Testing
- [ ] Configure Mixpanel token in client `.env`
- [ ] Configure Sentry DSN in both client and server `.env`
- [ ] Test analytics tracking in development (check console logs)
- [ ] Test Sentry error capture (use dev error test buttons)
- [ ] Run smoke tests against local environment: `npm run smoke-test`
- [ ] Verify health endpoints return correct status
- [ ] Check that protected routes return 401 without auth

### Post-deployment Testing
- [ ] Run smoke tests against staging: `API_URL=https://staging npm run smoke-test`
- [ ] Verify Mixpanel events appear in dashboard
- [ ] Verify Sentry errors appear in dashboard
- [ ] Test health check endpoint from load balancer
- [ ] Monitor initial user sessions for tracking accuracy

## Monitoring and Alerts

### Recommended Alerts

#### Health Monitoring
- Alert if `/api/health` returns 503 for more than 2 minutes
- Alert if response time exceeds 1000ms
- Alert if database connection pool is exhausted

#### Error Monitoring
- Alert on error spike (>50 errors/minute)
- Alert on new error type
- Alert on critical error in checkout flow

#### Analytics
- Alert if no page views for 10 minutes (potential tracking issue)
- Alert if sign-up events drop below threshold

## Deployment Notes

### Phase 3 Complete Implementation
All Phase 3 tasks have been implemented:
1. ✅ Analytics setup with Mixpanel
2. ✅ Health check endpoints (already comprehensive)
3. ✅ Automated smoke tests
4. ✅ Error monitoring with Sentry
5. ✅ Development testing tools

### Next Steps
1. Configure production environment variables
2. Set up Mixpanel project and obtain token
3. Set up Sentry project and obtain DSN
4. Integrate smoke tests into CI/CD pipeline
5. Configure monitoring alerts
6. Test all features in staging environment

## Troubleshooting

### Analytics Not Working
- Check that `VITE_MIXPANEL_TOKEN` is set
- In dev mode, check console for `[Analytics]` logs
- Verify network tab shows requests to Mixpanel API

### Sentry Not Capturing Errors
- Check that `VITE_SENTRY_DSN` (client) and `SENTRY_DSN` (server) are set
- Verify DSN is valid in Sentry dashboard
- Check console for Sentry initialization logs
- In dev mode, use the error test button to trigger test errors

### Smoke Tests Failing
- Ensure server is running: `npm run dev`
- Check `API_URL` environment variable
- Verify database and Redis are connected
- Check server logs for errors

## Support
For issues or questions, contact the development team or refer to:
- Mixpanel Docs: https://developer.mixpanel.com/
- Sentry Docs: https://docs.sentry.io/
- Health Check Implementation: `server/src/routes/health.js`
