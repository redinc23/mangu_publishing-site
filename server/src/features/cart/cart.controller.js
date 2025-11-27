import { getOrCreateUserId } from '../../utils/userHelpers.js';

/**
 * GET /api/cart - Get user's cart items
 */
export async function getCart(req, res) {
  try {
    const pool = req.app.locals.db;
    if (!pool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const cognitoSub = req.auth.sub;
    const userId = await getOrCreateUserId(pool, cognitoSub, req.auth.email, req.auth.username);

    const result = await pool.query(
      `SELECT c.book_id, c.quantity, c.added_at, c.updated_at,
              b.title, b.cover_url, b.price_cents
       FROM cart c
       JOIN books b ON c.book_id = b.id
       WHERE c.user_id = $1
       ORDER BY c.added_at DESC`,
      [userId]
    );

    const items = result.rows.map(row => ({
      id: row.book_id,
      bookId: row.book_id,
      title: row.title,
      cover_url: row.cover_url,
      price_cents: row.price_cents,
      quantity: row.quantity,
      added_at: row.added_at
    }));

    res.json({ items });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      error: 'Failed to fetch cart',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * POST /api/cart/add - Add a book to cart
 */
export async function addToCart(req, res) {
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

    // Insert or update cart item
    await pool.query(
      `INSERT INTO cart (user_id, book_id, quantity) 
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, book_id) 
       DO UPDATE SET quantity = cart.quantity + 1, updated_at = CURRENT_TIMESTAMP`,
      [userId, bookId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      error: 'Failed to add item to cart',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * POST /api/cart/remove - Remove a book from cart
 */
export async function removeFromCart(req, res) {
  try {
    const pool = req.app.locals.db;
    if (!pool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ error: 'bookId is required' });
    }

    const cognitoSub = req.auth.sub;
    const userId = await getOrCreateUserId(pool, cognitoSub, req.auth.email, req.auth.username);

    const result = await pool.query(
      'DELETE FROM cart WHERE user_id = $1 AND book_id = $2 RETURNING *',
      [userId, bookId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      error: 'Failed to remove item from cart',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * POST /api/cart/clear - Clear all items from cart
 */
export async function clearCart(req, res) {
  try {
    const pool = req.app.locals.db;
    if (!pool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const cognitoSub = req.auth.sub;
    const userId = await getOrCreateUserId(pool, cognitoSub, req.auth.email, req.auth.username);

    await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      error: 'Failed to clear cart',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
