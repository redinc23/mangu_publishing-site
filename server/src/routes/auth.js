// server/src/routes/auth.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import * as cognitoService from '../services/cognito.js';
import { authCognito } from '../middleware/authCognito.js';

const router = express.Router();
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * POST /api/auth/signup
 * Sign up a new user with email, password, and name
 */
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('name').trim().notEmpty().withMessage('Name is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { email, password, name } = req.body;

      // Call Cognito service
      const result = await cognitoService.signUp({ email, password, name });

      if (!result.success) {
        const friendlyError = cognitoService.getUserFriendlyError(result.code);
        return res.status(400).json({
          error: friendlyError,
          code: result.code,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Account created successfully. Please check your email for verification code.',
        userConfirmed: result.userConfirmed,
        codeDeliveryDetails: result.codeDeliveryDetails,
      });
    } catch (error) {
      console.error('[Auth] Signup error:', error);
      res.status(500).json({
        error: NODE_ENV === 'development' ? error.message : 'Failed to create account',
      });
    }
  }
);

/**
 * POST /api/auth/signin
 * Sign in with email and password, returns JWT tokens
 */
router.post(
  '/signin',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Call Cognito service
      const result = await cognitoService.signIn({ email, password });

      if (!result.success) {
        const friendlyError = cognitoService.getUserFriendlyError(result.code);
        return res.status(401).json({
          error: friendlyError,
          code: result.code,
          challenge: result.challenge,
        });
      }

      res.json({
        success: true,
        message: 'Sign in successful',
        tokens: result.tokens,
      });
    } catch (error) {
      console.error('[Auth] Sign in error:', error);
      res.status(500).json({
        error: NODE_ENV === 'development' ? error.message : 'Sign in failed',
      });
    }
  }
);

/**
 * POST /api/auth/signout
 * Sign out the current user (requires access token)
 */
router.post('/signout', authCognito(), async (req, res) => {
  try {
    // Extract access token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const [, accessToken] = authHeader.split(' ');

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Call Cognito service
    const result = await cognitoService.signOut({ accessToken });

    if (!result.success) {
      const friendlyError = cognitoService.getUserFriendlyError(result.code);
      return res.status(400).json({
        error: friendlyError,
        code: result.code,
      });
    }

    res.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    console.error('[Auth] Sign out error:', error);
    res.status(500).json({
      error: NODE_ENV === 'development' ? error.message : 'Sign out failed',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    body('username').optional().isString(),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { refreshToken, username } = req.body;

      // Call Cognito service
      const result = await cognitoService.refreshToken({ refreshToken, username });

      if (!result.success) {
        const friendlyError = cognitoService.getUserFriendlyError(result.code);
        return res.status(401).json({
          error: friendlyError,
          code: result.code,
        });
      }

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        tokens: result.tokens,
      });
    } catch (error) {
      console.error('[Auth] Refresh token error:', error);
      res.status(500).json({
        error: NODE_ENV === 'development' ? error.message : 'Token refresh failed',
      });
    }
  }
);

/**
 * POST /api/auth/reset
 * Initiate password reset (sends code to email)
 */
router.post(
  '/reset',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { email } = req.body;

      // Call Cognito service
      const result = await cognitoService.forgotPassword({ email });

      if (!result.success) {
        const friendlyError = cognitoService.getUserFriendlyError(result.code);
        return res.status(400).json({
          error: friendlyError,
          code: result.code,
        });
      }

      res.json({
        success: true,
        message: 'Password reset code sent to your email',
        codeDeliveryDetails: result.codeDeliveryDetails,
      });
    } catch (error) {
      console.error('[Auth] Password reset error:', error);
      res.status(500).json({
        error: NODE_ENV === 'development' ? error.message : 'Password reset failed',
      });
    }
  }
);

/**
 * POST /api/auth/reset/confirm
 * Confirm password reset with code and new password
 */
