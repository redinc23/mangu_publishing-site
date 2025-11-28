# 🚨 MANGU Publishing Platform - Critical Bugs Project Plan

> **Status**: Beta Blocked  
> **Priority**: P0 - Critical  
> **Estimated Total Time**: 8-12 hours  
> **Last Updated**: November 28, 2025

---

## 📋 Executive Summary

The MANGU Publishing Platform has **4 critical bugs** that must be fixed before internal beta launch. These bugs prevent core functionality from working properly. This document provides a comprehensive, developer-ready plan for fixing each issue.

**Current State**:
- ✅ 8 main routes functional (/, /library, /book/:id, /signin, /profile, /cart, /audiobooks/:id, /admin)
- ✅ Frontend components built
- ✅ Database schema defined (PostgreSQL)
- ❌ Cart/Library use in-memory arrays (data lost on server restart)
- ❌ No Stripe webhook handler (payments don't persist)
- ❌ No user sync endpoint (Cognito ↔ PostgreSQL)
- ❌ DynamoDB code conflicts with PostgreSQL design

---

## 🎯 Bug #1: Cart & Library Data Persistence

### Problem Description
Cart and Library endpoints currently use **in-memory JavaScript arrays** instead of database tables. All user data is lost when the server restarts.

**Impact**: HIGH - Users lose shopping cart and library items on every deployment

### Current Code Location

**Cart Controller** (`server/src/features/cart/cart.controller.js`):
```javascript
// ❌ BROKEN: In-memory storage - resets on restart
import { books } from '../../data/books.js';

let cartItems = []; // <-- THIS IS THE PROBLEM

export function getCart(req, res) {
  res.json(cartItems);
}

export function addToCart(req, res) {
  const { bookId } = req.body;
  const book = books.find(b => b.id === bookId);
  if (!book) {
    return res.status(400).json({ error: 'Invalid bookId' });
  }
  const alreadyInCart = cartItems.find(item => item.id === bookId);
  if (!alreadyInCart) {
    cartItems.push(book);
  }
  return res.json(cartItems);
}
```

**Library Controller** (`server/src/features/library/library.controller.js`):
```javascript
// ❌ BROKEN: Same in-memory issue
import { books } from '../../data/books.js';

let libraryItems = []; // <-- THIS IS THE PROBLEM

export function getLibrary(req, res) {
  res.json(libraryItems);
}
```

### Database Tables Already Exist

The PostgreSQL schema (`server/src/database/init.sql`) already has the tables:

```sql
-- Cart table (lines 174-181)
CREATE TABLE IF NOT EXISTS cart (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, book_id)
);

-- User Library table (lines 142-155)  
CREATE TABLE IF NOT EXISTS user_library (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_percent DECIMAL(5,2) DEFAULT 0,
    last_read_at TIMESTAMP,
    reading_time_minutes INTEGER DEFAULT 0,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    review_public BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, book_id)
);
```

### Solution: Replace In-Memory with Database

**File to modify**: `server/src/features/cart/cart.controller.js`

```javascript
// ✅ FIXED: Database-backed cart controller
export async function getCart(req, res) {
  try {
    const dbPool = req.app.locals.db;
    const userId = req.user?.id; // From auth middleware
    
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const query = `
      SELECT b.*, c.quantity, c.added_at
      FROM cart c
      JOIN books b ON c.book_id = b.id
      WHERE c.user_id = $1
      ORDER BY c.added_at DESC
    `;
    
    const result = await dbPool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
}

export async function addToCart(req, res) {
  try {
    const dbPool = req.app.locals.db;
    const userId = req.user?.id;
    const { bookId } = req.body;
    
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!bookId) {
      return res.status(400).json({ error: 'bookId is required' });
    }

    // Verify book exists
    const bookCheck = await dbPool.query(
      'SELECT id FROM books WHERE id = $1 AND is_active = true',
      [bookId]
    );
    
    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Insert or update quantity
    await dbPool.query(
      `INSERT INTO cart (user_id, book_id, quantity)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, book_id)
       DO UPDATE SET quantity = cart.quantity + 1, updated_at = CURRENT_TIMESTAMP`,
      [userId, bookId]
    );

    // Return updated cart
    const query = `
      SELECT b.*, c.quantity, c.added_at
      FROM cart c
      JOIN books b ON c.book_id = b.id
      WHERE c.user_id = $1
      ORDER BY c.added_at DESC
    `;
    
    const result = await dbPool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
}

export async function removeFromCart(req, res) {
  try {
    const dbPool = req.app.locals.db;
    const userId = req.user?.id;
    const { bookId } = req.body;
    
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await dbPool.query(
      'DELETE FROM cart WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );

    // Return updated cart
    const query = `
      SELECT b.*, c.quantity, c.added_at
      FROM cart c
      JOIN books b ON c.book_id = b.id
      WHERE c.user_id = $1
      ORDER BY c.added_at DESC
    `;
    
    const result = await dbPool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
}

export async function clearCart(req, res) {
  try {
    const dbPool = req.app.locals.db;
    const userId = req.user?.id;
    
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await dbPool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
    res.json([]);
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
}
```

