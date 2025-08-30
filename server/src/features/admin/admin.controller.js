// For now, we'll work with the in-memory data array
import { books } from '../../data/books.js';

// Get all books for admin
export function getAdminBooks(req, res) {
  res.json(books);
}

// Create a new book
export function createBook(req, res) {
  // TODO: Connect to database
  // For now, just log the received data
  console.log('Received book data:', req.body);
  // Simulate adding a book
  const newBook = { 
    id: Math.max(...books.map(b => b.id)) + 1, 
    ...req.body 
  };
  books.push(newBook);
  res.status(201).json(newBook);
}

// Update a book
export function updateBook(req, res) {
  // TODO: Connect to database
  const bookId = Number(req.params.id);
  const bookIndex = books.findIndex(b => b.id === bookId);
  
  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  books[bookIndex] = { ...books[bookIndex], ...req.body };
  res.json(books[bookIndex]);
}

// Delete a book
export function deleteBook(req, res) {
  // TODO: Connect to database
  const bookId = Number(req.params.id);
  const bookIndex = books.findIndex(b => b.id === bookId);
  
  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  books.splice(bookIndex, 1);
  res.status(204).send(); // No content
}