import { featuredBook, trendingBooks, newReleases, books } from '../../data/books.js';

export function getFeaturedBook(req, res) {
  res.json(featuredBook);
}

export function getTrendingBooks(req, res) {
  res.json(trendingBooks);
}

export function getNewReleases(req, res) {
  res.json(newReleases);
}

// New: Get books with rating, sorted by rating descending
export function getTopRatedBooks(req, res) {
  // Filter books that have a numeric rating (not null/undefined)
  const ratedBooks = books.filter(book => typeof book.rating === 'number');
  // Sort in descending order by rating
  ratedBooks.sort((a, b) => b.rating - a.rating);
  res.json(ratedBooks);
}

// New: Get all unique genres from books
export function getAllGenres(req, res) {
  const genresSet = new Set();
  for (const book of books) {
    if (book.genre) {
      genresSet.add(book.genre);
    }
  }
  const genresList = Array.from(genresSet);
  // Optionally sort alphabetically for consistency
  genresList.sort();
  res.json(genresList);
}

export function getBookById(req, res) {
  const bookId = Number(req.params.id);
  const book = books.find(b => b.id === bookId);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  res.json(book);
}