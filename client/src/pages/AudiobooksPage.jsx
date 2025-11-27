import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ContentPage.css';

function AudiobooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudiobooks = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/books?format=audiobook');
        const data = await response.json();
        setBooks(data.books || []);
      } catch (error) {
        console.error('Error fetching audiobooks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudiobooks();
  }, []);

  if (loading) {
    return <div className="content-page"><div className="loading">Loading audiobooks...</div></div>;
  }

  return (
    <div className="content-page">
      <div className="page-hero">
        <h1>🎧 Audiobooks</h1>
        <p>Listen to great stories narrated by professional voice actors</p>
      </div>

      <div className="books-grid">
        {books.length === 0 ? (
          <div className="no-content">
            <p>No audiobooks available yet. Check back soon!</p>
          </div>
        ) : (
          books.map(book => (
            <Link to={`/books/${book.id}`} key={book.id} className="book-card">
              <div className="book-cover">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} />
                ) : (
                  <div className="cover-placeholder">🎧</div>
                )}
              </div>
              <div className="book-info">
                <h3>{book.title}</h3>
                {book.authors && <p className="author">{Array.isArray(book.authors) ? book.authors.filter(a => a).join(', ') : book.authors}</p>}
                {book.price && <p className="price">${parseFloat(book.price).toFixed(2)}</p>}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default AudiobooksPage;
