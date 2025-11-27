import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { formatBook } from './utils/formatBook.js';
import { normalizeAuthors } from './utils/normalizeAuthors.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import stripeRoutes from './payments/stripe.routes.js';
import cartRoutes from './features/cart/cart.router.js';
import libraryRoutes from './features/library/library.router.js';
import authorsRoutes from './features/authors/authors.router.js';

// Load environment variables
dotenv.config();

export const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

app.locals.db = null;
app.locals.redis = null;

export function setDbPool(pool) {
    app.locals.db = pool ?? null;
}

export function setRedisClient(client) {
    app.locals.redis = client ?? null;
}

const BOOK_WITH_RELATIONS_QUERY = `
    SELECT b.*,
           array_agg(DISTINCT c.name) as categories,
           array_agg(DISTINCT a.name) as authors,
           p.name as publisher_name
    FROM books b
    LEFT JOIN book_categories bc ON b.id = bc.book_id
    LEFT JOIN categories c ON bc.category_id = c.id
    LEFT JOIN book_authors ba ON b.id = ba.book_id
    LEFT JOIN authors a ON ba.author_id = a.id
    LEFT JOIN publishers p ON b.publisher_id = p.id
    WHERE b.id = $1 AND b.is_active = true
    GROUP BY b.id, p.name
`;

async function fetchBookWithRelations(dbPool, bookId) {
    if (!dbPool) {
        return null;
    }

    const result = await dbPool.query(BOOK_WITH_RELATIONS_QUERY, [bookId]);
    return result.rows[0] || null;
}

function sanitizeAuthorNames(authorNames) {
    return Array.from(
        new Set(
            (authorNames || [])
                .map((name) => (typeof name === 'string' ? name.trim() : ''))
                .filter(Boolean)
        )
    );
}

async function attachAuthorsToBook(dbPool, bookId, authorNames) {
    if (!dbPool) {
        return;
    }

    const names = sanitizeAuthorNames(authorNames);

    for (const name of names) {
        const existing = await dbPool.query(
            'SELECT id FROM authors WHERE LOWER(name) = LOWER($1) LIMIT 1',
            [name]
        );

        let authorId;
        if (existing.rows.length > 0) {
            authorId = existing.rows[0].id;
        } else {
            const inserted = await dbPool.query(
                'INSERT INTO authors (name) VALUES ($1) RETURNING id',
                [name]
            );
            authorId = inserted.rows[0].id;
        }

        await dbPool.query(
            `INSERT INTO book_authors (book_id, author_id, role)
             VALUES ($1, $2, 'author')
             ON CONFLICT DO NOTHING`,
            [bookId, authorId]
        );
    }
}

async function replaceBookAuthors(dbPool, bookId, authorNames) {
    if (!dbPool) {
        return;
    }

    await dbPool.query('DELETE FROM book_authors WHERE book_id = $1', [bookId]);
    await attachAuthorsToBook(dbPool, bookId, authorNames);
}

function parseOptionalBoolean(value) {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'y'].includes(normalized)) {
            return true;
        }
        if (['false', '0', 'no', 'n'].includes(normalized)) {
            return false;
        }
        return Boolean(normalized);
    }

    return Boolean(value);
}

// Enhanced security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "https://js.stripe.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            frameSrc: ["https://js.stripe.com"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Request logging
if (NODE_ENV === 'development') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('combined', {
        skip: (req, res) => res.statusCode < 400
    }));
}

// Performance middleware
app.use(compression());

// Mount Stripe webhook BEFORE express.json() (webhook needs raw body for signature verification)
app.use('/api/stripe', stripeRoutes);

// Body parsing with size limits
app.use(express.json({ 
    limit: process.env.MAX_FILE_SIZE || '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: process.env.MAX_FILE_SIZE || '10mb' 
}));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Trust proxy for production deployments
app.set('trust proxy', true);

// Rate limiting
import rateLimit from 'express-rate-limit';

