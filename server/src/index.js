import app, { NODE_ENV, setDbPool, setRedisClient } from './app.js';
import pg from 'pg';
import { createClient as createRedisClient } from 'redis';

const { Pool } = pg;

const PORT = process.env.PORT || 3001;

let dbPool = null;
let redisClient = null;
let serverInstance = null;
let shutdownRegistered = false;

// Mock data for development when database is unavailable
const MOCK_BOOKS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'The Great Adventure',
    description: 'An epic journey through unknown lands filled with mystery and wonder.',
    price_cents: 1999,
    rating: 4.5,
    rating_count: 128,
    cover_image_url: 'https://picsum.photos/seed/book1/300/450',
    publication_date: '2024-01-15',
    is_featured: true,
    is_new_release: true,
    is_active: true,
    view_count: 1500,
    authors: ['Jane Smith'],
    categories: ['Adventure', 'Fiction']
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Mystery of the Deep',
    description: 'A thrilling mystery that will keep you on the edge of your seat.',
    price_cents: 1499,
    rating: 4.2,
    rating_count: 89,
    cover_image_url: 'https://picsum.photos/seed/book2/300/450',
    publication_date: '2024-02-20',
    is_featured: false,
    is_new_release: true,
    is_active: true,
    view_count: 980,
    authors: ['John Doe'],
    categories: ['Mystery', 'Thriller']
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Science of Tomorrow',
    description: 'Exploring the frontiers of scientific discovery and innovation.',
    price_cents: 2499,
    rating: 4.8,
    rating_count: 256,
    cover_image_url: 'https://picsum.photos/seed/book3/300/450',
    publication_date: '2024-03-10',
    is_featured: false,
    is_new_release: false,
    is_active: true,
    view_count: 2100,
    authors: ['Dr. Emily Chen'],
    categories: ['Science', 'Non-Fiction']
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Love in Paris',
    description: 'A romantic tale set in the beautiful streets of Paris.',
    price_cents: 1299,
    rating: 4.0,
    rating_count: 67,
    cover_image_url: 'https://picsum.photos/seed/book4/300/450',
    publication_date: '2024-04-05',
    is_featured: false,
    is_new_release: true,
    is_active: true,
    view_count: 750,
    authors: ['Marie Laurent'],
    categories: ['Romance', 'Fiction']
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'The Dark Forest',
    description: 'A spine-chilling horror novel that will haunt your dreams.',
    price_cents: 1799,
    rating: 4.6,
    rating_count: 145,
    cover_image_url: 'https://picsum.photos/seed/book5/300/450',
    publication_date: '2024-05-12',
    is_featured: false,
    is_new_release: false,
    is_active: true,
    view_count: 1200,
    authors: ['Stephen Dark'],
    categories: ['Horror', 'Fiction']
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    title: 'Business Mastery',
    description: 'Learn the secrets of successful entrepreneurs and business leaders.',
    price_cents: 2999,
    rating: 4.3,
    rating_count: 92,
    cover_image_url: 'https://picsum.photos/seed/book6/300/450',
    publication_date: '2024-06-01',
    is_featured: false,
    is_new_release: false,
    is_active: true,
    view_count: 890,
    authors: ['Robert Business'],
    categories: ['Business', 'Self-Help']
  }
];

const MOCK_CATEGORIES = [
  { id: 1, name: 'Fiction', slug: 'fiction', is_active: true, sort_order: 1, book_count: 3 },
  { id: 2, name: 'Non-Fiction', slug: 'non-fiction', is_active: true, sort_order: 2, book_count: 2 },
  { id: 3, name: 'Mystery', slug: 'mystery', is_active: true, sort_order: 3, book_count: 1 },
  { id: 4, name: 'Romance', slug: 'romance', is_active: true, sort_order: 4, book_count: 1 },
  { id: 5, name: 'Science', slug: 'science', is_active: true, sort_order: 5, book_count: 1 },
  { id: 6, name: 'Horror', slug: 'horror', is_active: true, sort_order: 6, book_count: 1 },
  { id: 7, name: 'Adventure', slug: 'adventure', is_active: true, sort_order: 7, book_count: 1 },
  { id: 8, name: 'Thriller', slug: 'thriller', is_active: true, sort_order: 8, book_count: 1 }
];

function createDatabaseStub() {
  return {
    query: async (queryStr, params) => {
      if (queryStr.includes('SELECT NOW()') || queryStr.includes('SELECT 1')) {
        return { rows: [{ now: new Date() }] };
      }
      if (queryStr.includes('FROM books') && queryStr.includes('is_featured = true')) {
        const featured = MOCK_BOOKS.find(b => b.is_featured);
        return { rows: featured ? [featured] : [], rowCount: featured ? 1 : 0 };
      }
      if (queryStr.includes('FROM books') && queryStr.includes('WHERE b.id = $1')) {
        const book = MOCK_BOOKS.find(b => b.id === params[0]);
        return { rows: book ? [book] : [], rowCount: book ? 1 : 0 };
      }
      if (queryStr.includes('FROM books')) {
        const limit = params?.[0] || 20;
        const offset = params?.[1] || 0;
        return { rows: MOCK_BOOKS.slice(offset, offset + limit), rowCount: MOCK_BOOKS.length };
      }
      if (queryStr.includes('FROM categories')) {
        return { rows: MOCK_CATEGORIES, rowCount: MOCK_CATEGORIES.length };
      }
      return { rows: [], rowCount: 0 };
    },
    connect: async () => ({
      query: async () => ({ rows: [{ now: new Date() }] }),
      release: () => {}
    }),
    end: async () => {}
  };
}

async function initializeDatabase() {
  const disableDatabase = process.env.DISABLE_DATABASE === '1';

  if (disableDatabase) {
    dbPool = createDatabaseStub();
    setDbPool(dbPool);
    console.log('ℹ️  Database disabled via DISABLE_DATABASE=1 (using mock data)');
    return true;
  }

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
    console.log('ℹ️  Falling back to mock data');
    dbPool = createDatabaseStub();
    setDbPool(dbPool);
    return true;
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