**File to modify**: `server/src/features/library/library.controller.js`

```javascript
// ✅ FIXED: Database-backed library controller
export async function getLibrary(req, res) {
  try {
    const dbPool = req.app.locals.db;
    const userId = req.user?.id;
    
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const query = `
      SELECT b.*, ul.added_at, ul.progress_percent, ul.is_favorite, ul.rating
      FROM user_library ul
      JOIN books b ON ul.book_id = b.id
      WHERE ul.user_id = $1
      ORDER BY ul.added_at DESC
    `;
    
    const result = await dbPool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get library error:', error);
    res.status(500).json({ error: 'Failed to fetch library' });
  }
}

export async function addToLibrary(req, res) {
  try {
    const dbPool = req.app.locals.db;
    const userId = req.user?.id;
    const { bookId } = req.body;
    
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!bookId) {
      return res.status(400).json({ error: 'bookId is required' });
    }

    // Verify book exists
    const bookCheck = await dbPool.query(
      'SELECT id FROM books WHERE id = $1 AND is_active = true',
      [bookId]
    );
    
    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Insert or ignore if already exists
    await dbPool.query(
      `INSERT INTO user_library (user_id, book_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, book_id) DO NOTHING`,
      [userId, bookId]
    );

    // Return updated library
    const query = `
      SELECT b.*, ul.added_at, ul.progress_percent, ul.is_favorite, ul.rating
      FROM user_library ul
      JOIN books b ON ul.book_id = b.id
      WHERE ul.user_id = $1
      ORDER BY ul.added_at DESC
    `;
    
    const result = await dbPool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Add to library error:', error);
    res.status(500).json({ error: 'Failed to add to library' });
  }
}
```

### Route Protection Required

Update `server/src/features/cart/cart.router.js`:
```javascript
import { Router } from 'express';
import { authCognito } from '../../middleware/authCognito.js';
import { getCart, addToCart, removeFromCart, clearCart } from './cart.controller.js';

const router = Router();

// All cart routes require authentication
router.get('/', authCognito(), getCart);
router.post('/add', authCognito(), addToCart);
router.post('/remove', authCognito(), removeFromCart);
router.post('/clear', authCognito(), clearCart);

export default router;
```

Update `server/src/features/library/library.router.js`:
```javascript
import { Router } from 'express';
import { authCognito } from '../../middleware/authCognito.js';
import { getLibrary, addToLibrary } from './library.controller.js';

const router = Router();

// All library routes require authentication
router.get('/', authCognito(), getLibrary);
router.post('/add', authCognito(), addToLibrary);

export default router;
```

### Testing Commands
```bash
# After fix, test with:
curl -X GET http://localhost:3001/api/cart \
  -H "Authorization: Bearer <access_token>"

curl -X POST http://localhost:3001/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"bookId": "<valid-uuid>"}'

# Restart server and verify data persists
```

**Estimated Time**: 2-3 hours

---

## 🎯 Bug #2: User Sync Endpoint Missing

### Problem Description
There is no `POST /api/users/sync` endpoint to sync Cognito users with the PostgreSQL `users` table. After a user signs up via Cognito, they don't exist in the local database, which means cart/library operations fail (foreign key constraint).

**Impact**: HIGH - Cart/Library won't work for any user until they're synced to PostgreSQL

### Current State
- Cognito handles authentication (sign up, sign in, tokens)
- PostgreSQL `users` table has `cognito_sub` column for linking
- No automatic sync between Cognito and PostgreSQL

### Solution: Create User Sync Endpoint

**Create new file**: `server/src/routes/users.js`

