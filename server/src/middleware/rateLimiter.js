import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import logger from '../utils/logger.js';

/**
 * Create Redis-backed rate limiter with IP and user-based limiting
 * @param {Object} redisClient - Redis client instance
 * @param {Object} options - Rate limiter configuration options
 * @returns {Function} Express middleware
 */
export function createRateLimiter(redisClient, options = {}) {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max = parseInt(process.env.RATE_LIMIT_MAX) || 100,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = null,
    message = 'Too many requests, please try again later.'
  } = options;

  const config = {
    windowMs,
    max,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests,
    skipFailedRequests,
    // Custom key generator for IP + user-based limiting
    keyGenerator: keyGenerator || ((req) => {
      const userId = req.user?.id || req.userId;
      const ip = req.ip || req.socket.remoteAddress;
      return userId ? `user:${userId}` : `ip:${ip}`;
    }),
    handler: (req, res) => {
      const logContext = {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        component: 'rate-limiter'
      };
      
      if (req.log) {
        req.log.warn('Rate limit exceeded', logContext);
      } else {
        logger.warn('Rate limit exceeded', logContext);
      }

      res.status(429).json({
        error: message,
        retryAfter: res.getHeader('RateLimit-Reset'),
        limit: res.getHeader('RateLimit-Limit'),
        remaining: 0
      });
    },
    // Slow down mechanism - gradually increase response time
    onLimitReached: (req, res) => {
      const logContext = {
        ip: req.ip,
        path: req.path,
        method: req.method,
        component: 'rate-limiter'
      };
      
      if (req.log) {
        req.log.info('Rate limit threshold reached', logContext);
      } else {
        logger.info('Rate limit threshold reached', logContext);
      }
    }
  };

  // Configure Redis store if available
  if (redisClient && typeof redisClient.sendCommand === 'function') {
    try {
      config.store = new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: 'rl:'
      });
      logger.info('Rate limiter configured with Redis store');
    } catch (error) {
      logger.warn('Failed to configure Redis for rate limiting, falling back to memory store', { 
        error: error.message 
      });
    }
  } else {
    logger.info('Rate limiter using in-memory store (Redis not available)');
  }

  return rateLimit(config);
}

/**
 * Strict rate limiter for sensitive endpoints (auth, payments, etc.)
 */
export function createStrictRateLimiter(redisClient, options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 20, // Much lower limit
    message = 'Too many requests to sensitive endpoint. Please try again later.'
  } = options;

  return createRateLimiter(redisClient, {
    windowMs,
    max,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    message
  });
}

/**
 * Auth rate limiter with burst protection
 */
export function createAuthRateLimiter(redisClient) {
  return createRateLimiter(redisClient, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 attempts per 15 minutes
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false,
    message: 'Too many authentication attempts. Please try again later.'
  });
}

/**
 * API rate limiter with custom limits per endpoint
 */
export function createEndpointRateLimiter(redisClient, endpoint, options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 60, // 60 requests per minute
    message = `Too many requests to ${endpoint}. Please try again later.`
  } = options;

  return createRateLimiter(redisClient, {
    windowMs,
    max,
    message,
    keyGenerator: (req) => {
      const userId = req.user?.id || req.userId;
      const ip = req.ip || req.socket.remoteAddress;
      const key = userId ? `user:${userId}` : `ip:${ip}`;
      return `${endpoint}:${key}`;
    }
  });
}

/**
 * Burst protection middleware - detect and block rapid successive requests
 */
export function createBurstProtection(redisClient, options = {}) {
  const {
    points = 10, // Number of points
    duration = 1, // Per second
    blockDuration = 60 // Block for 60 seconds
  } = options;

  return async (req, res, next) => {
    if (!redisClient || typeof redisClient.get !== 'function') {
      return next();
    }

    try {
      const key = `burst:${req.ip}`;
      const current = await redisClient.get(key);
      
      if (current && parseInt(current) >= points) {
        const logContext = {
          ip: req.ip,
          path: req.path,
          method: req.method,
          component: 'burst-protection'
        };
        
        if (req.log) {
          req.log.warn('Burst protection triggered', logContext);
        } else {
          logger.warn('Burst protection triggered', logContext);
        }

        return res.status(429).json({
          error: 'Too many requests in rapid succession. Please slow down.',
          retryAfter: blockDuration
        });
      }

      // Increment counter
      const multi = redisClient.multi();
      multi.incr(key);
      multi.expire(key, duration);
      await multi.exec();

      next();
    } catch (error) {
      logger.error('Burst protection error', { error: error.message });
      next(); // Fail open
    }
  };
}
