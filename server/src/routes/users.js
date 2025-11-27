// server/src/routes/users.js
import express from 'express';
import { authCognito } from '../middleware/authCognito.js';

const router = express.Router();
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * POST /api/users/sync
 * Sync user from Cognito to PostgreSQL database
 * Creates or updates user record based on JWT token data
 */
router.post('/sync', authCognito(), async (req, res) => {
  try {
    const dbPool = req.app.locals.db;

    if (!dbPool) {
      return res.status(503).json({
        error: 'Database unavailable',
        message: 'Cannot sync user at this time'
      });
    }

    // Extract user data from authenticated JWT token
    const { sub, email, payload } = req.auth;

    // Get name from token payload (Cognito includes 'name' attribute in ID tokens)
    const name = payload.name || payload.given_name || email.split('@')[0];

    if (!sub || !email) {
      return res.status(400).json({
        error: 'Missing required user data',
        message: 'Token must include sub and email'
      });
    }

    // Upsert user into database
    const result = await dbPool.query(
      `INSERT INTO users (cognito_sub, email, full_name, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (cognito_sub)
       DO UPDATE SET
         email = EXCLUDED.email,
         full_name = EXCLUDED.full_name,
         updated_at = NOW()
       RETURNING id, cognito_sub, email, full_name, role, created_at`,
      [sub, email, name]
    );

    const user = result.rows[0];

    if (!user) {
      throw new Error('Failed to create or update user');
    }

    console.log(`[User Sync] User synced: ${email} (${sub})`);

    res.json({ user });
  } catch (error) {
    console.error('[User Sync] Error:', error);
    res.status(500).json({
      error: 'Failed to sync user',
      message: NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