```javascript
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authCognito } from '../middleware/authCognito.js';

const router = express.Router();
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * POST /api/users/sync
 * Sync authenticated Cognito user to PostgreSQL database
 * Creates user record if not exists, updates if exists
 */
router.post(
  '/sync',
  authCognito(),
  [
    body('username').optional().trim().isLength({ min: 3, max: 30 }),
    body('fullName').optional().trim().isLength({ max: 255 }),
    body('avatarUrl').optional().isURL(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const dbPool = req.app.locals.db;
      if (!dbPool) {
        return res.status(503).json({ error: 'Database unavailable' });
      }

      // req.user is populated by authCognito middleware
      const cognitoUser = req.user;
      if (!cognitoUser || !cognitoUser.sub) {
        return res.status(401).json({ error: 'Invalid authentication' });
      }

      const { username, fullName, avatarUrl } = req.body;

      // Check if user already exists
      const existingUser = await dbPool.query(
        'SELECT id, email, username FROM users WHERE cognito_sub = $1',
        [cognitoUser.sub]
      );

      let userId;
      let isNewUser = false;

      if (existingUser.rows.length > 0) {
        // Update existing user
        userId = existingUser.rows[0].id;
        
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (fullName !== undefined) {
          updates.push(`full_name = $${paramIndex++}`);
          params.push(fullName);
        }
        if (avatarUrl !== undefined) {
          updates.push(`avatar_url = $${paramIndex++}`);
          params.push(avatarUrl);
        }
        if (cognitoUser.email && cognitoUser.email !== existingUser.rows[0].email) {
          updates.push(`email = $${paramIndex++}`);
          params.push(cognitoUser.email);
        }

        updates.push('last_login_at = CURRENT_TIMESTAMP');

        if (updates.length > 0) {
          params.push(userId);
          await dbPool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            params
          );
        }
      } else {
        // Create new user
        isNewUser = true;
        
        // Generate username if not provided
        const finalUsername = username || 
          cognitoUser.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '') + 
          Math.floor(Math.random() * 1000);

        const insertResult = await dbPool.query(
          `INSERT INTO users (
            cognito_sub, 
            email, 
            username, 
            full_name, 
            avatar_url, 
            email_verified,
            last_login_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          RETURNING id, email, username, full_name, avatar_url, role, subscription_tier, created_at`,
          [
            cognitoUser.sub,
            cognitoUser.email,
            finalUsername,
            fullName || cognitoUser.name || null,
            avatarUrl || null,
            cognitoUser.email_verified || false,
          ]
        );

        userId = insertResult.rows[0].id;
      }

      // Fetch complete user data
      const userResult = await dbPool.query(
        `SELECT id, email, username, full_name, avatar_url, role, 
                subscription_tier, created_at, last_login_at
         FROM users WHERE id = $1`,
        [userId]
      );

      const user = userResult.rows[0];

      res.status(isNewUser ? 201 : 200).json({
        success: true,
        message: isNewUser ? 'User created successfully' : 'User synced successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
          role: user.role,
          subscriptionTier: user.subscription_tier,
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at,
        },
      });
    } catch (error) {
      console.error('[Users] Sync error:', error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Username or email already exists',
          code: 'DUPLICATE_USER',
        });
      }

      res.status(500).json({
        error: NODE_ENV === 'development' ? error.message : 'User sync failed',
      });
    }
  }
);

/**
 * GET /api/users/me
 * Get current user's profile from database
 */
router.get('/me', authCognito(), async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const cognitoUser = req.user;
    if (!cognitoUser || !cognitoUser.sub) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const result = await dbPool.query(
      `SELECT id, email, username, full_name, avatar_url, bio, role, 
              subscription_tier, subscription_expires_at, preferences,
              created_at, last_login_at
       FROM users WHERE cognito_sub = $1`,
      [cognitoUser.sub]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Please call POST /api/users/sync first',
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        role: user.role,
        subscriptionTier: user.subscription_tier,
        subscriptionExpiresAt: user.subscription_expires_at,
        preferences: user.preferences,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
      },
    });
  } catch (error) {
    console.error('[Users] Get profile error:', error);
    res.status(500).json({
      error: NODE_ENV === 'development' ? error.message : 'Failed to fetch profile',
    });
  }
});

export default router;
```

### Register Routes in App

**Modify**: `server/src/app.js`

Add at the top with other imports:
```javascript
import usersRoutes from './routes/users.js';
```

Add after auth routes (around line 279):
```javascript
// Auth routes
app.use('/api/auth', authRoutes);

// Users routes (NEW)
app.use('/api/users', usersRoutes);
```

### Frontend Integration

**Modify**: `client/src/context/AuthContext.jsx`

Add sync call after successful sign-in:
```javascript
const signIn = async (email, password) => {
  const result = await authService.signIn(email, password);
  if (result.success) {
    // Sync user to database after successful login
    try {
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${result.tokens.accessToken}`,
        },
      });
    } catch (syncError) {
      console.warn('User sync failed:', syncError);
      // Don't block login on sync failure
    }
    setUser(result.user);
  }
  return result;
};
```

### Testing Commands
```bash
# Test user sync
curl -X POST http://localhost:3001/api/users/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"username": "testuser", "fullName": "Test User"}'

