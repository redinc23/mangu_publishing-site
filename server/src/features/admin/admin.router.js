import { Router } from 'express';
import {
  getAdminBooks,
  getAdminBook,
  createBook,
  updateBook,
  deleteBook,
  getAnalytics
} from './admin.controller.js';

const router = Router();

// GET /api/admin/analytics - Get analytics dashboard data
router.get('/analytics', getAnalytics);

// GET /api/admin/books - Get all books for admin management
router.get('/books', getAdminBooks);

// GET /api/admin/books/:id - Get a specific book
router.get('/books/:id', getAdminBook);

// POST /api/admin/books - Create a new book
router.post('/books', createBook);

// PUT /api/admin/books/:id - Update a book
router.put('/books/:id', updateBook);

// DELETE /api/admin/books/:id - Delete a book
router.delete('/books/:id', deleteBook);

export default router;