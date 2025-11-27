import { formatBook } from '../../utils/formatBook.js';
import { normalizeAuthors } from '../../utils/normalizeAuthors.js';
import {
  fetchBookWithRelations,
  attachAuthorsToBook,
  replaceBookAuthors,
  parseOptionalBoolean,
  UUID_REGEX,
  sanitizeAuthorNames,
  coerceAuthors,
} from '../books/bookHelpers.js';

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

  const authPayload = req.auth?.payload || req.auth;
  toStringArray(authPayload?.['cognito:groups']).forEach((role) => roles.add(role));
  toStringArray(authPayload?.groups).forEach((role) => roles.add(role));
  toStringArray(req.auth?.groups).forEach((role) => roles.add(role));
  toStringArray(req.user?.groups).forEach((role) => roles.add(role));
  toStringArray(req.adminRoles).forEach((role) => roles.add(role));

  return Array.from(roles);
}

function ensureAdmin(req, res) {
  if (req.isAdmin) {
    return true;
  }

  const roles = collectRequestRoles(req);
  if (roles.some((role) => ADMIN_ROLE_NAMES.has(String(role).toLowerCase()))) {
    req.adminRoles = roles;
    req.isAdmin = true;
    return true;
  }

  res.status(403).json({ error: 'Admin access required' });
  return false;
}

function getDbPool(req, res) {
  const dbPool = req.app.locals.db;
  if (!dbPool) {
    res.status(503).json({ error: 'Database unavailable' });
    return null;
  }
  return dbPool;
}

function sanitizeCategoryNames(values) {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => {
          if (!value) return '';
          return String(value).trim();
        })
        .filter(Boolean)
    )
  );
}

function extractCategoryNames(body) {
  if (Array.isArray(body.categories)) {
    return sanitizeCategoryNames(body.categories);
  }
  if (Array.isArray(body.genres)) {
    return sanitizeCategoryNames(body.genres);
  }
  if (body.genre) {
    return sanitizeCategoryNames([body.genre]);
  }
  return [];
}

function extractAuthorNames(body) {
  const explicitAuthors = coerceAuthors(body.authors);
  if (explicitAuthors.length > 0) {
    return sanitizeAuthorNames(explicitAuthors);
  }
  if (body.author) {
    return sanitizeAuthorNames([body.author]);
  }
  return [];
}

function extractPublicationDate(body) {
  if (body.publication_date) {
    return body.publication_date;
  }
  if (body.year) {
    const yearInt = parseInt(body.year, 10);
    if (!Number.isNaN(yearInt) && yearInt > 0) {
      return `${yearInt}-01-01`;
    }
  }
  return null;
}

function parsePriceCents(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Invalid price_cents value');
  }
  return parsed;
}

function parseRating(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
    throw new Error('Invalid rating value');
  }
  return parsed;
}

function slugifyCategory(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return base || 'category';
}

