import { Router } from 'express';
import { getCart, addToCart, removeFromCart, clearCart } from './cart.controller.js';

const router = Router();

// GET /api/cart - get current cart items
router.get('/', getCart);

// POST /api/cart/add - add a book to cart (expects { bookId } in body)
router.post('/add', addToCart);

// POST /api/cart/remove - remove a book from cart
router.post('/remove', removeFromCart);

// POST /api/cart/clear - remove all items from cart
router.post('/clear', clearCart);

export default router;
