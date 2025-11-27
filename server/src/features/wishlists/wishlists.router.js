// server/src/features/wishlists/wishlists.router.js
import { Router } from 'express';
import {
  getWishlists,
  createWishlist,
  getWishlist,
  updateWishlist,
  deleteWishlist,
  addItemToWishlist,
  removeItemFromWishlist
} from './wishlists.controller.js';

const router = Router();

// GET /api/wishlists - Get user's wishlists
router.get('/', getWishlists);

// POST /api/wishlists - Create wishlist
router.post('/', createWishlist);

// GET /api/wishlists/:id - Get wishlist with items
router.get('/:id', getWishlist);

// PUT /api/wishlists/:id - Update wishlist
router.put('/:id', updateWishlist);

// DELETE /api/wishlists/:id - Delete wishlist
router.delete('/:id', deleteWishlist);

// POST /api/wishlists/:id/items - Add book to wishlist
router.post('/:id/items', addItemToWishlist);

// DELETE /api/wishlists/:id/items/:bookId - Remove book from wishlist
router.delete('/:id/items/:bookId', removeItemFromWishlist);

export default router;
