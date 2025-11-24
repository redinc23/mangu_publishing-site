import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { LibraryContext } from '../context/LibraryContext';
import { booksApi, categoriesApi } from '../utils/api';
import './LibraryPage.css';


function LibraryPage() {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { addToLibrary } = useContext(LibraryContext);

  // State
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('trending');

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trending, releases, rated, genreList] = await Promise.all([
          booksApi.getTrending(),
          booksApi.getAll(),
          booksApi.getTrending(),
          categoriesApi.getAll()
        ]);

        setTrendingBooks(Array.isArray(trending) ? trending : []);
        setNewReleases(Array.isArray(releases) ? releases : []);
        setTopRated(Array.isArray(rated) ? rated : []);
        // Handle genres - API returns objects with name property
        const genreNames = Array.isArray(genreList)
          ? genreList.map(g => typeof g === 'string' ? g : g.name).filter(Boolean)
          : [];
        setGenres(['All', ...genreNames]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching library data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get books based on active section
  const getActiveBooks = () => {
    switch (activeSection) {
      case 'trending':
        return trendingBooks;
      case 'new':
        return newReleases;
      case 'top':
        return topRated;
      default:
        return trendingBooks;
    }
  };

  // Filter books by genre and search query
  const getFilteredBooks = () => {
    let books = getActiveBooks();

    // Filter by genre
    if (selectedGenre !== 'All') {
      books = books.filter(book =>
        book.categories?.includes(selectedGenre)
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      books = books.filter(book =>
        book.title?.toLowerCase().includes(query) ||
        book.authors?.some(author => author.name.toLowerCase().includes(query)) ||
        book.description?.toLowerCase().includes(query)
      );
    }

    return books;
  };

  const filteredBooks = getFilteredBooks();

  const handleAddToCart = (bookId, e) => {
    e.stopPropagation();
    addToCart(bookId);
  };

  const handleAddToLibrary = (bookId, e) => {
    e.stopPropagation();
    addToLibrary(bookId);
  };

  return (
    <div className="library-page">
      {/* Hero Header */}
      <section className="library-hero">
        <div className="library-hero-content">
          <h1 className="library-title">Discover Your Next Great Read</h1>
          <p className="library-subtitle">
            Explore thousands of books, audiobooks, and exclusive content
          </p>

          {/* Search Bar */}
          <div className="library-search">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by title, author, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="library-search-input"
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery('')}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="library-filters">
        <div className="container">
          {/* Section Tabs */}
          <div className="section-tabs">
            <button
              className={`section-tab ${activeSection === 'trending' ? 'active' : ''}`}
              onClick={() => setActiveSection('trending')}
            >
              <i className="fas fa-fire"></i> Trending Now
            </button>
            <button
              className={`section-tab ${activeSection === 'new' ? 'active' : ''}`}
              onClick={() => setActiveSection('new')}
            >
              <i className="fas fa-star"></i> New Releases
            </button>
            <button
              className={`section-tab ${activeSection === 'top' ? 'active' : ''}`}
              onClick={() => setActiveSection('top')}
            >
              <i className="fas fa-trophy"></i> Top Rated
            </button>
          </div>

          {/* Genre Filters */}
          <div className="genre-filters">
            <div className="genre-label">Filter by Genre:</div>
            <div className="genre-pills">
              {genres.map((genre, idx) => (
                <button
                  key={idx}
                  className={`genre-pill ${selectedGenre === genre ? 'active' : ''}`}
                  onClick={() => setSelectedGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Books Grid Section */}
      <section className="library-content">
        <div className="container">
          <div className="library-results-header">
            <h2 className="results-title">
              {searchQuery ? `Search Results for "${searchQuery}"` :
               activeSection === 'trending' ? 'Trending Now' :
               activeSection === 'new' ? 'New Releases' : 'Top Rated'}
            </h2>
            <div className="results-count">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} found
            </div>
          </div>

          {loading ? (
            <div className="library-loading">
              <div className="loading-spinner">Loading amazing books...</div>
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="books-grid">
              {filteredBooks.map((book) => (
                <button
                  type="button"
                  className="library-book-card"
                  key={book.id}
                  onClick={() => navigate(`/book/${book.id}`)}
                  aria-label={`Open ${book.title}`}
                >
                  <div className="book-card-image">
                    <img
                      src={book.cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&h=300&q=80'}
                      alt={book.title}
                    />
                    {book.is_new_release && <span className="new-badge">New</span>}
                    <div className="book-card-overlay">
                      <div className="overlay-actions">
                        <button
                          type="button"
                          className="overlay-btn play-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/book/${book.id}`);
                          }}
                          aria-label={`Play preview for ${book.title}`}
                        >
                          <i className="fas fa-play"></i>
                        </button>
                        <button
                          type="button"
                          className="overlay-btn"
                          onClick={(e) => handleAddToLibrary(book.id, e)}
                          aria-label={`Save ${book.title} to library`}
                        >
                          <i className="fas fa-bookmark"></i>
                        </button>
                        <button
                          type="button"
                          className="overlay-btn"
                          onClick={(e) => handleAddToCart(book.id, e)}
                          aria-label={`Add ${book.title} to cart`}
                        >
                          <i className="fas fa-shopping-cart"></i>
                        </button>
                      </div>
                      <div className="overlay-info">
                        <div className="book-rating">
                          <span className="rating-stars">
                            {'★'.repeat(Math.round(book.rating || 0))}
                            {'☆'.repeat(5 - Math.round(book.rating || 0))}
                          </span>
                          <span className="rating-value">{parseFloat(book.rating || 0).toFixed(1)}</span>
                        </div>
                        <div className="book-meta-short">
                          {book.page_count} pages • {new Date(book.publication_date).getFullYear()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="book-card-info">
                    <h3 className="book-card-title">{book.title}</h3>
                    <p className="book-card-author">
                      {book.authors?.map(a => a.name).join(', ') || 'Unknown Author'}
                    </p>
                    <div className="book-card-genres">
                      {book.categories?.slice(0, 2).map((cat, idx) => (
                        <span key={idx} className="genre-tag">{cat}</span>
                      ))}
                    </div>
                    <div className="book-card-price">
                      ${(book.price_cents / 100).toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <i className="fas fa-book-open"></i>
              <h3>No books found</h3>
              <p>Try adjusting your filters or search query</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('All');
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default LibraryPage;
