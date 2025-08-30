import { Router } from 'express';
import { getFeaturedAuthors } from './authors.controller.js';

const router = Router();

// GET /api/authors/featured - fetch list of featured authors
router.get('/featured', getFeaturedAuthors);

export default router;
