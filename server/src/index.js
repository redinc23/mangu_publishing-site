import 'dotenv/config'; // This loads the variables from .env

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import booksRouter from './features/books/books.router.js';
import authorsRouter from './features/authors/authors.router.js';
import cartRouter from './features/cart/cart.router.js';
import libraryRouter from './features/library/library.router.js';
// Import the new admin router
import adminRouter from './features/admin/admin.router.js';

const app = express();
const PORT = 5000;

// Middleware setup
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// API routes
app.use('/api/books', booksRouter);
app.use('/api/authors', authorsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/library', libraryRouter);
// Add the admin API routes
app.use('/api/admin', adminRouter);

// Simple health check endpoint (optional)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/`);
});