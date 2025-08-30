import { Router } from 'express';
import { getLibrary, addToLibrary } from './library.controller.js';

const router = Router();

// GET /api/library - retrieve user's library
router.get('/', getLibrary);

// POST /api/library/add - add a book to user's library
router.post('/add', addToLibrary);

export default router;
