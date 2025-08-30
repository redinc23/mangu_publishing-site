import { Router } from 'express';
import { getCart, addToCart } from './cart.controller.js';

const router = Router();

// GET /api/cart - get current cart items
router.get('/', getCart);

// POST /api/cart/add - add a book to cart (expects { bookId } in body)
router.post('/add', addToCart);

export default router;
