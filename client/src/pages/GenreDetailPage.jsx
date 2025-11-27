import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './GenreDetailPage.css';

function GenreDetailPage() {
  const { id } = useParams();
  const [books, setBooks] = useState([]);
  const [genre, setGenre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGenreBooks = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.VITE_API_URL || 'http://localhost:3009';
        
        // First try to get category info
        const categoriesRes = await fetch(`${apiUrl}/api/categories`);
        const categories = await categoriesRes.json();
        const foundGenre = categories.find(c => c.id === id || c.slug === id);
        if (foundGenre) {
          setGenre(foundGenre);
        }

        // Fetch books for this genre
        const booksRes = await fetch(`${apiUrl}/api/genres/${id}`);
        if (!booksRes.ok) {
          throw new Error('Failed to fetch genre books');
        }
        const data = await booksRes.json();
        setBooks(Array.isArray(data.books) ? data.books : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching genre books:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGenreBooks();
  }, [id]);

  if (loading) {
    return (
      <div className="genre-detail-page">
        <div className="container">
          <div className="loading">Loading books...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="genre-detail-page">
        <div className="container">
          <div className="error">Error: {error}</div>
          <Link to="/genres" className="back-link">← Back to Genres</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="genre-detail-page">
      <section className="genre-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">{genre?.name || 'Genre'}</h1>
          <p className="hero-subtitle">
            {genre?.description || `Discover ${books.length} books in this genre`}
          </p>
          {genre?.book_count && (
            <p className="hero-count">{genre.book_count} Books Available</p>
          )}
        </div>
      </section>

      <div className="container">
        {books.length === 0 ? (
          <div className="empty-state">
            <h3>No books found</h3>
            <p>This genre doesn't have any books yet.</p>
            <Link to="/genres" className="back-link">← Browse All Genres</Link>
          </div>
        ) : (
          <>
            <div className="books-header">
              <h2>Books in {genre?.name || 'this genre'}</h2>
              <p className="books-count">{books.length} books</p>
            </div>
            <div className="books-grid">
              {books.map((book) => (
                <Link
                  key={book.id}
                  to={`/book/${book.id}`}
                  className="book-card"
                >
                  <div className="book-cover">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} />
                    ) : (
                      <div className="book-placeholder">
                        <i className="fas fa-book"></i>
                      </div>
                    )}
                  </div>
                  <div className="book-info">
                    <h3 className="book-title">{book.title}</h3>
                    {book.authors && book.authors.length > 0 && (
                      <p className="book-author">by {book.authors.join(', ')}</p>
                    )}
                    {book.rating && (
                      <div className="book-rating">
                        <i className="fas fa-star"></i> {book.rating.toFixed(1)}
                      </div>
                    )}
                    {book.priceCents > 0 && (
                      <p className="book-price">
                        ${(book.priceCents / 100).toFixed(2)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GenreDetailPage;

