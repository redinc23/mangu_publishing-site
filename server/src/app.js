import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { formatBook } from './utils/formatBook.js';
import { normalizeAuthors } from './utils/normalizeAuthors.js';
import notionService from './services/notion.js';
import logger, { correlationIdMiddleware, requestLogger } from './utils/logger.js';
import { createRateLimiter, createStrictRateLimiter } from './middleware/rateLimiter.js';
import healthRouter from './routes/health.js';
import usersRouter from './routes/users.js';
import paymentsRouter from './payments/stripe.routes.js';
import adminRouter from './features/admin/admin.router.js';
import cartRouter from './features/cart/cart.router.js';
import libraryRouter from './features/library/library.router.js';
import { authCognito } from './middleware/authCognito.js';
import {
    UUID_REGEX,
    BOOK_WITH_RELATIONS_QUERY,
    fetchBookWithRelations,
    sanitizeAuthorNames,
    attachAuthorsToBook,
    replaceBookAuthors,
    parseOptionalBoolean
} from './features/books/bookHelpers.js';
import { validateEnv } from './config/validateEnv.js';
import 'express-async-errors';

// Load environment variables from server/.env
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Validate required environment variables
validateEnv();

export const app = express();

const NODE_ENV = process.env.NODE_ENV || 'development';

app.locals.db = null;
app.locals.redis = null;

export function setDbPool(pool) {
    app.locals.db = pool ?? null;
}

export function setRedisClient(client) {
    app.locals.redis = client ?? null;
}

const hasCognitoAdminConfig = Boolean(
    process.env.COGNITO_REGION &&
    process.env.COGNITO_USER_POOL_ID &&
    process.env.COGNITO_APP_CLIENT_ID
);

const ADMIN_ROLE_NAMES = new Set(['admin', 'administrator', 'super-admin']);

function toStringArray(value) {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value
            .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    return [];
}

function collectRequestRoles(req) {
    const roles = new Set();

    const authPayload = req.auth?.payload;
    toStringArray(authPayload?.['cognito:groups']).forEach((role) => roles.add(role));
    toStringArray(authPayload?.groups).forEach((role) => roles.add(role));
    toStringArray(req.auth?.groups).forEach((role) => roles.add(role));
    toStringArray(req.user?.groups).forEach((role) => roles.add(role));

    return Array.from(roles);
}

function requestHasAdminRole(req) {
    const roles = collectRequestRoles(req);
    if (roles.length > 0) {
        req.adminRoles = roles;
    }
    return roles.some((role) => ADMIN_ROLE_NAMES.has(role.toLowerCase()));
}

function createAdminAuthMiddleware() {
    const cognitoMiddleware = authCognito();
    return (req, res, next) => {
        cognitoMiddleware(req, res, () => {
            if (requestHasAdminRole(req)) {
                req.isAdmin = true;
                return next();
            }
            return res.status(403).json({ error: 'Admin access required' });
        });
    };
}

const adminAuthMiddleware = createAdminAuthMiddleware();


// Sentry request handler must be first
if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
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

// Correlation ID and structured logging middleware
app.use(correlationIdMiddleware);
app.use(requestLogger);

// Performance middleware
app.use(compression());

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
// Support both CORS_ORIGINS (plural) and CORS_ORIGIN (singular) for compatibility
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN;
const defaultOrigins = [
    'http://localhost:5179',
    'http://localhost:3009',
    'http://127.0.0.1:5179',
    'http://127.0.0.1:3009',
    'http://0.0.0.0:5179',
    'http://0.0.0.0:3009'
];
const corsOrigins = corsOriginsEnv
    ? corsOriginsEnv.split(',').map(origin => origin.trim()).filter(Boolean)
    : defaultOrigins;

const corsOriginPatterns = [
    /^https?:\/\/localhost(?::\d+)?$/i,
    /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i,
    /^https?:\/\/0\.0\.0\.0(?::\d+)?$/i,
    /^https?:\/\/.*\.repl\.co$/i,
    /^https?:\/\/.*\.id\.repl\.co$/i
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        const isExactMatch = corsOrigins.includes(origin);
        const isPatternMatch = corsOriginPatterns.some((pattern) => pattern.test(origin));

        if (isExactMatch || isPatternMatch) {
            return callback(null, true);
        }

        if (NODE_ENV !== 'production') {
            logger.warn('CORS dev fallback - allowing unmatched origin', { origin });
            return callback(null, true);
        }

        logger.warn('CORS blocked origin', { origin });
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Correlation-Id',
        'X-Request-Id'
    ],
    exposedHeaders: ['X-Correlation-Id']
}));

// Trust proxy for production deployments
app.set('trust proxy', true);

// Rate limiting - lazy initialization to use Redis once available
let apiRateLimiter = null;
app.use('/api/', (req, res, next) => {
    if (!apiRateLimiter) {
        apiRateLimiter = createRateLimiter(req.app.locals.redis);
    }
    apiRateLimiter(req, res, next);
});

