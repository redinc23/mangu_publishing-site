import { getOrCreateUserId } from '../../utils/userHelpers.js';

/**
 * GET /api/library - Get user's library items
 */
export async function getLibrary(req, res) {
  try {
    const pool = req.app.locals.db;
    if (!pool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const cognitoSub = req.auth.sub;
    const userId = await getOrCreateUserId(pool, cognitoSub, req.auth.email, req.auth.username);

    const result = await pool.query(
      `SELECT ul.book_id, ul.added_at, ul.progress_percent, ul.last_read_at,
              ul.is_favorite, ul.rating,
              b.title, b.cover_url, b.price_cents, b.description
       FROM user_library ul
       JOIN books b ON ul.book_id = b.id
       WHERE ul.user_id = $1
       ORDER BY ul.added_at DESC`,
      [userId]
    );

    const items = result.rows.map(row => ({
      id: row.book_id,
      bookId: row.book_id,
      title: row.title,
      cover_url: row.cover_url,
      price_cents: row.price_cents,
      description: row.description,
      added_at: row.added_at,
      progress_percent: row.progress_percent,
      last_read_at: row.last_read_at,
      is_favorite: row.is_favorite,
      rating: row.rating
    }));

    res.json({ items });
  } catch (error) {
    console.error('Get library error:', error);
    res.status(500).json({
      error: 'Failed to fetch library',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * POST /api/library/add - Add a book to user's library
 */
export async function addToLibrary(req, res) {
  try {
    const pool = req.app.locals.db;
    if (!pool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ error: 'bookId is required' });
    }

    // Verify book exists
    const bookCheck = await pool.query('SELECT id FROM books WHERE id = $1', [bookId]);
    if (bookCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid bookId' });
    }

    const cognitoSub = req.auth.sub;
    const userId = await getOrCreateUserId(pool, cognitoSub, req.auth.email, req.auth.username);

    // Insert into library (ON CONFLICT will ignore if already exists)
    await pool.query(
      `INSERT INTO user_library (user_id, book_id) 
       VALUES ($1, $2)
       ON CONFLICT (user_id, book_id) DO NOTHING`,
      [userId, bookId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Add to library error:', error);
    res.status(500).json({
      error: 'Failed to add item to library',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
