import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { mockBooks, getTrendingBooks, getNewReleases } from '../data/mockBooks';

export default function LibraryPageV2() {
  const [books, setBooks] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try to load from API, fallback to mock data on error
        const [booksData, trendingData, newReleasesData] = await Promise.allSettled([
          apiClient.books.list({ limit: 100 }),
          apiClient.books.trending({ limit: 6 }),
          apiClient.books.newReleases({ limit: 6 })
        ]);

        // Use API data if successful, otherwise fallback to mock
        setBooks(
          booksData.status === 'fulfilled' && Array.isArray(booksData.value)
            ? booksData.value
            : mockBooks
        );
        
        setTrending(
          trendingData.status === 'fulfilled' && Array.isArray(trendingData.value)
            ? trendingData.value.slice(0, 6)
            : getTrendingBooks(6)
        );
        
        setNewReleases(
          newReleasesData.status === 'fulfilled' && Array.isArray(newReleasesData.value)
            ? newReleasesData.value.slice(0, 6)
            : getNewReleases(6)
        );
      } catch (err) {
        console.warn('API load failed, using mock data:', err);
        setError(err.message);
        // Fallback to mock data
        setBooks(mockBooks);
        setTrending(getTrendingBooks(6));
        setNewReleases(getNewReleases(6));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const categories = ['all', 'fiction', 'mystery', 'sci-fi', 'fantasy', 'non-fiction'];
  const filteredBooks = books.filter(book => {
    const matchesCategory = selectedCategory === 'all' || 
      book.categories?.some(cat => cat.toLowerCase().includes(selectedCategory));
    const matchesSearch = !searchQuery || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.authors?.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading && books.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {error && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-4 py-2 text-sm text-center">
          Using offline data. API unavailable: {error}
        </div>
      )}
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/15 via-transparent to-green-900/15" />
      </div>

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] overflow-hidden mb-8">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${trending[0]?.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1920&q=80'})`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        </div>
        
        <div className="relative z-10 container mx-auto px-6 h-full flex items-end pb-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500 px-4 py-2 rounded-full text-yellow-500 text-sm font-semibold mb-6 backdrop-blur-sm">
              <span>⭐</span>
              <span>Featured</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
              {trending[0]?.title || 'The Ultimate Book Experience'}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                <span>★</span>
                <span>{trending[0]?.rating || '4.8'}</span>
              </div>
              <span className="text-gray-400">{new Date(trending[0]?.publication_date || '2024-01-01').getFullYear()}</span>
            </div>
            <p className="text-lg text-gray-300 mb-6 max-w-xl">
              {trending[0]?.description || 'Discover your next favorite read'}
            </p>
            <div className="flex gap-4">
              <Link
                to={`/book/${trending[0]?.id || '1'}`}
                className="bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 text-white px-8 py-3 rounded font-bold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <span>▶</span>
                <span>Read Now</span>
              </Link>
              <Link
                to={`/book/${trending[0]?.id || '1'}`}
                className="bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded font-semibold flex items-center gap-2 hover:bg-white/30 transition"
              >
                <span>ℹ</span>
                <span>More Info</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories & Search */}
      <div className="container mx-auto px-6 mb-8">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full transition ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-full px-6 py-3 pl-12 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Trending Section */}
      {trending.length > 0 && (
        <section className="container mx-auto px-6 mb-12">
          <h2 className="text-3xl font-bold mb-6">Trending Now</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {trending.map(book => (
              <Link
                key={book.id}
                to={`/book/${book.id}`}
                className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 hover:scale-105 transition-transform"
              >
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-bold text-white mb-1">{book.title}</h3>
                    <p className="text-sm text-gray-300">{book.authors?.[0]?.name || 'Unknown'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-gray-300">{book.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Releases */}
      {newReleases.length > 0 && (
        <section className="container mx-auto px-6 mb-12">
          <h2 className="text-3xl font-bold mb-6">New Releases</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {newReleases.map(book => (
              <Link
                key={book.id}
                to={`/book/${book.id}`}
                className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 hover:scale-105 transition-transform"
              >
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                {book.is_new_release && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">
                    NEW
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-bold text-white mb-1">{book.title}</h3>
                    <p className="text-sm text-gray-300">{book.authors?.[0]?.name || 'Unknown'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Books Grid */}
      <section className="container mx-auto px-6 mb-12">
        <h2 className="text-3xl font-bold mb-6">
          {selectedCategory === 'all' ? 'All Books' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
        </h2>
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No books found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredBooks.map(book => (
              <Link
                key={book.id}
                to={`/book/${book.id}`}
                className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 hover:scale-105 transition-transform"
              >
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-bold text-white mb-1">{book.title}</h3>
                    <p className="text-sm text-gray-300">{book.authors?.[0]?.name || 'Unknown'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-gray-300">{book.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

