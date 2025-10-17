import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-column">
          <h3>Explore</h3>
          <div className="footer-links">
            <Link to="/library" className="footer-link">All Books</Link>
            <Link to="/audiobooks" className="footer-link">Audiobooks</Link>
            <Link to="/magazines" className="footer-link">Magazines</Link>
            <Link to="/podcasts" className="footer-link">Podcasts</Link>
            <Link to="/documentaries" className="footer-link">Documentaries</Link>
          </div>
        </div>

        <div className="footer-column">
          <h3>Account</h3>
          <div className="footer-links">
            <Link to="/library" className="footer-link">My Library</Link>
            <Link to="/bookmarks" className="footer-link">Bookmarks</Link>
            <Link to="/history" className="footer-link">Reading History</Link>
            <Link to="/recommendations" className="footer-link">Recommendations</Link>
            <Link to="/gift-cards" className="footer-link">Gift Cards</Link>
          </div>
        </div>

        <div className="footer-column">
          <h3>Company</h3>
          <div className="footer-links">
            <Link to="/about" className="footer-link">About Us</Link>
            <Link to="/careers" className="footer-link">Careers</Link>
            <Link to="/press" className="footer-link">Press</Link>
            <Link to="/blog" className="footer-link">Blog</Link>
            <Link to="/contact" className="footer-link">Contact</Link>
          </div>
        </div>

        <div className="footer-column">
          <h3>Support</h3>
          <div className="footer-links">
            <Link to="/help" className="footer-link">Help Center</Link>
            <Link to="/accessibility" className="footer-link">Accessibility</Link>
            <Link to="/devices" className="footer-link">Devices</Link>
            <Link to="/terms" className="footer-link">Terms of Use</Link>
            <Link to="/privacy" className="footer-link">Privacy</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} MANGU PUBLISHING. All rights reserved.</p>
        <div className="social-links">
          <a href="#" className="social-link" aria-label="Facebook">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="#" className="social-link" aria-label="Twitter">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="#" className="social-link" aria-label="Instagram">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="#" className="social-link" aria-label="YouTube">
            <i className="fab fa-youtube"></i>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
