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
          <div className="logo-icon">
            <span className="logo-m">M</span>
          </div>
          <span>LANGU</span>
        </Link>

        <nav className="nav-main">
          <Link
            to="/library"
            className={`nav-button ${isActive('/library') ? 'active' : ''}`}
          >
            Library
          </Link>
          <Link
            to="/audiobooks"
            className={`nav-button ${isActive('/audiobooks') ? 'active' : ''}`}
          >
            Audio
          </Link>
          <Link
            to="/blog"
            className={`nav-button ${isActive('/blog') ? 'active' : ''}`}
          >
            News
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

          <button className="header-icon" title="Country">
            <i className="fas fa-flag"></i>
            <span className="country-code">US</span>
          </button>

          <Link to="/cart" className="header-icon" title="Cart">
            <i className="fas fa-shopping-bag"></i>
          </Link>

          <Link to="/profile" className="header-icon" title="Profile">
            <i className="fas fa-user-circle"></i>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