# Verify user exists in database
psql mangu_db -c "SELECT id, email, username FROM users;"
```

**Estimated Time**: 1-2 hours

---

## 🎯 Bug #3: Stripe Webhook Handler Missing

### Problem Description
The current Stripe integration (`server/src/payments/stripe.routes.js`) only creates checkout sessions but has **no webhook handler** to process completed payments. This means:
- Payment completes on Stripe's side
- Server never knows about it
- Orders never get created
- Books never get added to user library

**Impact**: CRITICAL - Payments "work" but nothing happens afterward

### Current Code

**File**: `server/src/payments/stripe.routes.js`
```javascript
// ❌ INCOMPLETE: Only creates sessions, no webhook
router.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({...});
  res.json({ url: session.url });
});
// No webhook endpoint!
```

### Solution: Add Webhook Handler

**Replace**: `server/src/payments/stripe.routes.js`

```javascript
import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20'
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/payments/create-checkout-session
 * Create a Stripe Checkout session for cart items
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { items = [], userId, returnUrl } = req.body;

    if (!items.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const line_items = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name || item.title || 'Book',
          description: item.description?.substring(0, 500),
          images: item.cover_url ? [item.cover_url] : [],
        },
        unit_amount: Number(item.price_cents || item.amount || 0),
      },
      quantity: Number(item.quantity || 1),
    }));

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/cart?canceled=1`,
      metadata: {
        userId: userId || 'anonymous',
        bookIds: items.map(i => i.id || i.bookId).join(','),
      },
      customer_email: req.body.email || undefined,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Stripe webhook events
 * IMPORTANT: This endpoint must receive raw body, not JSON parsed
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      if (endpointSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } else {
        // Development fallback (not secure for production)
        event = JSON.parse(req.body.toString());
        console.warn('⚠️ Webhook signature verification disabled (dev mode)');
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    const dbPool = req.app.locals.db;

    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('✅ Payment successful:', session.id);

        try {
          await handleSuccessfulPayment(dbPool, session);
        } catch (error) {
          console.error('Failed to process payment:', error);
          // Don't return error - acknowledge receipt to Stripe
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        console.log('⏰ Checkout session expired:', session.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('❌ Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    res.json({ received: true });
  }
);

/**
 * Process successful payment
 * - Create order record
 * - Add books to user library
 * - Clear user cart
 */
async function handleSuccessfulPayment(dbPool, session) {
  if (!dbPool) {
    console.error('Database not available for payment processing');
    return;
  }

  const { userId, bookIds } = session.metadata || {};
  const bookIdArray = bookIds ? bookIds.split(',').filter(Boolean) : [];

  if (!userId || userId === 'anonymous') {
    console.warn('No user ID for payment, skipping library update');
    return;
  }

  const client = await dbPool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Create order record
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id, order_number, status, payment_intent_id,
        payment_method, subtotal_cents, total_cents, currency,
        payment_metadata, processed_at
      ) VALUES ($1, $2, 'completed', $3, 'stripe', $4, $4, 'USD', $5, CURRENT_TIMESTAMP)
      RETURNING id`,
      [
        userId,
        orderNumber,
        session.payment_intent,
        session.amount_total,
        JSON.stringify({
          sessionId: session.id,
          customerEmail: session.customer_email,
          paymentStatus: session.payment_status,
        }),
      ]
    );
    
    const orderId = orderResult.rows[0].id;

    // 2. Create order items and add to library
    for (const bookId of bookIdArray) {
      // Get book price
      const bookResult = await client.query(
        'SELECT id, price_cents FROM books WHERE id = $1',
        [bookId]
      );

      if (bookResult.rows.length === 0) {
        console.warn(`Book ${bookId} not found, skipping`);
        continue;
      }

      const book = bookResult.rows[0];

      // Add order item
      await client.query(
        `INSERT INTO order_items (order_id, book_id, quantity, unit_price_cents, total_price_cents)
         VALUES ($1, $2, 1, $3, $3)`,
        [orderId, bookId, book.price_cents]
      );

      // Add to user library
      await client.query(
        `INSERT INTO user_library (user_id, book_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, book_id) DO NOTHING`,
        [userId, bookId]
      );
    }

    // 3. Clear user cart
    await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    await client.query('COMMIT');
    console.log(`✅ Order ${orderNumber} processed successfully`);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * GET /api/payments/session/:sessionId
 * Retrieve checkout session details (for success page)
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId,
      { expand: ['line_items'] }
    );

    res.json({
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_email,
      lineItems: session.line_items?.data,
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(404).json({ error: 'Session not found' });
  }
});

