import { Router } from 'express';
import { authCognito } from '../middleware/authCognito.js';

const router = Router();

// All user profile routes require Cognito authentication
router.use(authCognito());

router.get('/me', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    if (!pool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const result = await pool.query(
      `SELECT id, cognito_sub, email, username, full_name, avatar_url, bio,
              role, subscription_tier, subscription_expires_at, created_at
       FROM users
       WHERE cognito_sub = $1`,
      [req.auth.sub]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/me', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    if (!pool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { full_name, username, bio, avatar_url } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           username = COALESCE($2, username),
           bio = COALESCE($3, bio),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = NOW()
       WHERE cognito_sub = $5
       RETURNING id, email, full_name, username, bio, avatar_url, role`,
      [full_name, username, bio, avatar_url, req.auth.sub]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

router.get('/me/orders', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    if (!pool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const userResult = await pool.query(
      'SELECT id FROM users WHERE cognito_sub = $1',
      [req.auth.sub]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    const ordersResult = await pool.query(
      `SELECT o.id,
              o.order_number,
              o.status,
              o.total_cents,
              o.created_at,
              o.processed_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'book_id', oi.book_id,
                    'title', b.title,
                    'cover_url', b.cover_url,
                    'quantity', oi.quantity,
                    'price', oi.unit_price_cents
                  )
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'::json
              ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN books b ON oi.book_id = b.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );

    return res.json({ orders: ordersResult.rows });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;


