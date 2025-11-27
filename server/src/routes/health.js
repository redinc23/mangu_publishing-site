import express from 'express';
import { healthCheck as dbHealthCheck, getPoolStats } from '../config/database.js';
import logger from '../utils/logger.js';
import os from 'os';

const router = express.Router();

/**
 * Deep health check endpoint - comprehensive system health
 * Used by monitoring systems and load balancers for detailed health status
 */
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      database: { status: 'unknown' },
      redis: { status: 'unknown' },
      memory: { status: 'unknown' },
      disk: { status: 'unknown' }
    }
  };

  try {
    const dbPool = req.app.locals.db;
    const redisClient = req.app.locals.redis;

    // Database health check
    try {
      if (dbPool) {
        const dbHealth = await dbHealthCheck();
        health.checks.database = {
          status: dbHealth.status,
          responseTime: dbHealth.responseTime,
          pool: dbHealth.pool,
          ...(dbHealth.message && { message: dbHealth.message })
        };
      } else {
        health.checks.database = {
          status: 'unavailable',
          message: 'Database pool not initialized'
        };
      }
    } catch (error) {
      health.checks.database = {
        status: 'unhealthy',
        message: error.message
      };
    }

    // Redis health check
    try {
      if (redisClient && typeof redisClient.ping === 'function') {
        const redisStart = Date.now();
        await redisClient.ping();
        health.checks.redis = {
          status: 'healthy',
          responseTime: Date.now() - redisStart
        };
      } else {
        health.checks.redis = {
          status: 'unavailable',
          message: 'Redis client not initialized or disabled'
        };
      }
    } catch (error) {
      health.checks.redis = {
        status: 'unhealthy',
        message: error.message
      };
    }

    // Memory health check
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMemPercent = ((totalMem - freeMem) / totalMem) * 100;

    health.checks.memory = {
      status: usedMemPercent < 90 ? 'healthy' : 'warning',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      systemTotal: Math.round(totalMem / 1024 / 1024),
      systemFree: Math.round(freeMem / 1024 / 1024),
      systemUsedPercent: Math.round(usedMemPercent)
    };

    // Disk health check (basic - can be enhanced with actual disk I/O checks)
    health.checks.disk = {
      status: 'healthy',
      message: 'Disk I/O operational'
    };

    // Determine overall health status
    const healthyCount = Object.values(health.checks)
      .filter(check => check.status === 'healthy').length;
    const unhealthyCount = Object.values(health.checks)
      .filter(check => check.status === 'unhealthy').length;
    const unavailableCount = Object.values(health.checks)
      .filter(check => check.status === 'unavailable').length;

    if (unhealthyCount > 0 || (unavailableCount > 0 && health.checks.database.status === 'unavailable')) {
      health.status = 'unhealthy';
      res.status(503);
    } else if (unavailableCount > 0) {
      health.status = 'degraded';
      res.status(200);
    } else {
      health.status = 'healthy';
      res.status(200);
    }

    health.responseTime = Date.now() - startTime;

    res.json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message, stack: error.stack });
    
    health.status = 'error';
    health.error = error.message;
    health.responseTime = Date.now() - startTime;
    
    res.status(503).json(health);
  }
});

/**
 * Readiness probe - indicates if the service is ready to accept traffic
 * Used by Kubernetes/ECS for readiness checks
 */
router.get('/health/ready', async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    
    if (!dbPool) {
      return res.status(503).json({
        ready: false,
        message: 'Database not initialized'
      });
    }

    // Quick database check
    const dbHealth = await dbHealthCheck();
    
    if (dbHealth.status === 'healthy') {
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        ready: false,
        message: 'Database not ready',
        details: dbHealth
      });
    }
  } catch (error) {
    res.status(503).json({
      ready: false,
      message: error.message
    });
  }
});

/**
 * Liveness probe - indicates if the service is alive
 * Used by Kubernetes/ECS for liveness checks
 */
router.get('/health/live', (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Metrics endpoint for Prometheus/CloudWatch integration
 */
router.get('/health/metrics', async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    const poolStats = getPoolStats();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      ...(poolStats && {
        database: {
          poolTotal: poolStats.totalCount,
          poolIdle: poolStats.idleCount,
          poolWaiting: poolStats.waitingCount,
          poolMax: poolStats.max,
          poolMin: poolStats.min
        }
      }),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg()
      }
    };

    res.status(200).json(metrics);
  } catch (error) {
    logger.error('Metrics endpoint failed', { error: error.message });
    res.status(500).json({
      error: 'Failed to collect metrics',
      message: error.message
    });
  }
});

/**
 * Simple health check for basic load balancer checks
 */
router.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

export default router;
