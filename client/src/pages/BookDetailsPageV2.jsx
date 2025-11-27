import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { LibraryContext } from '../context/LibraryContext';
import { apiClient } from '../lib/api';
import { getBookById } from '../data/mockBooks';

export default function BookDetailsPageV2() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { addToLibrary } = useContext(LibraryContext);
  
  const [book, setBook] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const loadBook = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const bookData = await apiClient.books.get(id);
        if (bookData) {
          setBook(bookData);
        } else {
          throw new Error('Book not found');
        }
      } catch (err) {
        console.warn('API load failed, trying mock data:', err);
        setError(err.message);
        // Fallback to mock data
        const mockBook = getBookById(id);
        if (mockBook) {
          setBook(mockBook);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadBook();
    }
  }, [id]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!id || activeTab !== 'reviews') return;
      
      setReviewsLoading(true);
      try {
        const reviewsData = await apiClient.books.getReviews(id, { limit: 10 });
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } catch (err) {
        console.warn('Failed to load reviews:', err);
        // Fallback to sample review if API fails
        setReviews([{
          id: 'sample-1',
          rating: 5,
          title: 'Absolutely captivating!',
          content: 'The story kept me on the edge of my seat from start to finish.',
          author: {
            name: 'John Doe',
            username: 'johndoe',
            avatarUrl: null
          },
          isVerifiedPurchase: true,
          helpfulVotes: 12,
          createdAt: new Date().toISOString()
        }]);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [id, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Book Not Found</h2>
          {error && (
            <p className="text-yellow-400 mb-4 text-sm">API Error: {error}</p>
          )}
          <Link to="/library" className="text-blue-400 hover:underline">Back to Library</Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    // Pass the full book object so cart can display it even if not in mock data
    addToCart(book.id, book);
  };

  const handleAddToLibrary = () => {
    addToLibrary(book.id);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {error && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-4 py-2 text-sm text-center">
          Using offline data. API unavailable: {error}
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/library" className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
            MANGU
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/library" className="text-gray-300 hover:text-white">Library</Link>
            <Link to="/cart" className="text-gray-300 hover:text-white">Cart</Link>
            <Link to="/profile" className="text-gray-300 hover:text-white">Profile</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Book Cover & Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="relative mb-6">
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full aspect-[2/3] rounded-lg shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <div className="bg-purple-500/70 rounded-full p-6">
                    <span className="text-4xl">▶</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500 text-xl">★</span>
                  <span className="text-lg font-semibold">{book.rating}</span>
                  <span className="text-gray-400">({book.rating_count} ratings)</span>
                </div>
                
                <div className="flex gap-2">
                  {book.categories?.map(cat => (
                    <span key={cat} className="bg-white/10 px-3 py-1 rounded-full text-sm">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            <h1 className="text-5xl font-bold mb-2">{book.title}</h1>
            {book.subtitle && (
              <h2 className="text-2xl text-gray-300 mb-4">{book.subtitle}</h2>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-gray-400">By</span>
              <span className="text-lg font-semibold">
                {book.authors?.map(a => a.name).join(', ') || 'Unknown Author'}
              </span>
            </div>

            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToLibrary}
                className="bg-gradient-to-r from-teal-400 to-purple-400 text-white px-8 py-3 rounded-lg font-bold hover:scale-105 transition-transform"
              >
                Add to Library
              </button>
              <button
                onClick={handleAddToCart}
                className="bg-gradient-to-r from-[#ff6b00] to-[#ff3d00] text-white px-8 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg shadow-[#ff6b0033]"
              >
                Add to Cart · ${(book.price_cents / 100).toFixed(2)}
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10 mb-6">
              <div className="flex gap-6">
                {['overview', 'reviews', 'details'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 px-2 font-semibold transition ${
                      activeTab === tab
                        ? 'text-white border-b-2 border-purple-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="prose prose-invert max-w-none">
              {activeTab === 'overview' && (
                <div>
                  <p className="text-lg text-gray-300 leading-relaxed mb-6">
                    {book.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div>
                      <span className="text-gray-400">Published</span>
                      <p className="text-white font-semibold">
                        {new Date(book.publication_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Views</span>
                      <p className="text-white font-semibold">{book.view_count.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'reviews' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">
                      Reviews ({reviews.length})
                    </h3>
                    <button
                      className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white transition"
                      title="Coming in v1.1"
                    >
                      Write a Review
                    </button>
                  </div>
                  
                  {reviewsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-gray-400 text-sm">Loading reviews...</p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">No reviews yet.</p>
                      <button
                        className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white transition"
                        title="Coming in v1.1"
                      >
                        Be the first to review
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-white/5 rounded-lg p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-purple-400 rounded-full flex items-center justify-center font-bold text-white">
                              {review.author.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{review.author.name}</p>
                                {review.isVerifiedPurchase && (
                                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                    Verified Purchase
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-yellow-500 text-sm mb-2">
                                {'★'.repeat(review.rating)}
                                <span className="text-gray-400 text-xs">
                                  {review.helpfulVotes > 0 && `${review.helpfulVotes} helpful`}
                                </span>
                              </div>
                              {review.title && (
                                <p className="font-semibold text-white mb-2">{review.title}</p>
                              )}
                              <p className="text-gray-300">{review.content}</p>
                              <p className="text-gray-500 text-xs mt-2">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400">ISBN</span>
                    <p className="text-white">978-0-123456-78-9</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Pages</span>
                    <p className="text-white">384</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Language</span>
                    <p className="text-white">English</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Tags</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {book.tags?.map(tag => (
                        <span key={tag} className="bg-white/10 px-3 py-1 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

