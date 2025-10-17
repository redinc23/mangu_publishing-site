import { normalizeAuthors } from './normalizeAuthors.js';

export function formatBook(book) {
  if (!book) {
    return book;
  }

  return {
    ...book,
    authors: normalizeAuthors(book.authors)
  };
}
