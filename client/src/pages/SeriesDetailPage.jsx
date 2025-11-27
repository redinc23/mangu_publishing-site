import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './SeriesDetailPage.css';

function SeriesDetailPage() {
  const { id } = useParams();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSeriesBooks = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.VITE_API_URL || 'http://localhost:3009';
        const res = await fetch(`${apiUrl}/api/series/${id}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch series books');
        }
        const data = await res.json();
        setBooks(Array.isArray(data.books) ? data.books : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching series books:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesBooks();
  }, [id]);

  if (loading) {
    return (
      <div className="series-detail-page">
        <div className="container">
          <div className="loading">Loading series books...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="series-detail-page">
        <div className="container">
          <div className="error">Error: {error}</div>
          <Link to="/series" className="back-link">← Back to Series</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="series-detail-page">
      <section className="series-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Series Collection</h1>
          <p className="hero-subtitle">
            Discover {books.length} books in this series
          </p>
        </div>
      </section>

      <div className="container">
        {books.length === 0 ? (
          <div className="empty-state">
            <h3>No books found</h3>
            <p>This series doesn't have any books yet.</p>
            <Link to="/series" className="back-link">← Browse All Series</Link>
          </div>
        ) : (
          <>
            <div className="books-header">
              <h2>Books in Series</h2>
              <p className="books-count">{books.length} books</p>
            </div>
            <div className="books-grid">
              {books.map((book, index) => (
                <Link
                  key={book.id}
                  to={`/book/${book.id}`}
                  className="book-card"
                >
                  <div className="book-number">{index + 1}</div>
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

export default SeriesDetailPage;

