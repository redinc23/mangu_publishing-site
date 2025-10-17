import { books } from '../../data/books.js';

// In-memory cart storage (array of book objects)
let cartItems = [];

export function getCart(req, res) {
  res.json(cartItems);
}

export function addToCart(req, res) {
  const { bookId } = req.body;
  const book = books.find(b => b.id === bookId);
  if (!book) {
    return res.status(400).json({ error: 'Invalid bookId' });
  }
  // If not already in cart, add it
  const alreadyInCart = cartItems.find(item => item.id === bookId);
  if (!alreadyInCart) {
    cartItems.push(book);
  }
  // Return the updated cart
  return res.json(cartItems);
}

export function removeFromCart(req, res) {
  const { bookId } = req.body;
  const id = typeof bookId === 'string' ? parseInt(bookId, 10) : bookId;

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid bookId' });
  }

  cartItems = cartItems.filter(item => item.id !== id);
  return res.json(cartItems);
}

export function clearCart(req, res) {
  cartItems = [];
  return res.json(cartItems);
}