async function ensureCategory(dbPool, name) {
  const existing = await dbPool.query(
    'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1',
    [name]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  let attempt = 0;
  const baseSlug = slugifyCategory(name);
  while (attempt < 10) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
    try {
      const inserted = await dbPool.query(
        'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id',
        [name, slug]
      );
      return inserted.rows[0].id;
    } catch (error) {
      if (error.code === '23505') {
        attempt += 1;
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unable to create category');
}

async function replaceBookCategories(dbPool, bookId, categoryNames) {
  if (!dbPool) {
    return;
  }

  const names = sanitizeCategoryNames(categoryNames);
  await dbPool.query('DELETE FROM book_categories WHERE book_id = $1', [bookId]);

  if (names.length === 0) {
    return;
  }

  let index = 0;
  for (const name of names) {
    const categoryId = await ensureCategory(dbPool, name);
    await dbPool.query(
      `INSERT INTO book_categories (book_id, category_id, is_primary)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [bookId, categoryId, index === 0]
    );
    index += 1;
  }
}

function mapBookToAdminResponse(book) {
  const formatted = formatBook(book);
  const authorNames = formatted.authors?.map((author) => author?.name).filter(Boolean) || [];
  const categories = Array.isArray(book.categories) ? book.categories.filter(Boolean) : [];
  return {
    id: formatted.id,
    title: formatted.title,
    description: formatted.description,
    cover: formatted.cover_url,
    cover_url: formatted.cover_url,
    authors: authorNames,
    author: authorNames.join(', '),
    categories,
    genre: categories[0] || null,
    rating: formatted.rating,
    rating_count: formatted.rating_count,
    price_cents: formatted.price_cents,
    publication_date: formatted.publication_date,
    tags: formatted.tags ?? [],
    created_at: formatted.created_at,
    updated_at: formatted.updated_at,
  };
}

async function listRawBooks(dbPool, limit, offset) {
  const query = `
    SELECT b.*,
           COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL), ARRAY[]::TEXT[]) AS categories,
           COALESCE(array_agg(DISTINCT a.name) FILTER (WHERE a.id IS NOT NULL), ARRAY[]::TEXT[]) AS authors
    FROM books b
    LEFT JOIN book_categories bc ON b.id = bc.book_id
    LEFT JOIN categories c ON bc.category_id = c.id
    LEFT JOIN book_authors ba ON b.id = ba.book_id
    LEFT JOIN authors a ON ba.author_id = a.id
    WHERE b.is_active = true
    GROUP BY b.id
    ORDER BY b.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await dbPool.query(query, [limit, offset]);
  return result.rows;
}

export async function getAdminBooks(req, res) {
  if (!ensureAdmin(req, res)) {
    return;
  }

  const dbPool = getDbPool(req, res);
  if (!dbPool) {
    return;
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  try {
    const rows = await listRawBooks(dbPool, limit, offset);
    const items = rows.map(mapBookToAdminResponse);
    res.json({
      items,
      pagination: {
        limit,
        offset,
        count: items.length,
      },
    });
  } catch (error) {
    console.error('Error fetching admin books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
}

export async function getAdminBook(req, res) {
  if (!ensureAdmin(req, res)) {
    return;
  }

  const dbPool = getDbPool(req, res);
  if (!dbPool) {
    return;
  }

  const { id } = req.params;
  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid book ID format' });
  }

  try {
    const book = await fetchBookWithRelations(dbPool, id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(mapBookToAdminResponse(book));
  } catch (error) {
    console.error('Error fetching admin book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
}

export async function createBook(req, res) {
  if (!ensureAdmin(req, res)) {
    return;
  }

  const dbPool = getDbPool(req, res);
  if (!dbPool) {
    return;
  }

  const { title } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const authorNames = extractAuthorNames(req.body);
  const categories = extractCategoryNames(req.body);
  const publicationDate = extractPublicationDate(req.body);

  let priceCents = null;
  let ratingValue = null;
  try {
    priceCents = parsePriceCents(req.body.price_cents ?? req.body.priceCents);
    ratingValue = parseRating(req.body.rating);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const coverUrl = req.body.cover_url || req.body.cover || null;
  const description = req.body.description || null;

  try {
    await dbPool.query('BEGIN');

    const insertResult = await dbPool.query(
      `INSERT INTO books (
         title,
         description,
         cover_url,
         price_cents,
         rating,
         publication_date,
         is_featured,
         is_new_release,
         tags
       )
       VALUES ($1, $2, $3, COALESCE($4, 0), COALESCE($5, 0), $6, $7, $8, $9)
       RETURNING *`,
      [
        title.trim(),
        description,
        coverUrl,
        priceCents,
        ratingValue,
        publicationDate,
        parseOptionalBoolean(req.body.is_featured) ?? false,
        parseOptionalBoolean(req.body.is_new_release) ?? false,
        Array.isArray(req.body.tags) ? req.body.tags : null,
      ]
    );

    const createdBook = insertResult.rows[0];

    if (authorNames.length > 0) {
      await attachAuthorsToBook(dbPool, createdBook.id, authorNames);
    } else if (req.body.author) {
      await attachAuthorsToBook(dbPool, createdBook.id, [req.body.author]);
    }

    if (categories.length > 0) {
      await replaceBookCategories(dbPool, createdBook.id, categories);
    }

    const detailedBook =
      (await fetchBookWithRelations(dbPool, createdBook.id)) ?? createdBook;

    await dbPool.query('COMMIT');

    res.status(201).json(mapBookToAdminResponse(detailedBook));
  } catch (error) {
    await dbPool.query('ROLLBACK');
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
}

export async function updateBook(req, res) {
  if (!ensureAdmin(req, res)) {
    return;
  }

  const dbPool = getDbPool(req, res);
  if (!dbPool) {
    return;
  }

  const { id } = req.params;
  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid book ID format' });
  }

  const authorNames = extractAuthorNames(req.body);
  const categories = extractCategoryNames(req.body);
  const publicationDate = extractPublicationDate(req.body);

  let priceCents = null;
  let ratingValue = null;
  try {
    if (req.body.price_cents !== undefined || req.body.priceCents !== undefined) {
      priceCents = parsePriceCents(req.body.price_cents ?? req.body.priceCents);
    }
    if (req.body.rating !== undefined && req.body.rating !== null && req.body.rating !== '') {
      ratingValue = parseRating(req.body.rating);
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const updates = [];
  const params = [];
  let index = 1;

  const pushUpdate = (column, value) => {
    updates.push(`${column} = $${index}`);
    params.push(value);
    index += 1;
  };

  if (req.body.title !== undefined) {
    const trimmed = typeof req.body.title === 'string' ? req.body.title.trim() : req.body.title;
    if (!trimmed) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }
    pushUpdate('title', trimmed);
  }

  if (req.body.description !== undefined) {
    pushUpdate('description', req.body.description || null);
  }

  if (req.body.cover !== undefined || req.body.cover_url !== undefined) {
    pushUpdate('cover_url', req.body.cover_url || req.body.cover || null);
  }

  if (priceCents !== null) {
    pushUpdate('price_cents', priceCents);
  }

  if (ratingValue !== null) {
    pushUpdate('rating', ratingValue);
  }

  if (publicationDate !== null) {
    pushUpdate('publication_date', publicationDate);
  }

  const featuredFlag = parseOptionalBoolean(req.body.is_featured);
  if (featuredFlag !== undefined) {
    pushUpdate('is_featured', featuredFlag);
  }

  const newReleaseFlag = parseOptionalBoolean(req.body.is_new_release);
  if (newReleaseFlag !== undefined) {
    pushUpdate('is_new_release', newReleaseFlag);
  }

  if (Array.isArray(req.body.tags)) {
    pushUpdate('tags', req.body.tags);
  }

  if (updates.length === 0 && authorNames.length === 0 && categories.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    await dbPool.query('BEGIN');

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      params.push(id);
      await dbPool.query(
        `UPDATE books SET ${updates.join(', ')} WHERE id = $${index}`,
        params
      );
    }

    if (authorNames.length > 0) {
      await replaceBookAuthors(dbPool, id, authorNames);
    } else if (req.body.author) {
      await replaceBookAuthors(dbPool, id, [req.body.author]);
    }

    if (req.body.authors === null || req.body.author === null) {
      await dbPool.query('DELETE FROM book_authors WHERE book_id = $1', [id]);
    }

    if (categories.length > 0) {
      await replaceBookCategories(dbPool, id, categories);
    } else if (req.body.categories === null || req.body.genre === null) {
      await dbPool.query('DELETE FROM book_categories WHERE book_id = $1', [id]);
    }

    const detailedBook = await fetchBookWithRelations(dbPool, id);
    await dbPool.query('COMMIT');

    res.json(mapBookToAdminResponse(detailedBook));
  } catch (error) {
    await dbPool.query('ROLLBACK');
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
}

export async function deleteBook(req, res) {
  if (!ensureAdmin(req, res)) {
    return;
  }

  const dbPool = getDbPool(req, res);
  if (!dbPool) {
    return;
  }

  const { id } = req.params;
  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid book ID format' });
  }

  try {
    await dbPool.query('DELETE FROM books WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
}

export async function getAnalytics(req, res) {
  if (!ensureAdmin(req, res)) {
    return;
  }

  const dbPool = getDbPool(req, res);
  if (!dbPool) {
    return;
  }

  try {
    // Get aggregate statistics
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM books) as total_books,
        (SELECT COUNT(*) FROM orders WHERE status = 'completed') as total_orders,
        (SELECT COALESCE(SUM(total_cents), 0) FROM orders WHERE status = 'completed') as total_revenue
    `;
    
    const statsResult = await dbPool.query(statsQuery);
    
    // Get recent orders with user information
    const recentOrdersQuery = `
      SELECT 
        o.id,
        o.user_id,
        o.total_cents,
        o.status,
        o.created_at,
        u.email,
        u.full_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `;
    
    const recentOrdersResult = await dbPool.query(recentOrdersQuery);
    
    // Get top selling books
    const topBooksQuery = `
      SELECT 
        b.id,
        b.title,
        b.price_cents,
        COUNT(oi.id) as order_count,
        SUM(oi.quantity) as total_sold
      FROM books b
      LEFT JOIN order_items oi ON b.id = oi.book_id
      GROUP BY b.id, b.title, b.price_cents
      ORDER BY total_sold DESC
      LIMIT 5
    `;
    
    const topBooksResult = await dbPool.query(topBooksQuery).catch(() => ({ rows: [] }));
    
    res.json({
      stats: {
        totalUsers: parseInt(statsResult.rows[0].total_users) || 0,
        totalBooks: parseInt(statsResult.rows[0].total_books) || 0,
        totalOrders: parseInt(statsResult.rows[0].total_orders) || 0,
        totalRevenue: parseInt(statsResult.rows[0].total_revenue) || 0
      },
      recentOrders: recentOrdersResult.rows.map(order => ({
        id: order.id,
        userId: order.user_id,
        userEmail: order.email,
        userName: order.full_name,
        totalCents: order.total_cents,
        status: order.status,
        createdAt: order.created_at
      })),
      topBooks: topBooksResult.rows.map(book => ({
        id: book.id,
        title: book.title,
        priceCents: book.price_cents,
        orderCount: parseInt(book.order_count) || 0,
        totalSold: parseInt(book.total_sold) || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
}