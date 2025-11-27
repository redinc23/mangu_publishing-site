// server/src/features/wishlists/wishlists.controller.js
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/wishlists
 * Get all wishlists for the authenticated user
 */
export const getWishlists = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const userId = req.auth.userId || req.auth.sub;

    const result = await dbPool.query(
      `SELECT id, name, description, is_public, created_at, updated_at,
              (SELECT COUNT(*) FROM wishlist_items WHERE wishlist_id = wishlists.id) as item_count
       FROM wishlists
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ wishlists: result.rows });
  } catch (error) {
    console.error('[Wishlists] Error fetching wishlists:', error);
    res.status(500).json({ error: 'Failed to fetch wishlists' });
  }
};

/**
 * POST /api/wishlists
 * Create a new wishlist
 */
export const createWishlist = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const userId = req.auth.userId || req.auth.sub;
    const { name, description, is_public = false } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Wishlist name is required' });
    }

    const result = await dbPool.query(
      `INSERT INTO wishlists (user_id, name, description, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, is_public, created_at, updated_at`,
      [userId, name.trim(), description || null, is_public]
    );

    res.status(201).json({ wishlist: result.rows[0] });
  } catch (error) {
    console.error('[Wishlists] Error creating wishlist:', error);
    res.status(500).json({ error: 'Failed to create wishlist' });
  }
};

/**
 * GET /api/wishlists/:id
 * Get a specific wishlist with its items
 */
export const getWishlist = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const userId = req.auth.userId || req.auth.sub;
    const { id } = req.params;

    // Get wishlist details
    const wishlistResult = await dbPool.query(
      `SELECT id, name, description, is_public, created_at, updated_at
       FROM wishlists
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (wishlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Get wishlist items with book details
    const itemsResult = await dbPool.query(
      `SELECT
        b.id, b.title, b.subtitle, b.cover_url, b.price, b.description,
        wi.added_at,
        array_agg(DISTINCT a.name) as authors
       FROM wishlist_items wi
       JOIN books b ON wi.book_id = b.id
       LEFT JOIN book_authors ba ON b.id = ba.book_id
       LEFT JOIN authors a ON ba.author_id = a.id
       WHERE wi.wishlist_id = $1
       GROUP BY b.id, wi.added_at
       ORDER BY wi.added_at DESC`,
      [id]
    );

    const wishlist = {
      ...wishlistResult.rows[0],
      items: itemsResult.rows
    };

    res.json({ wishlist });
  } catch (error) {
    console.error('[Wishlists] Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
};

/**
 * PUT /api/wishlists/:id
 * Update a wishlist
 */
export const updateWishlist = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const userId = req.auth.userId || req.auth.sub;
    const { id } = req.params;
    const { name, description, is_public } = req.body;

    // Check ownership
    const checkResult = await dbPool.query(
      'SELECT id FROM wishlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name.trim());
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (is_public !== undefined) {
      updates.push(`is_public = $${paramCount}`);
      values.push(is_public);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await dbPool.query(
      `UPDATE wishlists
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, description, is_public, created_at, updated_at`,
      values
    );

    res.json({ wishlist: result.rows[0] });
  } catch (error) {
    console.error('[Wishlists] Error updating wishlist:', error);
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
};

/**
 * DELETE /api/wishlists/:id
 * Delete a wishlist
 */
export const deleteWishlist = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const userId = req.auth.userId || req.auth.sub;
    const { id } = req.params;

    const result = await dbPool.query(
      'DELETE FROM wishlists WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    res.json({ message: 'Wishlist deleted successfully' });
  } catch (error) {
    console.error('[Wishlists] Error deleting wishlist:', error);
    res.status(500).json({ error: 'Failed to delete wishlist' });
  }
};

/**
 * POST /api/wishlists/:id/items
 * Add a book to a wishlist
 */
export const addItemToWishlist = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const userId = req.auth.userId || req.auth.sub;
    const { id } = req.params;
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    // Check wishlist ownership
    const wishlistCheck = await dbPool.query(
      'SELECT id FROM wishlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (wishlistCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Check if book exists
    const bookCheck = await dbPool.query(
      'SELECT id FROM books WHERE id = $1',
      [bookId]
    );

    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Add to wishlist (ignore if already exists)
    await dbPool.query(
      `INSERT INTO wishlist_items (wishlist_id, book_id)
       VALUES ($1, $2)
       ON CONFLICT (wishlist_id, book_id) DO NOTHING`,
      [id, bookId]
    );

    res.status(201).json({ message: 'Book added to wishlist' });
  } catch (error) {
    console.error('[Wishlists] Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item to wishlist' });
  }
};

/**
 * DELETE /api/wishlists/:id/items/:bookId
 * Remove a book from a wishlist
 */
export const removeItemFromWishlist = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const userId = req.auth.userId || req.auth.sub;
    const { id, bookId } = req.params;

    // Check wishlist ownership
    const wishlistCheck = await dbPool.query(
      'SELECT id FROM wishlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (wishlistCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const result = await dbPool.query(
      'DELETE FROM wishlist_items WHERE wishlist_id = $1 AND book_id = $2 RETURNING wishlist_id',
      [id, bookId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in wishlist' });
    }

    res.json({ message: 'Book removed from wishlist' });
  } catch (error) {
    console.error('[Wishlists] Error removing item:', error);
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
};
