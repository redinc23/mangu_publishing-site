import app, { NODE_ENV, setDbPool, setRedisClient } from './app.js';
import pg from 'pg';
import { createClient as createRedisClient } from 'redis';
import { validateEnv, requireValidEnv } from './config/env.js';

const { Pool } = pg;

// Validate environment variables on startup
requireValidEnv();

const PORT = process.env.PORT || 3001;

let dbPool = null;
let redisClient = null;
let serverInstance = null;
let shutdownRegistered = false;

async function initializeDatabase() {
  try {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
      min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
      idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '600000', 10),
      connectionTimeoutMillis: parseInt(process.env.DATABASE_TIMEOUT || '30000', 10)
    });

    const client = await dbPool.connect();
    await client.query('SELECT NOW()');
    client.release();

    setDbPool(dbPool);
    console.log('✅ PostgreSQL connected successfully');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    setDbPool(null);
    if (dbPool) {
      await dbPool.end().catch(() => {});
      dbPool = null;
    }
    return false;
  }
}

function createRedisStub() {
  return {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    quit: async () => undefined
  };
}

async function initializeRedis() {
  const disableRedis = process.env.DISABLE_REDIS === '1';

  if (disableRedis) {
    redisClient = createRedisStub();
    setRedisClient(redisClient);
    console.log('ℹ️  Redis disabled via DISABLE_REDIS=1 (using stub)');
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
      console.warn('[redis] error:', err?.message || err);
    });

    await redisClient.connect();
    await redisClient.ping();

    setRedisClient(redisClient);
    console.log(`✅ Redis connected to ${redisUrl}`);
    return true;
  } catch (error) {
    console.warn('[redis] unavailable, falling back to stub:', error?.message || error);
    redisClient = createRedisStub();
    setRedisClient(redisClient);
    return false;
  }
}

async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);

  try {
    if (serverInstance) {
      await new Promise((resolve, reject) => {
        serverInstance.close((err) => (err ? reject(err) : resolve()));
      });
      console.log('🛑 HTTP server closed');
    }

    if (dbPool) {
      await dbPool.end();
      console.log('📊 Database pool closed');
      dbPool = null;
    }

    if (redisClient) {
      await redisClient.quit();
      console.log('🔴 Redis connection closed');
      redisClient = null;
    }

    setDbPool(null);
    setRedisClient(null);

    clearTimeout(shutdownTimeout);
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
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
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });
}

export async function startServer() {
  try {
    console.log(`🚀 Starting MANGU Server v${process.env.npm_package_version || '1.0.0'}`);
    console.log(`📊 Environment: ${NODE_ENV}`);

    const dbConnected = await initializeDatabase();
    const redisConnected = await initializeRedis();

    if (!dbConnected) {
      console.error('❌ Cannot start server without database connection');
      process.exit(1);
    }

    if (!redisConnected) {
      console.warn('⚠️  Starting without Redis (caching disabled)');
    }

    serverInstance = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 MANGU server running on port ${PORT}`);
      console.log(`📚 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📖 API docs: http://localhost:${PORT}/api/docs`);

      if (NODE_ENV === 'development') {
        console.log(`\n🔧 Development endpoints:`);
        console.log(`   Frontend: http://localhost:5173`);
        console.log(`   Database: http://localhost:8080 (Adminer)`);
        console.log(`   Mail: http://localhost:8025 (MailHog)`);
      }
    });

    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });

    registerShutdownHandlers();

    return serverInstance;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { initializeDatabase, initializeRedis };

export default app;
