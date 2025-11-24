import React, { useEffect, useRef, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { LibraryContext } from '../context/LibraryContext';
import { booksApi } from '../utils/api';
import './HomePage.css';

function HomePage() {
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const readingProgressRef = useRef(null);
  const navigate = useNavigate();

  // Contexts
  const { addToCart } = useContext(CartContext);
  const { addToLibrary } = useContext(LibraryContext);

  // State for API data
  const [featuredBook, setFeaturedBook] = useState(null);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, trending, releases] = await Promise.all([
          booksApi.getFeatured(),
          booksApi.getTrending(),
          booksApi.getAll()
        ]);

        setFeaturedBook(featured);
        setTrendingBooks(Array.isArray(trending) ? trending : []);
        setNewReleases(Array.isArray(releases) ? releases : []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.header');
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }

      // Update progress bars
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;

      if (progressBarRef.current) {
        progressBarRef.current.style.width = scrolled + '%';
      }
      if (readingProgressRef.current) {
        readingProgressRef.current.style.width = scrolled + '%';
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleVideoPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const scrollCarousel = (direction) => {
    const track = document.querySelector('.carousel-track');
    if (track) {
      const scrollAmount = direction === 'prev' ? -300 : 300;
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (bookId) => {
    addToCart(bookId);
    // Optional: Show toast notification
    console.log('Added to cart:', bookId);
  };

  const handleAddToLibrary = (bookId) => {
    addToLibrary(bookId);
    // Optional: Show toast notification
    console.log('Added to library:', bookId);
  };

  return (
    <div className="home-page">
      {/* Progress bar */}
      <div className="progress-container">
        <div className="progress-bar" ref={progressBarRef}></div>
      </div>

      {/* Hero with Full Background Video */}
      <section className="hero" id="main-content">
        {/* Video Background */}
        <div className="hero-video-container">
          <video
            id="heroBackgroundVideo"
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="hero-background-video"
          >
            <source src="/laps.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="video-overlay"></div>
          <button id="heroVideoPause" onClick={handleVideoPause} className="hero-video-pause">
            <i className="fas fa-pause"></i>
          </button>
        </div>
        <div className="hero-content">
          <div className="hero-left">
            <h1 className="hero-title">MANGU PUBLISHING</h1>
            <p className="hero-subtitle">
              Discover a universe of stories. Stream unlimited books, audiobooks, and exclusive videos anywhere, anytime.
            </p>
            <a href="#featured" className="hero-cta">
              <i className="fas fa-play"></i> Start Reading Now
            </a>
          </div>
          <div className="hero-right"></div>
        </div>
      </section>

      {/* Featured Hero Section */}
      <section className="featured-hero" id="featured">
        <div className="container">
          <h2 className="header">Featured This Week</h2>
          {loading ? (
            <div className="loading-spinner">Loading amazing books...</div>
          ) : featuredBook ? (
            <div className="feature-card">
              <div className="book-cover">
                <img
                  src={featuredBook.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=150&h=220&q=80'}
                  alt={featuredBook.title}
                />
              </div>
              <div className="book-details">
                <h1 className="book-title">{featuredBook.title}</h1>
                {featuredBook.subtitle && <div className="book-subtitle">{featuredBook.subtitle}</div>}
                <div className="book-author">By {featuredBook.authors?.map(a => a.name).join(', ') || 'Unknown Author'}</div>
                <div className="book-meta">
                  <div className="rating">
                    <span className="rating-number">{parseFloat(featuredBook.rating || 0).toFixed(1)}</span>
                    <span className="stars">★★★★★</span>
                  </div>
                  <div className="length">{featuredBook.page_count} pages</div>
                  <div className="year">{new Date(featuredBook.publication_date).getFullYear()}</div>
                </div>
                <div className="star-rating">
                  <span className="stars">★★★★★</span>
                  <span className="rating-text">{parseFloat(featuredBook.rating || 0).toFixed(1)} ({featuredBook.rating_count?.toLocaleString() || 0} reviews)</span>
                </div>
                <p className="book-description">
                  {featuredBook.description}
                </p>
                <div className="action-buttons">
                  <button
                    className="btn btn-read"
                    onClick={() => navigate(`/book/${featuredBook.id}`)}
                  >
                    <i className="fas fa-book"></i> Read Now
                  </button>
                  <button className="btn btn-watch">
                    <i className="fas fa-headphones"></i> Listen
                  </button>
                  <button
                    className="btn btn-library"
                    onClick={() => handleAddToLibrary(featuredBook.id)}
                  >
                    <i className="fas fa-plus"></i> Add to Library
                  </button>
                  <button
                    className="btn btn-buy"
                    onClick={() => handleAddToCart(featuredBook.id)}
                  >
                    <i className="fas fa-shopping-cart"></i> Buy ${(featuredBook.price_cents / 100).toFixed(2)}
                  </button>
                </div>
                <div className="platform-links">
                  <button className="platform-btn apple">Apple Books</button>
                  <button className="platform-btn google">Google Play</button>
                  <button className="platform-btn amazon">Amazon</button>
                </div>
                <div className="info-icons">
                  <div className="info-icon">
                    <i className="fas fa-share-alt"></i>
                  </div>
                  <div className="info-icon">
                    <i className="fas fa-download"></i>
                  </div>
                  <div className="info-icon">
                    <i className="fas fa-flag"></i>
                  </div>
                </div>
              </div>
              <div className="tv-section">
                <div className="tv-frame">
                  <div className="tv-screen">
                    <div className="netflix-content">
                      <div className="movie-scene"></div>
                      <div className="characters-netflix">
                        <div className="character-netflix character-main"></div>
                        <div className="character-netflix character-side"></div>
                        <div className="character-netflix character-side"></div>
                      </div>
                      <div className="netflix-ui">
                        <div className="play-controls">
                          <div className="play-btn"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-data">No featured book available at the moment</div>
          )}
        </div>
      </section>

      {/* Trending Section */}
      <section className="trending-section">
        <div className="trending-header">
          <h2 className="trending-title">Trending Now</h2>
          <Link to="/library" className="see-all">
            See All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>

        <div className="carousel-container">
          <button className="carousel-nav nav-prev" onClick={() => scrollCarousel('prev')}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className="carousel-track">
            {loading ? (
              <div className="loading-spinner">Loading...</div>
            ) : trendingBooks.length > 0 ? (
              trendingBooks.map((book) => (
                <div
                  className="book-card"
                  key={book.id}
                  onClick={() => navigate(`/book/${book.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {book.is_new_release && <span className="new-badge">New</span>}
                  <img
                    src={book.cover_url || 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=200&h=300&q=80'}
                    alt={book.title}
                  />
                  <div className="book-info">
                    <h3 className="book-title">{book.title}</h3>
                    <div className="book-metadata">
                      <span>{book.authors?.map(a => a.name).join(', ') || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(book.publication_date).getFullYear()}</span>
                    </div>
                    <div className="book-genres">
                      {book.categories?.slice(0, 2).map((cat, idx) => (
                        <span key={idx} className="genre">{cat}</span>
                      ))}
                    </div>
                    <div className="book-buttons">
                      <div
                        className="icon-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/book/${book.id}`);
                        }}
                      >
                        <i className="fas fa-play"></i>
                      </div>
                      <div
                        className="icon-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToLibrary(book.id);
                        }}
                      >
                        <i className="fas fa-bookmark"></i>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">No trending books available</div>
            )}
          </div>
          <button className="carousel-nav nav-next" onClick={() => scrollCarousel('next')}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>

      {/* New Releases Section */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">New Releases</h2>
          <Link to="/library" className="view-all">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>

        <div className="books-container">
          <div className="books-row">
            {loading ? (
              <div className="loading-spinner">Loading...</div>
            ) : newReleases.length > 0 ? (
              newReleases.map((book) => (
                <div className="book-card" key={book.id}>
                  <img
                    src={book.cover_url || `https://images.unsplash.com/photo-1515125520141-3e3b67bc0a88?auto=format&fit=crop&w=120&h=180&q=80`}
                    alt={book.title}
                    onClick={() => navigate(`/book/${book.id}`)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div className="book-overlay">
                    <div className="book-actions">
                      <div
                        className="book-action"
                        onClick={() => navigate(`/book/${book.id}`)}
                      >
                        <i className="fas fa-play"></i>
                      </div>
                      <div
                        className="book-action"
                        onClick={() => handleAddToLibrary(book.id)}
                      >
                        <i className="fas fa-plus"></i>
                      </div>
                    </div>
                    <div className="book-info">
                      <div className="book-title-small">{book.title}</div>
                      <div className="book-author">{book.authors?.map(a => a.name).join(', ') || 'Unknown'}</div>
                      <div className="book-rating">
                        {'★'.repeat(Math.round(book.rating || 0))}
                        {'☆'.repeat(5 - Math.round(book.rating || 0))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">No new releases available</div>
            )}
          </div>
        </div>
      </section>

      {/* Reading Progress Indicator */}
      <div className="reading-progress">
        <div className="reading-progress-bar" ref={readingProgressRef}></div>
      </div>
    </div>
  );
}

export default HomePage;
