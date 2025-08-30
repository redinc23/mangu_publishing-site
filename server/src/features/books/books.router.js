import { Router } from 'express';
import { getFeaturedBook, getTrendingBooks, getNewReleases, getTopRatedBooks, getAllGenres, getBookById } from './books.controller.js';

const router = Router();

// GET /api/books/featured - fetch the featured book
router.get('/featured', getFeaturedBook);

// GET /api/books/trending - fetch trending books
router.get('/trending', getTrendingBooks);

// GET /api/books/new-releases - fetch new release books
router.get('/new-releases', getNewReleases);

// GET /api/books/top-rated - fetch top rated books
router.get('/top-rated', getTopRatedBooks);

// GET /api/books/all/genres - fetch all unique genres
router.get('/all/genres', getAllGenres);

// GET /api/books/:id - fetch details for a specific book by ID
router.get('/:id', getBookById);

export default router;