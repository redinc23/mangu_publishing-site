# Backend Enhancements - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Update Environment Variables

Add these to your `server/.env` file:

```bash
# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Database Optimization
DATABASE_POOL_MAX=20
DATABASE_POOL_MIN=2
DATABASE_IDLE_TIMEOUT=600000
DATABASE_TIMEOUT=30000
SLOW_QUERY_THRESHOLD=1000
ENABLE_QUERY_LOGGING=true

# WebSocket
ENABLE_WEBSOCKET=true
CLIENT_URL=http://localhost:5173
```

### 2. Start the Server

```bash
cd server
npm run dev
```

You should see:
```
✓ PostgreSQL connected successfully
✓ Redis connected
✓ Socket.IO initialized
✓ MANGU server started on port 3001
```

### 3. Test the Features

**Test Health Checks:**
```bash
curl http://localhost:3001/api/health
```

**Test Rate Limiting:**
```bash
# Make multiple requests quickly
for i in {1..10}; do curl http://localhost:3001/api/books; done
```

**Check Logs:**
```bash
# Watch structured logs in real-time
tail -f logs/combined.log
```

---

## 📖 What's New?

### 1. Structured Logging
Every request now has a correlation ID for tracking:
```javascript
import logger from './utils/logger.js';
logger.info('User action', { userId, action: 'purchase' });
```

### 2. Advanced Rate Limiting
Protect your API with multiple rate limit tiers:
```javascript
import { createAuthRateLimiter } from './middleware/rateLimiter.js';
app.post('/api/auth/login', createAuthRateLimiter(redis), handler);
```

### 3. Database Optimization
Connection pooling and query monitoring built-in:
```javascript
import { query, transaction } from './config/database.js';
const result = await query('SELECT * FROM books');
```

### 4. Health Monitoring
Multiple health check endpoints for monitoring:
- `/api/health` - Full health check
- `/api/health/ready` - Readiness probe
- `/api/health/live` - Liveness probe
- `/api/health/metrics` - Prometheus metrics

### 5. WebSocket Support
Real-time communication ready to use:
```javascript
import { sendToUser } from './services/socket.js';
sendToUser(userId, 'notification', { message: 'Hello!' });
```

---

## 🔍 Quick Tests

### Test 1: Health Checks
```bash
# All health endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/health/ready
curl http://localhost:3001/api/health/live
curl http://localhost:3001/api/health/metrics
curl http://localhost:3001/ping
```

### Test 2: Rate Limiting
```bash
# Exceed rate limit (should get 429 after 100 requests)
for i in {1..150}; do
  echo "Request $i:"
  curl -s -w "Status: %{http_code}\n" http://localhost:3001/api/books
done
```

### Test 3: Correlation IDs
```bash
# Check response headers for X-Correlation-Id
curl -v http://localhost:3001/api/books 2>&1 | grep -i correlation
```

### Test 4: Database Pooling
```bash
# Check pool statistics in metrics
curl http://localhost:3001/api/health/metrics | jq '.database'
```

### Test 5: WebSocket Connection
```javascript
// In your frontend or use wscat
npm install -g wscat
wscat -c ws://localhost:3001
```

---

## 📊 Monitoring

### View Logs
```bash
# Tail all logs
tail -f logs/combined.log

# Filter errors only
tail -f logs/combined.log | grep ERROR

# Filter slow queries
tail -f logs/combined.log | grep "Slow query"
```

### Check Health Status
```bash
# Watch health status continuously
watch -n 5 'curl -s http://localhost:3001/api/health | jq .'
```

### Monitor Rate Limits
```bash
# Check rate limit headers
curl -v http://localhost:3001/api/books 2>&1 | grep -i "ratelimit"
```

---

## 🎯 Common Use Cases

### Use Case 1: Track a Request
Every request has a correlation ID:
```bash
# Make a request
curl -v http://localhost:3001/api/books

# Look for X-Correlation-Id in response headers
# Use that ID to find all logs related to this request
grep "correlation-id-here" logs/combined.log
```

### Use Case 2: Limit Sensitive Endpoints
```javascript
import { createStrictRateLimiter } from './middleware/rateLimiter.js';

// Only 20 requests per 15 minutes
const strictLimit = createStrictRateLimiter(redisClient);
app.use('/api/admin', strictLimit);
```

### Use Case 3: Monitor Slow Queries
```bash
# Queries over 1000ms are logged as "Slow query"
grep "Slow query" logs/combined.log
```

### Use Case 4: Send Real-time Notifications
```javascript
import { sendToUser } from './services/socket.js';

// Send to specific user
sendToUser(userId, 'order:update', {
  orderId: '123',
  status: 'shipped'
});
```

### Use Case 5: Check System Health
```bash
# Get full system status
curl http://localhost:3001/api/health | jq '{
  status: .status,
  database: .checks.database.status,
  redis: .checks.redis.status,
  memory: .checks.memory.systemUsedPercent
}'
```

---

## 🔧 Configuration Tips

### Development Setup
```bash
# Enable verbose logging
LOG_LEVEL=debug

# Enable query logging
ENABLE_QUERY_LOGGING=true

# Lower rate limits for testing
RATE_LIMIT_MAX=10
```

### Production Setup
```bash
# Standard logging
LOG_LEVEL=info

# Disable query logging for performance
ENABLE_QUERY_LOGGING=false

# Production rate limits
RATE_LIMIT_MAX=100
DATABASE_POOL_MAX=20
```

### Testing Without Redis
```bash
# Disable Redis (uses memory store for rate limiting)
DISABLE_REDIS=1
npm run dev
```

### Testing Without WebSocket
```bash
# Disable WebSocket
ENABLE_WEBSOCKET=false
npm run dev
```

---

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check syntax
node --check src/index.js

# Check dependencies
npm install

# Check environment
cat .env | grep -v "^#"
```

### Rate Limiting Not Working
```bash
# Check Redis connection
curl http://localhost:3001/api/health | jq '.checks.redis'

# Check rate limit headers
curl -v http://localhost:3001/api/books 2>&1 | grep RateLimit
```

### No Logs Appearing
```bash
# Check log level
echo $LOG_LEVEL

# Check logs directory
ls -la logs/

# Force log output
LOG_LEVEL=debug npm run dev
```

### WebSocket Not Connecting
```bash
# Check if enabled
echo $ENABLE_WEBSOCKET

# Check CORS settings
echo $CLIENT_URL

# Check server logs
tail -f logs/combined.log | grep -i socket
```

---

## 📚 Further Reading

- **Full Documentation**: `server/BACKEND_ENHANCEMENTS.md`
- **Implementation Summary**: `BACKEND_ENHANCEMENTS_SUMMARY.md`
- **Code Examples**: Check inline comments in source files

---

## ✅ Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Health checks returning 200
- [ ] Rate limiting tested and working
- [ ] Database pool configured (max 20, min 2)
- [ ] Logs are structured and readable
- [ ] WebSocket authentication enabled
- [ ] Slow query threshold set (1000ms recommended)
- [ ] CloudWatch/monitoring configured
- [ ] Load tested with expected traffic
- [ ] Alerts configured for critical metrics

---

## 🎉 You're Ready!

All backend enhancements are now active. Your API is now:

- ✅ **Observable** - Structured logging with correlation IDs
- ✅ **Protected** - Rate limiting with burst protection
- ✅ **Optimized** - Connection pooling and query monitoring
- ✅ **Monitored** - Comprehensive health checks
- ✅ **Real-time** - WebSocket support enabled

Happy coding! 🚀
