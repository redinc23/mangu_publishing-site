// server/src/routes/users.js
import express from 'express';
import { authCognito } from '../middleware/authCognito.js';

const router = express.Router();
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * POST /api/users/sync
 * Syncs a Cognito user to the PostgreSQL users table
 * Requires authentication via authCognito middleware
 */
router.post('/sync', authCognito(), async (req, res) => {
  try {
    const dbPool = req.app.locals.db;

    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    // Extract user data from the authenticated token
    const { sub, email, username, payload } = req.auth;

    if (!sub || !email) {
      return res.status(400).json({
        error: 'Missing required user data from token'
      });
    }

    // Extract additional fields from payload
    const fullName = payload.name || payload['cognito:username'] || null;
    const emailVerified = payload.email_verified || false;

    // Generate username from email if not provided
    const usernameToUse = username || email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');

    // Upsert user into PostgreSQL
    const query = `
      INSERT INTO users (
        cognito_sub,
        email,
        username,
        full_name,
        email_verified,
        last_login_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (cognito_sub)
      DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        email_verified = EXCLUDED.email_verified,
        last_login_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        id,
        cognito_sub,
        email,
        username,
        full_name,
        avatar_url,
        bio,
        role,
        subscription_tier,
        email_verified,
        profile_completed,
        created_at,
        updated_at
    `;

    const values = [sub, email, usernameToUse, fullName, emailVerified];
    const result = await dbPool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(500).json({
        error: 'Failed to sync user'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'User synced successfully',
      user: {
        id: user.id,
        cognitoSub: user.cognito_sub,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        role: user.role,
        subscriptionTier: user.subscription_tier,
        emailVerified: user.email_verified,
        profileCompleted: user.profile_completed,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    console.error('[Users] Sync error:', error);

    // Handle unique constraint violations
    if (error.code === '23505') { // PostgreSQL unique violation
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({
          error: 'Email already exists with different Cognito account'
        });
      }
      if (error.constraint === 'users_username_key') {
        return res.status(409).json({
          error: 'Username already taken'
        });
      }
    }

    res.status(500).json({
      error: NODE_ENV === 'development' ? error.message : 'Failed to sync user',
    });
  }
});

export default router;
