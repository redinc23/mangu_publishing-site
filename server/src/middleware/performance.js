import logger from '../utils/logger.js';

/**
 * Performance monitoring middleware
 * Tracks request duration and logs slow requests
 */
export const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  const startHrTime = process.hrtime();

  // Capture original end function
  const originalEnd = res.end;

  // Override res.end to capture response time
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    const hrDuration = process.hrtime(startHrTime);
    const durationMs = hrDuration[0] * 1000 + hrDuration[1] / 1e6;

    // Add response time header
    res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);

    // Log slow requests (> 1000ms)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        userAgent: req.get('user-agent'),
        correlationId: req.correlationId
      });
    }

    // Log very slow requests (> 3000ms) as errors
    if (duration > 3000) {
      logger.error('Very slow request detected', {
        method: req.method,
        path: req.path,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        query: req.query,
        correlationId: req.correlationId
      });
    }

    // Track performance metrics
    if (req.app.locals.performanceMetrics) {
      const metrics = req.app.locals.performanceMetrics;
      
      if (!metrics[req.path]) {
        metrics[req.path] = {
          count: 0,
          totalTime: 0,
          minTime: Infinity,
          maxTime: 0
        };
      }

      metrics[req.path].count++;
      metrics[req.path].totalTime += duration;
      metrics[req.path].minTime = Math.min(metrics[req.path].minTime, duration);
      metrics[req.path].maxTime = Math.max(metrics[req.path].maxTime, duration);
    }

    // Call original end function
    return originalEnd.apply(res, args);
  };

  next();
};

/**
 * Get performance metrics summary
 */
export const getPerformanceMetrics = (app) => {
  const metrics = app.locals.performanceMetrics || {};
  
  return Object.entries(metrics).map(([path, data]) => ({
    path,
    requests: data.count,
    avgTime: Math.round(data.totalTime / data.count),
    minTime: data.minTime === Infinity ? 0 : Math.round(data.minTime),
    maxTime: Math.round(data.maxTime),
    totalTime: Math.round(data.totalTime)
  })).sort((a, b) => b.avgTime - a.avgTime);
};

/**
 * Reset performance metrics
 */
export const resetPerformanceMetrics = (app) => {
  app.locals.performanceMetrics = {};
};

/**
 * Initialize performance tracking
 */
export const initPerformanceTracking = (app) => {
  app.locals.performanceMetrics = {};
  
  // Add endpoint to view performance metrics (admin only)
  app.get('/api/admin/performance', (req, res) => {
    const metrics = getPerformanceMetrics(app);
    res.json({
      metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  });
};

export default performanceMonitoring;
