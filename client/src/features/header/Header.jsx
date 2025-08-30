import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import styles from './Header.module.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  // Handle window scroll to add background to header
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Handle search (navigate to /search page on Enter key)
  const [searchQuery, setSearchQuery] = useState('');
  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`} id="header">
      <div className={styles.headerContent}>
        <div className={styles.logoSection}>
          {/* Logo and main navigation links */}
          <Link to="/" className={styles.logo}>
            <i className="fas fa-book-open"></i>
            MANGU PUBLISHING
          </Link>
          <nav className={styles.navMain}>
            <Link to="/" className={styles.active}>Home</Link>
            <Link to="/library">Library</Link>
            <Link to="/genres">Genres</Link>
            <Link to="/#new-releases">New Releases</Link>
            <Link to="/library">My List</Link>
          </nav>
        </div>

        <div className={styles.headerActions}>
          {/* Search box */}
          <div className={styles.searchContainer}>
            <i className={`fas fa-search ${styles.searchIcon}`}></i>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search books, authors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKey}
            />
          </div>
          {/* Notification icon with badge */}
          <div className={styles.headerIcon}>
            <i className="fas fa-bell"></i>
            <span className={styles.notificationBadge}>1</span>
          </div>
          {/* Cart icon (displays number of items in cart) */}
          <Link to="/cart" className={styles.headerIcon}>
            <i className="fas fa-shopping-cart"></i>
            {cartItems.length > 0 && (
              <span className={styles.notificationBadge}>{cartItems.length}</span>
            )}
          </Link>
          {/* Profile menu (avatar and dropdown caret) */}
          <div className={styles.profileMenu}>
            <div className={styles.profileAvatar}>A</div>
            <i className="fas fa-caret-down" style={{ fontSize: '12px' }}></i>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
