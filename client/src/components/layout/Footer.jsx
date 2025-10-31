import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-column">
          <h3>Browse</h3>
          <div className="footer-links">
            <Link to="/" className="footer-link">Home</Link>
            <Link to="/library" className="footer-link">Library</Link>
            <Link to="/genres" className="footer-link">Genres</Link>
            <Link to="/library" className="footer-link">New & Popular</Link>
          </div>
        </div>

        <div className="footer-column">
          <h3>Company</h3>
          <div className="footer-links">
            <Link to="/about" className="footer-link">About</Link>
            <Link to="/careers" className="footer-link">Careers</Link>
            <Link to="/press" className="footer-link">Press</Link>
            <Link to="/contact" className="footer-link">Contact</Link>
          </div>
        </div>

        <div className="footer-column">
          <h3>Help</h3>
          <div className="footer-links">
            <Link to="/help" className="footer-link">Support</Link>
            <Link to="/help" className="footer-link">FAQ</Link>
            <Link to="/community" className="footer-link">Community</Link>
            <Link to="/accessibility" className="footer-link">Accessibility</Link>
          </div>
        </div>

        <div className="footer-column">
          <h3>Legal</h3>
          <div className="footer-links">
            <Link to="/terms" className="footer-link">Terms of Use</Link>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/cookie-preferences" className="footer-link">Cookie Preferences</Link>
            <Link to="/content-guidelines" className="footer-link">Content Guidelines</Link>
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
