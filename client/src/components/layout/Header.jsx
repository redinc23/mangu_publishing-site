import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path) => location.pathname === path;

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Search:', searchQuery);
  };

  return (
    <header className="header" id="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <div className="logo-icon"></div>
          <span>MANGU</span>
        </Link>

        <nav className="nav-main">
          <Link
            to="/"
            className={isActive('/') ? 'active' : ''}
          >
            <i className="fas fa-home"></i> Home
          </Link>
          <Link
            to="/library"
            className={isActive('/library') ? 'active' : ''}
          >
            <i className="fas fa-book"></i> Books
          </Link>
          <Link
            to="/audiobooks"
            className={isActive('/audiobooks') ? 'active' : ''}
          >
            <i className="fas fa-headphones"></i> Audiobooks
          </Link>
          <Link
            to="/videos"
            className={isActive('/videos') ? 'active' : ''}
          >
            <i className="fas fa-video"></i> Videos
          </Link>
        </nav>

        <div className="header-actions">
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <form onSubmit={handleSearch}>
              <input
                type="text"
                className="search-input"
                placeholder="Search titles, authors, or keywords"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <button className="header-icon">
            <i className="fas fa-bell"></i>
            <span className="notification-badge">3</span>
          </button>

          <Link to="/cart" className="header-icon">
            <i className="fas fa-shopping-cart"></i>
          </Link>

          <Link to="/profile" className="profile-menu">
            <div className="profile-avatar">JS</div>
            <i className="fas fa-caret-down"></i>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
