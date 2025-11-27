import logger from './utils/logger.js';
import * as Sentry from '@sentry/node';
import app, { NODE_ENV, setDbPool, setRedisClient } from './app.js';
import { createClient as createRedisClient } from 'redis';
import { initializePool as initializeDatabasePool, shutdown as shutdownDatabase } from './config/database.js';
import { initializeSocket, shutdown as shutdownSocket } from './services/socket.js';

const sentryIntegrations = [];

if (process.env.SENTRY_DSN) {
  try {
    const { nodeProfilingIntegration } = await import('@sentry/profiling-node');
    if (typeof nodeProfilingIntegration === 'function') {
      sentryIntegrations.push(nodeProfilingIntegration());
    }
  } catch (error) {
    logger.warn('Sentry profiling integration unavailable; continuing without CPU profiler', {
      error: error?.message || error
    });
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: NODE_ENV,
    integrations: sentryIntegrations,
    tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

const PORT = process.env.PORT || 3009;

let dbPool = null;
let redisClient = null;
let serverInstance = null;
let socketIO = null;
let shutdownRegistered = false;

const isTruthyEnv = (value) => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'y', 'on'].includes(String(value).trim().toLowerCase());
};

const devAllowsNoDb = () =>
  NODE_ENV === 'development' && isTruthyEnv(process.env.DEV_ALLOW_NO_DB);

async function initializeDatabase() {
  try {
    dbPool = await initializeDatabasePool();
    setDbPool(dbPool);
    logger.info('PostgreSQL connected successfully');
    return true;
  } catch (error) {
    logger.error('PostgreSQL connection failed', { error: error.message });
    setDbPool(null);
    dbPool = null;
    return false;
  }
}

function createRedisStub() {
  return {
    get: async () => null,
    set: async () => 'OK',
    setEx: async () => 'OK',
    del: async () => 1,
    ping: async () => 'PONG',
    quit: async () => undefined,
    sendCommand: () => Promise.resolve()
  };
}

async function initializeRedis() {
  const disableRedis = process.env.DISABLE_REDIS === '1';

  if (disableRedis) {
    redisClient = createRedisStub();
    setRedisClient(redisClient);
    logger.info('Redis disabled via DISABLE_REDIS=1 (using stub)');
    return false;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createRedisClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    redisClient.on('error', (err) => {
      logger.warn('Redis error', { error: err?.message || err });
    });

    await redisClient.connect();
    await redisClient.ping();

    setRedisClient(redisClient);
    logger.info('Redis connected', { url: redisUrl });
    return true;
  } catch (error) {
    logger.warn('Redis unavailable, falling back to stub', { error: error?.message || error });
    redisClient = createRedisStub();
    setRedisClient(redisClient);
    return false;
  }
}

async function gracefulShutdown(signal) {
  logger.info('Starting graceful shutdown', { signal });

  const shutdownTimeout = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);

  try {
    // Close Socket.IO connections
    if (socketIO) {
      await shutdownSocket();
      logger.info('Socket.IO closed');
      socketIO = null;
    }

    // Close HTTP server
    if (serverInstance) {
      await new Promise((resolve, reject) => {
        serverInstance.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('HTTP server closed');
    }

    // Close database connections
    if (dbPool) {
      await shutdownDatabase();
      logger.info('Database pool closed');
      dbPool = null;
    }

    // Close Redis connections
    if (redisClient && typeof redisClient.quit === 'function') {
      await redisClient.quit();
      logger.info('Redis connection closed');
      redisClient = null;
    }

    setDbPool(null);
    setRedisClient(null);

    clearTimeout(shutdownTimeout);
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

function registerShutdownHandlers() {
  if (shutdownRegistered) {
    return;
  }

  shutdownRegistered = true;

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });
}

export async function startServer() {
  try {
    logger.info('Starting MANGU Server', {
      version: process.env.npm_package_version || '1.0.0',
      environment: NODE_ENV,
      nodeVersion: process.version
    });

    const dbConnected = await initializeDatabase();
    const redisConnected = await initializeRedis();

    if (!dbConnected) {
      if (devAllowsNoDb()) {
        logger.warn('[dev-no-db] PostgreSQL unavailable but DEV_ALLOW_NO_DB=1. Continuing without a database connection.');
        logger.warn('[dev-no-db] Expect 503/500 responses from DB-backed APIs. This mode is for UI smoke tests only.');
      } else {
        logger.error('Cannot start server without database connection');
        logger.error('Ensure LOCAL PostgreSQL is running and DATABASE_URL points at it (e.g. postgresql://postgres:[password]@localhost:5432/mangu_dev)');
        process.exit(1);
      }
    }

    if (!redisConnected) {
      logger.warn('Starting without Redis (caching disabled)');
    }

    serverInstance = app.listen(PORT, '0.0.0.0', () => {
      logger.info('MANGU server started', {
        port: PORT,
        healthCheck: `http://localhost:${PORT}/api/health`,
        apiDocs: `http://localhost:${PORT}/api/docs`
      });

      if (NODE_ENV === 'development') {
        logger.info('Development endpoints', {
          frontend: 'http://localhost:5174',
          database: 'http://localhost:8080 (Adminer)',
          mail: 'http://localhost:8025 (MailHog)'
        });
      }
    });

    // Initialize Socket.IO
    if (process.env.ENABLE_WEBSOCKET !== 'false') {
      socketIO = initializeSocket(serverInstance, {
        cors: {
          origin: process.env.CLIENT_URL || 'http://localhost:5174',
          methods: ['GET', 'POST'],
          credentials: true
        }
      });
      logger.info('Socket.IO initialized');
    }

    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error('Port already in use', { port: PORT });
        process.exit(1);
      } else {
        logger.error('Server error', { error: err.message });
        process.exit(1);
      }
    });

    registerShutdownHandlers();

    return serverInstance;
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { initializeDatabase, initializeRedis };

export default app;
