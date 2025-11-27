import pg from 'pg';
import logger, { createContextLogger } from '../utils/logger.js';

const { Pool } = pg;

/**
 * Database configuration with connection pooling, health checks, and query logging
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Database pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: parseInt(process.env.DATABASE_POOL_MAX || '20', 10), // Maximum pool size
  min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10), // Minimum pool size
  idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '600000', 10), // 10 minutes
  connectionTimeoutMillis: parseInt(process.env.DATABASE_TIMEOUT || '30000', 10), // 30 seconds
  // Query timeout
  statement_timeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '30000', 10),
  // Application name for connection tracking
  application_name: 'mangu-server',
  // SSL configuration for production
  ...(isProduction && process.env.DATABASE_URL?.includes('amazonaws.com') && {
    ssl: {
      rejectUnauthorized: false
    }
  })
};

// Slow query threshold (ms)
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000', 10);

// Query logging configuration
const ENABLE_QUERY_LOGGING = process.env.ENABLE_QUERY_LOGGING === 'true' || !isProduction;

let pool = null;
const dbLogger = createContextLogger({ component: 'database' });

/**
 * Initialize database connection pool
 */
export async function initializePool() {
  if (pool) {
    dbLogger.warn('Database pool already initialized');
    return pool;
  }

  try {
    pool = new Pool(poolConfig);

    // Pool event handlers
    pool.on('connect', (client) => {
      dbLogger.debug('New database client connected', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      });
    });

    pool.on('acquire', (client) => {
      dbLogger.debug('Client acquired from pool', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      });
    });

    pool.on('remove', (client) => {
      dbLogger.debug('Client removed from pool', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      });
    });

    pool.on('error', (err, client) => {
      dbLogger.error('Unexpected database pool error', {
        error: err.message,
        stack: err.stack
      });
    });

    // Test connection
    await testConnection();

    dbLogger.info('Database pool initialized successfully', {
      max: poolConfig.max,
      min: poolConfig.min,
      idleTimeout: poolConfig.idleTimeoutMillis,
      connectionTimeout: poolConfig.connectionTimeoutMillis
    });

    return pool;
  } catch (error) {
    dbLogger.error('Failed to initialize database pool', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Test database connection
 */
export async function testConnection() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    dbLogger.info('Database connection test successful', {
      currentTime: result.rows[0].current_time,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    });
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Execute query with logging and error handling
 */
export async function query(text, params = [], options = {}) {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const start = Date.now();
  const queryId = Math.random().toString(36).substring(7);

  try {
    if (ENABLE_QUERY_LOGGING) {
      dbLogger.debug('Executing query', {
        queryId,
        text: text.substring(0, 200),
        params: params.length
      });
    }

    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      dbLogger.warn('Slow query detected', {
        queryId,
        duration,
        text: text.substring(0, 200),
        params: params.length,
        rows: result.rowCount
      });
    } else if (ENABLE_QUERY_LOGGING) {
      dbLogger.debug('Query completed', {
        queryId,
        duration,
        rows: result.rowCount
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    dbLogger.error('Query execution failed', {
      queryId,
      duration,
      error: error.message,
      text: text.substring(0, 200),
      params: params.length
    });
    throw error;
  }
}

/**
 * Execute transaction with automatic rollback on error
 */
export async function transaction(callback) {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const client = await pool.connect();
  const transactionId = Math.random().toString(36).substring(7);

  try {
    await client.query('BEGIN');
    dbLogger.debug('Transaction started', { transactionId });

    const result = await callback(client);

    await client.query('COMMIT');
    dbLogger.debug('Transaction committed', { transactionId });

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    dbLogger.error('Transaction rolled back', {
      transactionId,
      error: error.message
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get pool statistics
 */
export function getPoolStats() {
  if (!pool) {
    return null;
  }

  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    max: poolConfig.max,
    min: poolConfig.min
  };
}

/**
 * Health check for database
 */
export async function healthCheck() {
  try {
    if (!pool) {
      return {
        status: 'unhealthy',
        message: 'Database pool not initialized'
      };
    }

    const start = Date.now();
    const result = await pool.query('SELECT 1 as health_check');
    const duration = Date.now() - start;

    const stats = getPoolStats();

    return {
      status: 'healthy',
      responseTime: duration,
      pool: stats
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      error: error.name
    };
  }
}

/**
 * Graceful shutdown
 */
export async function shutdown() {
  if (!pool) {
    return;
  }

  try {
    dbLogger.info('Shutting down database pool...');
    await pool.end();
    pool = null;
    dbLogger.info('Database pool shut down successfully');
  } catch (error) {
    dbLogger.error('Error shutting down database pool', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Get pool instance (use with caution)
 */
export function getPool() {
  return pool;
}

export default {
  initializePool,
  testConnection,
  query,
  transaction,
  getPoolStats,
  healthCheck,
  shutdown,
  getPool
};
