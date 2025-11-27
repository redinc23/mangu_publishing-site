import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Handle scroll to add background to header
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Search:', searchQuery);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`} id="header">
      <div className="header-content">
        <div className="header-left">
          <Link to="/" className="logo">
            <div className="logo-icon"></div>
            <span>MANGU</span>
          </Link>

          <nav className={`nav-main ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
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
        </div>

        <div className="header-actions">
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <form onSubmit={handleSearch}>
              <input
                type="text"
                className="search-input"
                placeholder="Search titles, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <button className="header-icon" aria-label="Notifications">
            <i className="fas fa-bell"></i>
            <span className="notification-badge">3</span>
          </button>

          <Link to="/cart" className="header-icon" aria-label="Shopping cart">
            <i className="fas fa-shopping-cart"></i>
          </Link>

          <Link to="/profile" className="profile-menu" aria-label="Profile menu">
            <div className="profile-avatar">JS</div>
            <i className="fas fa-caret-down"></i>
          </Link>

          <button
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={toggleMobileMenu}></div>
      )}
    </header>
  );
}

export default Header;
