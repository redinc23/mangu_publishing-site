import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { LibraryContext } from '../context/LibraryContext';
import './BookDetailsPage.css';

function BookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { addToLibrary } = useContext(LibraryContext);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch book details
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/books/${id}`);
        const data = await response.json();
        setBook(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching book details:', error);
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  const handleAddToCart = () => {
    addToCart(id);
  };

  const handleAddToLibrary = () => {
    addToLibrary(id);
  };

  if (loading) {
    return (
      <div className="book-details-page">
        <div className="loading-container">
          <div className="loading-spinner">Loading book details...</div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="book-details-page">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Book Not Found</h2>
          <p>The book you're looking for doesn't exist or has been removed.</p>
          <button className="btn btn-primary" onClick={() => navigate('/library')}>
            Browse Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-details-page">
      {/* Hero Section with Background */}
      <section className="book-hero">
        <div className="book-hero-background">
          <img
            src={book.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1920&q=80'}
            alt={book.title}
          />
          <div className="hero-overlay"></div>
        </div>

        <div className="book-hero-content">
          <div className="container">
            <div className="book-hero-inner">
              {/* Book Cover */}
              <div className="book-cover-large">
                <img
                  src={book.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&h=450&q=80'}
                  alt={book.title}
                />
                {book.is_new_release && <span className="new-badge">New Release</span>}
              </div>

              {/* Book Info */}
              <div className="book-info-main">
                <h1 className="book-title-large">{book.title}</h1>
                {book.subtitle && (
                  <h2 className="book-subtitle-large">{book.subtitle}</h2>
                )}

                <div className="book-meta-row">
                  <div className="book-author-large">
                    By {book.authors?.map(a => a.name).join(', ') || 'Unknown Author'}
                  </div>
                  <div className="book-meta-divider">•</div>
                  <div className="book-year">{new Date(book.publication_date).getFullYear()}</div>
                  <div className="book-meta-divider">•</div>
                  <div className="book-pages">{book.page_count} pages</div>
                </div>

                {/* Rating */}
                <div className="book-rating-large">
                  <div className="stars-large">
                    {'★'.repeat(Math.round(book.rating || 0))}
                    {'☆'.repeat(5 - Math.round(book.rating || 0))}
                  </div>
                  <div className="rating-info">
                    <span className="rating-number">{parseFloat(book.rating || 0).toFixed(1)}</span>
                    <span className="rating-count">({book.rating_count?.toLocaleString() || 0} ratings)</span>
                  </div>
                </div>

                {/* Categories */}
                {book.categories && book.categories.length > 0 && (
                  <div className="book-categories">
                    {book.categories.map((category, idx) => (
                      <span key={idx} className="category-badge">{category}</span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <p className="book-description-large">
                  {book.description}
                </p>

                {/* Action Buttons */}
                <div className="book-actions">
                  <button className="btn-action btn-primary-action">
                    <i className="fas fa-book-reader"></i> Start Reading
                  </button>
                  <button className="btn-action btn-secondary-action">
                    <i className="fas fa-headphones"></i> Listen
                  </button>
                  <button
                    className="btn-action btn-outline-action"
                    onClick={handleAddToLibrary}
                  >
                    <i className="fas fa-bookmark"></i> Save to Library
                  </button>
                  <button
                    className="btn-action btn-buy-action"
                    onClick={handleAddToCart}
                  >
                    <i className="fas fa-shopping-cart"></i> Buy ${(book.price_cents / 100).toFixed(2)}
                  </button>
                </div>

                {/* Additional Actions */}
                <div className="book-additional-actions">
                  <button className="icon-action" title="Share">
                    <i className="fas fa-share-alt"></i>
                  </button>
                  <button className="icon-action" title="Download">
                    <i className="fas fa-download"></i>
                  </button>
                  <button className="icon-action" title="Add to Wishlist">
                    <i className="fas fa-heart"></i>
                  </button>
                  <button className="icon-action" title="Report">
                    <i className="fas fa-flag"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="book-tabs-section">
        <div className="container">
          <div className="book-tabs">
            <button
              className={`book-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`book-tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button
              className={`book-tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
          </div>

          {/* Tab Content */}
          <div className="book-tab-content">
            {activeTab === 'overview' && (
              <div className="tab-pane">
                <div className="overview-grid">
                  <div className="overview-main">
                    <h3 className="section-heading">About This Book</h3>
                    <p className="overview-description">{book.description}</p>

                    {book.categories && book.categories.length > 0 && (
                      <div className="overview-section">
                        <h4>Genres</h4>
                        <div className="genre-list">
                          {book.categories.map((cat, idx) => (
                            <span key={idx} className="genre-item">{cat}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="overview-sidebar">
                    <div className="info-card">
                      <h4>Book Information</h4>
                      <div className="info-item">
                        <span className="info-label">Publisher</span>
                        <span className="info-value">{book.publisher || 'MANGU Publishing'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Publication Date</span>
                        <span className="info-value">
                          {new Date(book.publication_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Pages</span>
                        <span className="info-value">{book.page_count}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Language</span>
                        <span className="info-value">{book.language || 'English'}</span>
                      </div>
                      {book.isbn13 && (
                        <div className="info-item">
                          <span className="info-label">ISBN-13</span>
                          <span className="info-value">{book.isbn13}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="tab-pane">
                <h3 className="section-heading">Complete Details</h3>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">Title</span>
                    <span className="detail-value">{book.title}</span>
                  </div>
                  {book.subtitle && (
                    <div className="detail-row">
                      <span className="detail-label">Subtitle</span>
                      <span className="detail-value">{book.subtitle}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Author(s)</span>
                    <span className="detail-value">
                      {book.authors?.map(a => a.name).join(', ') || 'Unknown'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Publisher</span>
                    <span className="detail-value">{book.publisher || 'MANGU Publishing'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Publication Date</span>
                    <span className="detail-value">
                      {new Date(book.publication_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Pages</span>
                    <span className="detail-value">{book.page_count}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Language</span>
                    <span className="detail-value">{book.language || 'English'}</span>
                  </div>
                  {book.isbn13 && (
                    <div className="detail-row">
                      <span className="detail-label">ISBN-13</span>
                      <span className="detail-value">{book.isbn13}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Average Rating</span>
                    <span className="detail-value">
                      {parseFloat(book.rating || 0).toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Ratings</span>
                    <span className="detail-value">{book.rating_count?.toLocaleString() || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Price</span>
                    <span className="detail-value">${(book.price_cents / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="tab-pane">
                <h3 className="section-heading">Reader Reviews</h3>
                <div className="reviews-summary">
                  <div className="average-rating">
                    <div className="rating-number-big">{parseFloat(book.rating || 0).toFixed(1)}</div>
                    <div className="stars-big">
                      {'★'.repeat(Math.round(book.rating || 0))}
                      {'☆'.repeat(5 - Math.round(book.rating || 0))}
                    </div>
                    <div className="rating-count-text">
                      Based on {book.rating_count?.toLocaleString() || 0} reviews
                    </div>
                  </div>
                </div>
                <div className="reviews-placeholder">
                  <i className="fas fa-comments"></i>
                  <p>Reviews feature coming soon...</p>
                  <p className="placeholder-text">Join the conversation about this book!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default BookDetailsPage;