export default router;
```

### Register Routes in App

**Modify**: `server/src/app.js`

Add import:
```javascript
import stripeRoutes from './payments/stripe.routes.js';
```

Add route (BEFORE body parsers for raw body support):
```javascript
// Stripe webhook needs raw body - must be before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Then other routes
app.use('/api/payments', stripeRoutes);
```

### Environment Variables Required

Add to `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx  # Get from Stripe Dashboard > Webhooks
FRONTEND_URL=http://localhost:5173
```

### Setup Stripe Webhook in Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### Testing Locally with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/payments/webhook

# In another terminal, trigger test event
stripe trigger checkout.session.completed
```

**Estimated Time**: 2-3 hours

---

## 🎯 Bug #4: DynamoDB Code Conflicts

### Problem Description
The codebase has **DynamoDB model files** that conflict with the PostgreSQL-based architecture. This causes confusion and potential runtime errors.

**Impact**: MEDIUM - Code confusion, potential bugs if wrong imports used

### Files to Remove/Archive

```
server/src/models/BookModel.js  <- DynamoDB model, not used
```

### Current DynamoDB Code

**File**: `server/src/models/BookModel.js`
```javascript
// ❌ This file is for DynamoDB but we use PostgreSQL
export const BOOKS_TABLE_NAME = 'mangu-books';

export const bookToItem = (book) => {
  return {
    id: { N: book.id.toString() },  // DynamoDB format
    title: { S: book.title },
    author: { S: book.author },
    // ...
  };
};

export const itemToBook = (item) => {
  return {
    id: parseInt(item.id.N),  // DynamoDB format
    // ...
  };
};
```

### Solution: Remove or Archive

**Option 1: Delete the file**
```bash
rm server/src/models/BookModel.js
```

**Option 2: Archive for reference**
```bash
mkdir -p server/src/models/_archived
mv server/src/models/BookModel.js server/src/models/_archived/BookModel.dynamodb.js
```

### Verify No Active Usage

```bash
# Check if file is imported anywhere
grep -r "BookModel" server/src --include="*.js"
grep -r "BOOKS_TABLE_NAME\|bookToItem\|itemToBook" server/src --include="*.js"
```

If any active imports are found, update them to use PostgreSQL queries instead.

### Create PostgreSQL Book Model (Optional)

If you want a clean model layer for books:

**Create**: `server/src/models/Book.js`

```javascript
/**
 * Book model for PostgreSQL
 * Provides clean interface for book operations
 */

const BOOK_WITH_RELATIONS_QUERY = `
  SELECT b.*,
         array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as categories,
         array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) as authors,
         p.name as publisher_name
  FROM books b
  LEFT JOIN book_categories bc ON b.id = bc.book_id
  LEFT JOIN categories c ON bc.category_id = c.id
  LEFT JOIN book_authors ba ON b.id = ba.book_id
  LEFT JOIN authors a ON ba.author_id = a.id
  LEFT JOIN publishers p ON b.publisher_id = p.id