router.post(
  '/reset/confirm',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('code').notEmpty().withMessage('Verification code is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { email, code, newPassword } = req.body;

      // Call Cognito service
      const result = await cognitoService.confirmForgotPassword({
        email,
        code,
        newPassword,
      });

      if (!result.success) {
        const friendlyError = cognitoService.getUserFriendlyError(result.code);
        return res.status(400).json({
          error: friendlyError,
          code: result.code,
        });
      }

      res.json({
        success: true,
        message: 'Password reset successfully. You can now sign in with your new password.',
      });
    } catch (error) {
      console.error('[Auth] Confirm password reset error:', error);
      res.status(500).json({
        error: NODE_ENV === 'development' ? error.message : 'Password reset confirmation failed',
      });
    }
  }
);

/**
 * POST /api/auth/confirm
 * Confirm email with verification code
 */
router.post(
  '/confirm',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('code').notEmpty().withMessage('Verification code is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { email, code } = req.body;

      // Call Cognito service
      const result = await cognitoService.confirmSignUp({ email, code });

      if (!result.success) {
        const friendlyError = cognitoService.getUserFriendlyError(result.code);
        return res.status(400).json({
          error: friendlyError,
          code: result.code,
        });
      }

      res.json({
        success: true,
        message: 'Email confirmed successfully. You can now sign in.',
      });
    } catch (error) {
      console.error('[Auth] Email confirmation error:', error);
      res.status(500).json({
        error: NODE_ENV === 'development' ? error.message : 'Email confirmation failed',
      });
    }
  }
);

/**
 * POST /api/auth/resend-code
 * Resend confirmation code
 */
router.post(
  '/resend-code',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { email } = req.body;

      // Call Cognito service
      const result = await cognitoService.resendConfirmationCode({ email });

      if (!result.success) {
        const friendlyError = cognitoService.getUserFriendlyError(result.code);
        return res.status(400).json({
          error: friendlyError,
          code: result.code,
        });
      }

      res.json({
        success: true,
        message: 'Confirmation code sent to your email',
        codeDeliveryDetails: result.codeDeliveryDetails,
      });
    } catch (error) {
      console.error('[Auth] Resend code error:', error);
      res.status(500).json({
        error: NODE_ENV === 'development' ? error.message : 'Failed to resend code',
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
router.get('/me', authCognito(), async (req, res) => {
  try {
    // Extract access token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const [, accessToken] = authHeader.split(' ');

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Call Cognito service
    const result = await cognitoService.getCurrentUser({ accessToken });

    if (!result.success) {
      const friendlyError = cognitoService.getUserFriendlyError(result.code);
      return res.status(401).json({
        error: friendlyError,
        code: result.code,
      });
    }

    // Optionally fetch additional user data from database
    const dbPool = req.app.locals.db;
    let dbUser = null;

    if (dbPool && result.user.sub) {
      try {
        const dbResult = await dbPool.query(
          'SELECT id, email, username, full_name, avatar_url, role, subscription_tier, created_at FROM users WHERE cognito_sub = $1',
          [result.user.sub]
        );

        if (dbResult.rows.length > 0) {
          dbUser = dbResult.rows[0];
        }
      } catch (dbError) {
        console.warn('[Auth] Failed to fetch user from database:', dbError.message);
      }
    }

    res.json({
      success: true,
      user: {
        ...result.user,
        ...(dbUser && {
          id: dbUser.id,
          role: dbUser.role,
          subscriptionTier: dbUser.subscription_tier,
          createdAt: dbUser.created_at,
          fullName: dbUser.full_name,
          avatarUrl: dbUser.avatar_url,
          username: dbUser.username,
        }),
      },
    });
  } catch (error) {
    console.error('[Auth] Get current user error:', error);
    res.status(500).json({
      error: NODE_ENV === 'development' ? error.message : 'Failed to get user profile',
    });
  }
});

export default router;
