import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './SeriesDetailPage.css';

function SeriesDetailPage() {
  const { id } = useParams();
  const [series, setSeries] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeriesData = async () => {
      try {
        setLoading(true);
        // Fetch books in this series
        const booksRes = await fetch(`http://localhost:3002/api/books?series=${id}`);
        const booksData = await booksRes.json();

        setBooks(booksData.books || []);
        if (booksData.books && booksData.books.length > 0) {
          setSeries({ name: `Series: ${booksData.books[0].series || id}` });
        }
      } catch (error) {
        console.error('Error fetching series data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesData();
  }, [id]);

  if (loading) {
    return (
      <div className="series-page">
        <div className="loading">Loading series...</div>
      </div>
    );
  }

  return (
    <div className="series-page">
      <div className="series-hero">
        <h1>{series?.name || 'Book Series'}</h1>
        <p className="series-count">{books.length} {books.length === 1 ? 'book' : 'books'} in this series</p>
      </div>

      <div className="series-books">
        {books.length === 0 ? (
          <div className="no-books">
            <p>No books found in this series yet.</p>
          </div>
        ) : (
          books.map((book, index) => (
            <Link to={`/books/${book.id}`} key={book.id} className="series-book-card">
              <div className="book-number">Book {index + 1}</div>
              <div className="book-cover">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} />
                ) : (
                  <div className="cover-placeholder">{book.title[0]}</div>
                )}
              </div>
              <div className="book-details">
                <h3 className="book-title">{book.title}</h3>
                {book.authors && book.authors.length > 0 && (
                  <p className="book-author">
                    {Array.isArray(book.authors) ? book.authors.filter(a => a).join(', ') : book.authors}
                  </p>
                )}
                {book.description && (
                  <p className="book-description">{book.description.substring(0, 150)}...</p>
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

export default SeriesDetailPage;