`;

export class BookModel {
  constructor(dbPool) {
    this.db = dbPool;
  }

  async findById(id) {
    const query = `${BOOK_WITH_RELATIONS_QUERY}
      WHERE b.id = $1 AND b.is_active = true
      GROUP BY b.id, p.name`;
    
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findFeatured(limit = 1) {
    const query = `${BOOK_WITH_RELATIONS_QUERY}
      WHERE b.is_featured = true AND b.is_active = true
      GROUP BY b.id, p.name
      ORDER BY b.rating DESC
      LIMIT $1`;
    
    const result = await this.db.query(query, [limit]);
    return result.rows;
  }

  async findTrending(limit = 10, offset = 0) {
    const query = `${BOOK_WITH_RELATIONS_QUERY}
      WHERE b.is_active = true
      GROUP BY b.id, p.name
      ORDER BY b.view_count DESC, b.rating DESC
      LIMIT $1 OFFSET $2`;
    
    const result = await this.db.query(query, [limit, offset]);
    return result.rows;
  }

  async search({ q, category, author, limit = 20, offset = 0 }) {
    let query = `${BOOK_WITH_RELATIONS_QUERY} WHERE b.is_active = true`;
    const params = [];
    let paramIndex = 0;

    if (q) {
      paramIndex++;
      query += ` AND (b.title ILIKE $${paramIndex} OR b.description ILIKE $${paramIndex})`;
      params.push(`%${q}%`);
    }

    if (category) {
      paramIndex++;
      query += ` AND c.slug = $${paramIndex}`;
      params.push(category);
    }

    if (author) {
      paramIndex++;
      query += ` AND a.name ILIKE $${paramIndex}`;
      params.push(`%${author}%`);
    }

    query += ' GROUP BY b.id, p.name ORDER BY b.rating DESC';
    query += ` LIMIT $${++paramIndex} OFFSET $${++paramIndex}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async incrementViewCount(id) {
    await this.db.query(
      'UPDATE books SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );
  }
}

export default BookModel;
```

**Estimated Time**: 1-2 hours (including verification)

---

## 📊 Summary: Parallel Work Assignment

These 4 bugs can be fixed in parallel by different developers:

| Bug # | Task | Files | Time | Dependencies |
|-------|------|-------|------|--------------|
| 1 | Cart/Library persistence | `cart.controller.js`, `library.controller.js`, routers | 2-3h | Bug #2 (needs user ID) |
| 2 | User sync endpoint | New `routes/users.js`, `app.js` | 1-2h | None |
| 3 | Stripe webhooks | `stripe.routes.js`, `app.js` | 2-3h | Bug #1, #2 |
| 4 | Remove DynamoDB code | `models/BookModel.js` | 1h | None |

### Recommended Order
1. **Bug #2** (User sync) - No dependencies, enables other fixes
2. **Bug #4** (DynamoDB cleanup) - Quick win, no dependencies
3. **Bug #1** (Cart/Library) - Depends on user sync
4. **Bug #3** (Stripe webhooks) - Depends on cart/library and user sync

### Parallel Execution Strategy

**Agent 1**: Bug #2 + Bug #4 (2-3 hours)
- Create user sync endpoint
- Clean up DynamoDB code

**Agent 2**: Bug #1 (2-3 hours)
- Convert cart controller to database
- Convert library controller to database
- Update routers with auth middleware

**Agent 3**: Bug #3 (2-3 hours)
- Implement Stripe webhook handler
- Add order processing logic
- Test with Stripe CLI

---

## ✅ Verification Checklist

After all fixes are applied, verify:

- [ ] Server restarts without data loss
- [ ] Cart persists after logout/login
- [ ] Library items persist after server restart
- [ ] New users can be created via `/api/users/sync`
- [ ] Stripe test payments complete successfully
- [ ] Orders appear in database after payment
- [ ] Books added to library after purchase
- [ ] No DynamoDB imports in active code
- [ ] All PostgreSQL queries use parameterized queries (SQL injection safe)

---

## 🚀 Quick Start Commands

```bash
# 1. Start database and services
./start-dev.sh

# 2. Run migrations
cd server && npm run migrate

# 3. Start server
npm run dev

# 4. Start client (separate terminal)
cd client && npm run dev

# 5. Test endpoints
curl http://localhost:3001/api/health
```

---

## 📞 Support

If you encounter issues implementing these fixes:

1. Check `server/logs/` for error messages
2. Verify PostgreSQL is running: `psql -h localhost -U mangu_user -d mangu_db`
3. Test database connection: `curl http://localhost:3001/api/health`
4. Review environment variables in `.env`

---

*Document created: November 28, 2025*  
*For: MANGU Publishing Internal Beta*
