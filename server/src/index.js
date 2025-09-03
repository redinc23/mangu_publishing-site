// server/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { authCognito } from './middleware/authCognito.js';
import { rateLimit } from './middleware/auth.js';

// Routers
import booksRouter from './features/books/books.router.js';
import authorsRouter from './features/authors/authors.router.js';
import cartRouter from './features/cart/cart.router.js';
import libraryRouter from './features/library/library.router.js';
import adminRouter from './features/admin/admin.router.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// Security & basics
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL // e.g. https://mangupublishing.com
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(rateLimit());

// Stripe webhook must see raw body (keep BEFORE express.json)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON parser for all other routes
app.use(express.json({ limit: '10mb' }));

// ----- Public routes -----
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Example: your books & authors likely public
app.use('/api/books', booksRouter);
app.use('/api/authors', authorsRouter);

// ----- Protected routes (require valid Cognito token) -----
// If you want the entire router protected:
app.use('/api/library', authCognito(), libraryRouter);
app.use('/api/cart', authCognito(), cartRouter);
// Admin probably should be protected too; add extra checks inside that router as needed:
app.use('/api/admin', authCognito(), adminRouter);

// Simple protected "who am I" endpoint for end-to-end testing
app.get('/api/me', authCognito(), (req, res) => {
  res.json({
    sub: req.auth.sub,
    username: req.auth.username,
    email: req.auth.email ?? null,
    tokenUse: req.auth.tokenUse, // 'access' or 'id'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res
    .status(500)
    .json({
      error:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message,
    });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
