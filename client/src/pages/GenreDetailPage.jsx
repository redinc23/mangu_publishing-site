import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './GenreDetailPage.css';

function GenreDetailPage() {
  const { id } = useParams();
  const [genre, setGenre] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    const fetchGenreData = async () => {
      try {
        setLoading(true);
        // Fetch genre info
        const genreRes = await fetch(`http://localhost:3002/api/categories/${id}`);
        const genreData = await genreRes.json();

        // Fetch books in this genre
        const booksRes = await fetch(`http://localhost:3002/api/books?category=${id}&sort=${sortBy}`);
        const booksData = await booksRes.json();

        setGenre(genreData.category || { name: 'Genre' });
        setBooks(booksData.books || []);
      } catch (error) {
        console.error('Error fetching genre data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenreData();
  }, [id, sortBy]);

  if (loading) {
    return (
      <div className="genre-page">
        <div className="loading">Loading genre...</div>
      </div>
    );
  }

  return (
    <div className="genre-page">
      <div className="genre-hero">
        <h1>{genre?.name || 'Genre'}</h1>
        {genre?.description && <p className="genre-description">{genre.description}</p>}
      </div>

      <div className="genre-controls">
        <div className="filter-bar">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="popular">Most Popular</option>
            <option value="new">Newest First</option>
            <option value="rating">Highest Rated</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
        <div className="results-count">
          {books.length} {books.length === 1 ? 'book' : 'books'} found
        </div>
      </div>

      <div className="books-grid">
        {books.length === 0 ? (
          <div className="no-books">
            <p>No books found in this genre yet.</p>
          </div>
        ) : (
          books.map(book => (
            <Link to={`/books/${book.id}`} key={book.id} className="book-card">
              <div className="book-cover">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} />
                ) : (
                  <div className="cover-placeholder">{book.title[0]}</div>
                )}
              </div>
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                {book.authors && book.authors.length > 0 && (
                  <p className="book-author">
                    {Array.isArray(book.authors) ? book.authors.filter(a => a).join(', ') : book.authors}
                  </p>
                )}
                {book.price && (
                  <p className="book-price">${parseFloat(book.price).toFixed(2)}</p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default GenreDetailPage;