const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW) || 900000) / 60000)
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', generalLimiter);

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: {
            database: 'unknown',
            redis: 'unknown'
        }
    };

    try {
        const dbPool = req.app.locals.db;
        const redisClient = req.app.locals.redis;

        // Check database
        if (dbPool) {
            if (typeof dbPool.connect === 'function') {
                const client = await dbPool.connect();
                await client.query('SELECT 1');
                client.release();
            } else if (typeof dbPool.query === 'function') {
                await dbPool.query('SELECT 1');
            }
            health.services.database = 'healthy';
        } else {
            health.services.database = 'disconnected';
        }

        // Check Redis
        if (redisClient && typeof redisClient.ping === 'function') {
            await redisClient.ping();
            health.services.redis = 'healthy';
        } else {
            health.services.redis = 'disconnected';
        }

        // Determine overall status
        const unhealthyServices = Object.values(health.services)
            .filter(status => status !== 'healthy').length;
        
        if (unhealthyServices === 0) {
            health.status = 'healthy';
            res.status(200);
        } else if (unhealthyServices === Object.keys(health.services).length) {
            health.status = 'critical';
            res.status(503);
        } else {
            health.status = 'degraded';
            res.status(200);
        }

        res.json(health);
    } catch (error) {
        health.status = 'unhealthy';
        health.error = error.message;
        res.status(503).json(health);
    }
});

// Simple health check for load balancers
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', usersRoutes);

// Cart routes
app.use('/api/cart', cartRoutes);

// Library routes
app.use('/api/library', libraryRoutes);

// Authors routes
app.use('/api/authors', authorsRoutes);

