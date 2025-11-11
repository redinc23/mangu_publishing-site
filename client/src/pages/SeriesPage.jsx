import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './SeriesPage.css';

function SeriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [series] = useState([
    {
      id: 1,
      title: 'The Midnight Chronicles',
      description: 'A thrilling fantasy series following ancient magic and modern heroes.',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&h=600&q=80',
      bookCount: 7,
      author: 'Sarah J. Maas',
      status: 'ongoing'
    },
    {
      id: 2,
      title: 'Cosmic Explorers',
      description: 'Space adventures across the galaxy with unforgettable characters.',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&h=600&q=80',
      bookCount: 5,
      author: 'Brandon Sanderson',
      status: 'complete'
    },
    {
      id: 3,
      title: 'Shadow Realm',
      description: 'Dark fantasy series exploring the boundaries between worlds.',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&h=600&q=80',
      bookCount: 3,
      author: 'Rebecca Yarros',
      status: 'ongoing'
    },
    {
      id: 4,
      title: 'The Forgotten Kingdom',
      description: 'Epic historical fiction spanning generations.',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&h=600&q=80',
      bookCount: 8,
      author: 'Emily St. John Mandel',
      status: 'complete'
    }
  ]);

  const filteredSeries = series.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="series-page">
      {/* Hero Section */}
      <section className="series-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Book Series</h1>
          <p className="hero-subtitle">Discover epic sagas and continuing stories</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container">
        {/* Search */}
        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="Search series by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Series Grid */}
        <div className="series-grid">
          {filteredSeries.map(item => (
            <Link key={item.id} to={`/series/${item.id}`} className="series-card">
              <div className="series-cover">
                <img src={item.cover} alt={item.title} />
                <div className="series-badge">{item.status}</div>
              </div>
              <div className="series-info">
                <h3 className="series-title">{item.title}</h3>
                <p className="series-author">by {item.author}</p>
                <p className="series-description">{item.description}</p>
                <div className="series-meta">
                  <span className="book-count">
                    <i className="fas fa-book"></i> {item.bookCount} Books
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredSeries.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-search"></i>
            <h3>No series found</h3>
            <p>Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SeriesPage;

