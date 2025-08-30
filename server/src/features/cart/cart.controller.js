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