// Books API with enhanced error handling and caching
app.get('/api/books', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = Math.max(parseInt(req.query.offset) || 0, 0);

        const query = `
            SELECT b.*,
                   array_agg(DISTINCT c.name) as categories,
                   array_agg(DISTINCT a.name) as authors
            FROM books b
            LEFT JOIN book_categories bc ON b.id = bc.book_id
            LEFT JOIN categories c ON bc.category_id = c.id
            LEFT JOIN book_authors ba ON b.id = ba.book_id
            LEFT JOIN authors a ON ba.author_id = a.id
            WHERE b.is_active = true
            GROUP BY b.id
            ORDER BY b.created_at DESC, b.rating DESC
            LIMIT $1 OFFSET $2
        `;

        const result = await dbPool.query(query, [limit, offset]);
        const books = result.rows.map(formatBook);

        res.json(books);
    } catch (error) {
        console.error('Books listing query error:', error);
        res.status(500).json({
            error: 'Failed to fetch books',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

app.get('/api/books/featured', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const redisClient = req.app.locals.redis;

        // Try cache first
        let cachedResult = null;
        if (redisClient && typeof redisClient.get === 'function') {
            try {
                const cached = await redisClient.get('books:featured');
                if (cached) {
                    cachedResult = JSON.parse(cached);
                }
            } catch (cacheError) {
                console.warn('Cache read error:', cacheError.message);
            }
        }

        if (cachedResult) {
            return res.json(formatBook(cachedResult));
        }

        // Query database
        const query = `
            SELECT b.*, 
                   array_agg(DISTINCT c.name) as categories,
                   array_agg(DISTINCT a.name) as authors
            FROM books b
            LEFT JOIN book_categories bc ON b.id = bc.book_id
            LEFT JOIN categories c ON bc.category_id = c.id
            LEFT JOIN book_authors ba ON b.id = ba.book_id  
            LEFT JOIN authors a ON ba.author_id = a.id
            WHERE b.is_featured = true AND b.is_active = true
            GROUP BY b.id
            ORDER BY b.rating DESC, b.created_at DESC
            LIMIT 1
        `;

        const result = await dbPool.query(query);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'No featured books found',
                suggestion: 'Check back later for new featured content'
            });
        }

        const book = result.rows[0];
        const formattedBook = formatBook(book);
        
        // Cache the result
        if (redisClient) {
            try {
                if (typeof redisClient.setEx === 'function') {
                    await redisClient.setEx('books:featured', 300, JSON.stringify(formattedBook));
                } else if (typeof redisClient.set === 'function') {
                    await redisClient.set('books:featured', JSON.stringify(formattedBook));
                }
            } catch (cacheError) {
                console.warn('Cache write error:', cacheError.message);
            }
        }

        res.json(formattedBook);
    } catch (error) {
        console.error('Featured book query error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch featured book',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

app.get('/api/books/trending', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const offset = Math.max(parseInt(req.query.offset) || 0, 0);
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const redisClient = req.app.locals.redis;

        // Try cache first
        const cacheKey = `books:trending:${limit}:${offset}`;
        let cachedResult = null;
        
        if (redisClient && typeof redisClient.get === 'function') {
            try {
                const cached = await redisClient.get(cacheKey);
                if (cached) {
                    cachedResult = JSON.parse(cached);
                }
            } catch (cacheError) {
                console.warn('Cache read error:', cacheError.message);
            }
        }

        if (cachedResult) {
            return res.json(cachedResult.map(formatBook));
        }

        const query = `
            SELECT b.*,
                   array_agg(DISTINCT c.name) as categories,
                   array_agg(DISTINCT a.name) as authors
            FROM books b
            LEFT JOIN book_categories bc ON b.id = bc.book_id
            LEFT JOIN categories c ON bc.category_id = c.id
            LEFT JOIN book_authors ba ON b.id = ba.book_id
            LEFT JOIN authors a ON ba.author_id = a.id
            WHERE b.is_active = true
            GROUP BY b.id
            ORDER BY 
                b.view_count DESC,
                b.rating DESC, 
                b.created_at DESC
            LIMIT $1 OFFSET $2
        `;

        const result = await dbPool.query(query, [limit, offset]);
        const books = result.rows.map(formatBook);
        
        // Cache the result
        if (redisClient) {
            try {
                if (typeof redisClient.setEx === 'function') {
                    await redisClient.setEx(cacheKey, 180, JSON.stringify(books));
                } else if (typeof redisClient.set === 'function') {
                    await redisClient.set(cacheKey, JSON.stringify(books));
                }
            } catch (cacheError) {
                console.warn('Cache write error:', cacheError.message);
            }
        }

        res.json(books);
    } catch (error) {
        console.error('Trending books query error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch trending books',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

app.get('/api/books/search', async (req, res) => {
    try {
        const { q, category, author, minPrice, maxPrice, sortBy = 'relevance' } = req.query;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = Math.max(parseInt(req.query.offset) || 0, 0);
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        if (!q && !category && !author) {
            return res.status(400).json({
                error: 'Search query, category, or author is required'
            });
        }

        let query = `
            SELECT DISTINCT b.*,
                   array_agg(DISTINCT c.name) as categories,
                   array_agg(DISTINCT a.name) as authors
            FROM books b
            LEFT JOIN book_categories bc ON b.id = bc.book_id
            LEFT JOIN categories c ON bc.category_id = c.id
            LEFT JOIN book_authors ba ON b.id = ba.book_id
            LEFT JOIN authors a ON ba.author_id = a.id
            WHERE b.is_active = true
        `;

        const params = [];
        let paramCount = 0;

        if (q) {
            paramCount++;
            query += ` AND (b.title ILIKE ${paramCount} OR b.description ILIKE ${paramCount})`;
            params.push(`%${q}%`);
        }

        if (category) {
            paramCount++;
            query += ` AND c.slug = ${paramCount}`;
            params.push(category);
        }

        if (author) {
            paramCount++;
            query += ` AND a.name ILIKE ${paramCount}`;
            params.push(`%${author}%`);
        }

        if (minPrice) {
            paramCount++;
            query += ` AND b.price_cents >= ${paramCount}`;
            params.push(parseInt(minPrice) * 100);
        }

        if (maxPrice) {
            paramCount++;
            query += ` AND b.price_cents <= ${paramCount}`;
            params.push(parseInt(maxPrice) * 100);
        }

        query += ' GROUP BY b.id';

        // Add sorting
        switch (sortBy) {
            case 'price_asc':
                query += ' ORDER BY b.price_cents ASC';
                break;
            case 'price_desc':
                query += ' ORDER BY b.price_cents DESC';
                break;
            case 'rating':
                query += ' ORDER BY b.rating DESC, b.rating_count DESC';
                break;
            case 'newest':
                query += ' ORDER BY b.publication_date DESC';
                break;
            case 'popular':
                query += ' ORDER BY b.view_count DESC, b.rating DESC';
                break;
            default:
                query += ' ORDER BY b.rating DESC, b.created_at DESC';
        }

        paramCount++;
        query += ` LIMIT ${paramCount}`;
        params.push(limit);

        paramCount++;
        query += ` OFFSET ${paramCount}`;
        params.push(offset);

        const result = await dbPool.query(query, params);
        const books = result.rows.map(formatBook);

        res.json({
            books,
            pagination: {
                limit,
                offset,
                total: result.rowCount
            },
            filters: {
                query: q,
                category,
                author,
                minPrice,
                maxPrice,
                sortBy
            }
        });
    } catch (error) {
        console.error('Search query error:', error);
        res.status(500).json({ 
            error: 'Search failed',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

app.post('/api/books', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const { title } = req.body;

        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const normalizedAuthors = normalizeAuthors(req.body.authors);
        const authorNames = normalizedAuthors
            .map((author) => author?.name)
            .filter(Boolean);

        let priceCents = 0;
        if (req.body.price_cents !== undefined && req.body.price_cents !== null) {
            priceCents = parseInt(req.body.price_cents, 10);
            if (!Number.isFinite(priceCents) || priceCents < 0) {
                return res.status(400).json({ error: 'Invalid price_cents value' });
            }
        }

        const publicationDate = req.body.publication_date || null;
        const description = req.body.description || null;
        const isFeatured = parseOptionalBoolean(req.body.is_featured) ?? false;
        const isNewRelease = parseOptionalBoolean(req.body.is_new_release) ?? false;
        const tags = Array.isArray(req.body.tags) ? req.body.tags : null;

        const insertQuery = `
            INSERT INTO books (
                title,
                description,
                price_cents,
                publication_date,
                is_featured,
                is_new_release,
                tags
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const insertParams = [
            title.trim(),
            description,
            priceCents,
            publicationDate,
            isFeatured,
            isNewRelease,
            tags
        ];

        const insertResult = await dbPool.query(insertQuery, insertParams);
        const createdBook = insertResult.rows[0];

        if (authorNames.length > 0) {
            await attachAuthorsToBook(dbPool, createdBook.id, authorNames);
        }

        const detailedBook = (await fetchBookWithRelations(dbPool, createdBook.id)) ?? {
            ...createdBook,
            authors: authorNames
        };

        res.status(201).json(formatBook(detailedBook));
    } catch (error) {
        console.error('Create book error:', error);
        res.status(500).json({
            error: 'Failed to create book',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

app.put('/api/books/:id', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const { id } = req.params;

        if (!UUID_REGEX.test(id)) {
            return res.status(400).json({ error: 'Invalid book ID format' });
        }

        const normalizedAuthors =
            req.body.authors !== undefined ? normalizeAuthors(req.body.authors) : null;
        const authorNames = normalizedAuthors
            ? normalizedAuthors.map((author) => author?.name).filter(Boolean)
            : null;

        const fields = [];
        const params = [];
        let paramIndex = 1;

        if (req.body.title !== undefined) {
            const nextTitle =
                typeof req.body.title === 'string' ? req.body.title.trim() : '';
            if (!nextTitle) {
                return res.status(400).json({ error: 'Title cannot be empty' });
            }
            fields.push(`title = $${paramIndex++}`);
            params.push(nextTitle);
        }

        if (req.body.description !== undefined) {
            fields.push(`description = $${paramIndex++}`);
            params.push(req.body.description || null);
        }

        if (req.body.price_cents !== undefined) {
            const nextPrice = parseInt(req.body.price_cents, 10);
            if (!Number.isFinite(nextPrice) || nextPrice < 0) {
                return res.status(400).json({ error: 'Invalid price_cents value' });
            }
            fields.push(`price_cents = $${paramIndex++}`);
            params.push(nextPrice);
        }

        if (req.body.publication_date !== undefined) {
            fields.push(`publication_date = $${paramIndex++}`);
            params.push(req.body.publication_date || null);
        }

        if (req.body.is_featured !== undefined) {
            const parsed = parseOptionalBoolean(req.body.is_featured);
            if (parsed === undefined) {
                return res.status(400).json({ error: 'Invalid is_featured value' });
            }
            fields.push(`is_featured = $${paramIndex++}`);
            params.push(parsed);
        }

        if (req.body.is_new_release !== undefined) {
            const parsed = parseOptionalBoolean(req.body.is_new_release);
            if (parsed === undefined) {
                return res.status(400).json({ error: 'Invalid is_new_release value' });
            }
            fields.push(`is_new_release = $${paramIndex++}`);
            params.push(parsed);
        }

        if (req.body.tags !== undefined) {
            if (req.body.tags !== null && !Array.isArray(req.body.tags)) {
                return res.status(400).json({ error: 'Tags must be an array of strings' });
            }
            fields.push(`tags = $${paramIndex++}`);
            params.push(req.body.tags);
        }

        let updatedBook = null;

        if (fields.length > 0) {
            fields.push(`updated_at = CURRENT_TIMESTAMP`);
            const updateQuery = `
                UPDATE books
                SET ${fields.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            params.push(id);
            const updateResult = await dbPool.query(updateQuery, params);

            if (updateResult.rows.length === 0) {
                return res.status(404).json({ error: 'Book not found' });
            }

            updatedBook = updateResult.rows[0];
        } else {
            const existing = await dbPool.query('SELECT * FROM books WHERE id = $1', [id]);
            if (existing.rows.length === 0) {
                return res.status(404).json({ error: 'Book not found' });
            }
            updatedBook = existing.rows[0];
        }

        if (authorNames !== null) {
            await replaceBookAuthors(dbPool, id, authorNames);
        }

        const detailedBook = (await fetchBookWithRelations(dbPool, updatedBook.id)) ?? {
            ...updatedBook,
            authors: authorNames ?? updatedBook.authors
        };

        res.json(formatBook(detailedBook));
    } catch (error) {
        console.error('Update book error:', error);
        res.status(500).json({
            error: 'Failed to update book',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

app.get('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate UUID format
        if (!UUID_REGEX.test(id)) {
            return res.status(400).json({ error: 'Invalid book ID format' });
        }

        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const book = await fetchBookWithRelations(dbPool, id);
        
        if (!book) {
            return res.status(404).json({ 
                error: 'Book not found',
                suggestion: 'Check the book ID or browse our catalog'
            });
        }

        // Increment view count asynchronously
        dbPool.query('UPDATE books SET view_count = view_count + 1 WHERE id = $1', [id])
            .catch(err => console.warn('Failed to update view count:', err.message));

        res.json(formatBook(book));
    } catch (error) {
        console.error('Book detail query error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch book details',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Categories API
app.get('/api/categories', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const query = `
            SELECT c.*, COUNT(bc.book_id) as book_count
            FROM categories c
            LEFT JOIN book_categories bc ON c.id = bc.category_id
            LEFT JOIN books b ON bc.book_id = b.id AND b.is_active = true
            WHERE c.is_active = true
            GROUP BY c.id
            ORDER BY c.sort_order ASC, c.name ASC
        `;

        const result = await dbPool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Categories query error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch categories',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Feature Flags and Config Endpoint
app.get('/api/config', async (req, res) => {
    try {
        // Import feature flags dynamically
        const featureFlagsModule = await import('./config/featureFlags.js');
        const { getFeatureFlagsJSON, getBetaConfig } = featureFlagsModule.default;
        
        const config = {
            features: getFeatureFlagsJSON(),
            beta: getBetaConfig(),
            environment: NODE_ENV,
            version: process.env.APP_VERSION || '1.0.0',
        };
        
        res.json(config);
    } catch (error) {
        console.error('Config endpoint error:', error);
        res.status(500).json({ 
            error: 'Failed to load configuration',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Beta Feedback Endpoint
app.post('/api/beta/feedback', express.json(), async (req, res) => {
    try {
        const { feedback, url, timestamp } = req.body;
        
        if (!feedback || typeof feedback !== 'string') {
            return res.status(400).json({ error: 'Feedback is required' });
        }

        // Log feedback to console in development
        if (NODE_ENV === 'development' || NODE_ENV === 'beta') {
            console.log('=== BETA FEEDBACK ===');
            console.log('Time:', timestamp || new Date().toISOString());
            console.log('URL:', url || 'Not provided');
            console.log('Feedback:', feedback);
            console.log('IP:', req.ip);
            console.log('User-Agent:', req.get('User-Agent'));
            console.log('=====================');
        }

        // Store in database if available
        const dbPool = req.app.locals.db;
        if (dbPool) {
            try {
                await dbPool.query(
                    `INSERT INTO beta_feedback (feedback, url, user_agent, ip_address, created_at)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        feedback.substring(0, 5000), // Limit feedback length
                        url || null,
                        req.get('User-Agent') || null,
                        req.ip || null,
                        timestamp || new Date().toISOString()
                    ]
                );
            } catch (dbError) {
                // Log error but don't fail the request
                console.error('Failed to store feedback in database:', dbError.message);
            }
        }

        // TODO: In production, also send to monitoring service (e.g., Sentry, Slack webhook)
        // Example:
        // await sendToSlack({ feedback, url, timestamp });

        res.json({ 
            success: true, 
            message: 'Thank you for your feedback!' 
        });
    } catch (error) {
        console.error('Beta feedback error:', error);
        res.status(500).json({ 
            error: 'Failed to submit feedback',
            message: NODE_ENV === 'development' ? error.message : 'Please try again later'
        });
    }
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.details || err.message
        });
    }

    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: 'CORS policy violation'
        });
    }

    if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
            error: 'Database connection failed'
        });
    }

    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    
    res.status(statusCode).json({
        error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
        ...(NODE_ENV === 'development' && {
            stack: err.stack,
            path: req.path
        })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method,
        suggestion: 'Check the API documentation for available endpoints'
    });
});

export { NODE_ENV };

export default app;
