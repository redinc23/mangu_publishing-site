import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

const spotlightLinks = [
  { to: '/library', icon: 'fas fa-book', label: 'Browse the library' },
  { to: '/audiobooks', icon: 'fas fa-headphones', label: 'Popular audiobooks' },
  { to: '/help', icon: 'fas fa-life-ring', label: 'Visit help center' },
  { to: '/contact', icon: 'fas fa-envelope', label: 'Contact support' }
];

function NotFoundPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/library?query=${encodeURIComponent(query)}`);
    } else {
      navigate('/library');
    }
  };

  return (
    <div className="not-found-page">
      <section className="not-found-hero">
        <div className="error-code">404</div>
        <h1>We misplaced that page in the stacks</h1>
        <p>
          The link you followed may be outdated or the page has moved. Let&apos;s get you
          back to discovering stories, audio journeys, and the creators you love.
        </p>

        <form className="not-found-search" onSubmit={handleSearch}>
          <i className="fas fa-search"></i>
          <input
            type="search"
            placeholder="Search books, authors, or keywords"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <button type="submit">Search library</button>
        </form>

        <div className="not-found-actions">
          <Link to="/" className="primary">
            <i className="fas fa-home"></i> Return home
          </Link>
          <Link to="/library">
            <i className="fas fa-compass"></i> Discover titles
          </Link>
        </div>
      </section>

      <section className="not-found-links">
        <h2>Quick pathways</h2>
        <div className="not-found-grid">
          {spotlightLinks.map((link) => (
            <Link key={link.label} to={link.to} className="not-found-card">
              <i className={link.icon}></i>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default NotFoundPage;