// Health check routes (comprehensive monitoring endpoints)
app.use('/api', healthRouter);
app.use('/', healthRouter);

// Payments routes (Stripe checkout)
app.use('/api/payments', paymentsRouter);

// Admin routes (protected)
app.use('/api/admin', adminAuthMiddleware, adminRouter);

// Cart routes (protected with authCognito middleware)
app.use('/api/cart', cartRouter);

// Library routes (protected with authCognito middleware)
app.use('/api/library', libraryRouter);

// User profile routes
app.use('/api/users', usersRouter);

// Reviews API endpoint
app.get('/api/books/:id/reviews', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const bookId = req.params.id;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const offset = Math.max(parseInt(req.query.offset) || 0, 0);

        const query = `
            SELECT r.*, u.username, u.full_name, u.avatar_url
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.book_id = $1 AND r.is_approved = true
            ORDER BY r.created_at DESC, r.helpful_votes DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await dbPool.query(query, [bookId, limit, offset]);
        const reviews = result.rows.map(row => ({
            id: row.id,
            rating: row.rating,
            title: row.title,
            content: row.content,
            author: {
                name: row.full_name || row.username || 'Anonymous',
                username: row.username,
                avatarUrl: row.avatar_url
            },
            isVerifiedPurchase: row.is_verified_purchase,
            helpfulVotes: row.helpful_votes || 0,
            createdAt: row.created_at
        }));

        res.json(reviews);
    } catch (error) {
        console.error('Reviews query error:', error);
        res.status(500).json({
            error: 'Failed to fetch reviews',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

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

// GET /api/genres/:id - Get books by genre/category
app.get('/api/genres/:id', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const { id } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = Math.max(parseInt(req.query.offset) || 0, 0);

        // Check if id is UUID or slug
        const isUUID = UUID_REGEX.test(id);
        const categoryQuery = isUUID
            ? 'c.id = $1'
            : 'c.slug = $1';

        const query = `
            SELECT DISTINCT b.*,
                   array_agg(DISTINCT c.name) as categories,
                   array_agg(DISTINCT a.name) as authors
            FROM books b
            INNER JOIN book_categories bc ON b.id = bc.book_id
            INNER JOIN categories c ON bc.category_id = c.id
            LEFT JOIN book_authors ba ON b.id = ba.book_id
            LEFT JOIN authors a ON ba.author_id = a.id
            WHERE b.is_active = true AND ${categoryQuery}
            GROUP BY b.id
            ORDER BY b.rating DESC, b.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await dbPool.query(query, [id, limit, offset]);
        const books = result.rows.map(formatBook);

        res.json({
            books,
            pagination: {
                limit,
                offset,
                total: result.rowCount
            }
        });
    } catch (error) {
        console.error('Genre books query error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch genre books',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// GET /api/series/:id - Get books in a series (using tags/metadata for now)
app.get('/api/series/:id', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const { id } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = Math.max(parseInt(req.query.offset) || 0, 0);

        // For now, use tags or metadata to find series books
        // In the future, this could use a dedicated series table
        const query = `
            SELECT DISTINCT b.*,
                   array_agg(DISTINCT c.name) as categories,
                   array_agg(DISTINCT a.name) as authors
            FROM books b
            LEFT JOIN book_categories bc ON b.id = bc.book_id
            LEFT JOIN categories c ON bc.category_id = c.id
            LEFT JOIN book_authors ba ON b.id = ba.book_id
            LEFT JOIN authors a ON ba.author_id = a.id
            WHERE b.is_active = true 
              AND (
                $1 = ANY(b.tags) 
                OR b.metadata->>'series_id' = $1
                OR b.metadata->>'series_name' ILIKE '%' || $1 || '%'
              )
            GROUP BY b.id
            ORDER BY 
              COALESCE((b.metadata->>'series_order')::INTEGER, 0) ASC,
              b.publication_date ASC,
              b.created_at ASC
            LIMIT $2 OFFSET $3
        `;

        const result = await dbPool.query(query, [id, limit, offset]);
        const books = result.rows.map(formatBook);

        res.json({
            books,
            pagination: {
                limit,
                offset,
                total: result.rowCount
            }
        });
    } catch (error) {
        console.error('Series books query error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch series books',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// GET /api/wishlists/:id - Get a wishlist by ID
app.get('/api/wishlists/:id', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const { id } = req.params;

        // Get wishlist details
        const wishlistQuery = `
            SELECT w.*, u.username, u.full_name
            FROM wishlists w
            LEFT JOIN users u ON w.user_id = u.id
            WHERE w.id = $1
        `;

        const wishlistResult = await dbPool.query(wishlistQuery, [id]);
        
        if (wishlistResult.rows.length === 0) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        const wishlist = wishlistResult.rows[0];

        // Get wishlist items
        const itemsQuery = `
            SELECT b.*,
                   array_agg(DISTINCT c.name) as categories,
                   array_agg(DISTINCT a.name) as authors,
                   wi.added_at
            FROM wishlist_items wi
            INNER JOIN books b ON wi.book_id = b.id
            LEFT JOIN book_categories bc ON b.id = bc.book_id
            LEFT JOIN categories c ON bc.category_id = c.id
            LEFT JOIN book_authors ba ON b.id = ba.book_id
            LEFT JOIN authors a ON ba.author_id = a.id
            WHERE wi.wishlist_id = $1 AND b.is_active = true
            GROUP BY b.id, wi.added_at
            ORDER BY wi.added_at DESC
        `;

        const itemsResult = await dbPool.query(itemsQuery, [id]);
        const items = itemsResult.rows.map(row => ({
            ...formatBook(row),
            addedAt: row.added_at
        }));

        res.json({
            ...wishlist,
            items,
            itemCount: items.length
        });
    } catch (error) {
        console.error('Wishlist query error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch wishlist',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// GET /api/reading-sessions/:id - Get a reading session by ID
app.get('/api/reading-sessions/:id', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const { id } = req.params;

        const query = `
            SELECT rs.*,
                   b.title as book_title,
                   b.cover_url as book_cover,
                   u.username,
                   u.full_name
            FROM reading_sessions rs
            LEFT JOIN books b ON rs.book_id = b.id
            LEFT JOIN users u ON rs.user_id = u.id
            WHERE rs.id = $1
        `;

        const result = await dbPool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reading session not found' });
        }

        const session = result.rows[0];

        res.json({
            id: session.id,
            userId: session.user_id,
            bookId: session.book_id,
            bookTitle: session.book_title,
            bookCover: session.book_cover,
            startedAt: session.started_at,
            endedAt: session.ended_at,
            durationMinutes: session.duration_minutes,
            pagesRead: session.pages_read,
            progressStart: session.progress_start,
            progressEnd: session.progress_end,
            deviceType: session.device_type,
            user: {
                username: session.username,
                fullName: session.full_name
            }
        });
    } catch (error) {
        console.error('Reading session query error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch reading session',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
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

// Sentry error handler must be before other error handlers
if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
}

// Enhanced error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        component: 'error-handler'
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

// Notion AI Integration Endpoints
app.post('/api/notion/generate-description', async (req, res) => {
    try {
        const { title, authors, genre, tags } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const bookData = {
            title,
            authors: Array.isArray(authors) ? authors : authors ? [authors] : [],
            genre: genre || null,
            tags: Array.isArray(tags) ? tags : tags ? [tags] : []
        };

        const result = await notionService.generateBookDescription(bookData);
        res.json({
            success: true,
            description: result.description,
            pageId: result.pageId
        });
    } catch (error) {
        console.error('Notion description generation error:', error);
        res.status(500).json({
            error: 'Failed to generate description',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

app.post('/api/notion/generate-summary', async (req, res) => {
    try {
        const { title, description, authors } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const bookData = {
            title,
            description: description || null,
            authors: Array.isArray(authors) ? authors : authors ? [authors] : []
        };

        const summary = await notionService.generateSummary(bookData);
        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('Notion summary generation error:', error);
        res.status(500).json({
            error: 'Failed to generate summary',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

app.post('/api/notion/generate-marketing', async (req, res) => {
    try {
        const { title, authors, genre } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const bookData = {
            title,
            authors: Array.isArray(authors) ? authors : authors ? [authors] : [],
            genre: genre || null
        };

        const marketingCopy = await notionService.generateMarketingCopy(bookData);
        res.json({
            success: true,
            marketingCopy
        });
    } catch (error) {
        console.error('Notion marketing copy generation error:', error);
        res.status(500).json({
            error: 'Failed to generate marketing copy',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

app.post('/api/notion/sync-book', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const { bookId } = req.body;

        if (!bookId) {
            return res.status(400).json({ error: 'Book ID is required' });
        }

        const book = await fetchBookWithRelations(dbPool, bookId);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        const result = await notionService.syncBookToNotion(formatBook(book));
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Notion sync error:', error);
        res.status(500).json({
            error: 'Failed to sync book to Notion',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

app.get('/api/notion/books', async (req, res) => {
    try {
        const books = await notionService.getBooksFromNotion();
        res.json({
            success: true,
            books,
            count: books.length
        });
    } catch (error) {
        console.error('Notion books fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch books from Notion',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

app.get('/api/notion/status', async (req, res) => {
    try {
        const isAvailable = notionService.isAvailable();
        res.json({
            available: isAvailable,
            configured: !!process.env.NOTION_API_KEY,
            databaseId: !!process.env.NOTION_DATABASE_ID
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to check Notion status',
            message: NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

export { NODE_ENV };

export default app;
