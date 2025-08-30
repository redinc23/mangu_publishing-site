import { books } from '../../data/books.js';

// In-memory library storage
let libraryItems = [];

export function getLibrary(req, res) {
  res.json(libraryItems);
}

export function addToLibrary(req, res) {
  const { bookId } = req.body;
  const book = books.find(b => b.id === bookId);
  if (!book) {
    return res.status(400).json({ error: 'Invalid bookId' });
  }
  const alreadyAdded = libraryItems.find(item => item.id === bookId);
  if (!alreadyAdded) {
    libraryItems.push(book);
  }
  return res.json(libraryItems);
}
