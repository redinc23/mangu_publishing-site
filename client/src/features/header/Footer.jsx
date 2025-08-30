import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerGrid}>
          <div className={styles.footerColumn}>
            <h4>Company</h4>
            <a href="#">About MANGU</a>
            <a href="#">Careers</a>
            <a href="#">Press Center</a>
            <a href="#">Investor Relations</a>
            <a href="#">Corporate Info</a>
          </div>
          <div className={styles.footerColumn}>
            <h4>Reading Experience</h4>
            <a href="#">Browse Library</a>
            <a href="#">New Releases</a>
            <a href="#">Bestsellers</a>
            <a href="#">Free Books</a>
            <a href="#">Audiobooks</a>
          </div>
          <div className={styles.footerColumn}>
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Contact Us</a>
            <a href="#">Account Settings</a>
            <a href="#">Reading Devices</a>
            <a href="#">Accessibility</a>
          </div>
          <div className={styles.footerColumn}>
            <h4>Legal</h4>
            <a href="#">Terms of Use</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Cookie Preferences</a>
            <a href="#">Content Guidelines</a>
            <a href="#">Copyright Notice</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2025 MANGU PUBLISHING. All rights reserved. | The ultimate destination for book lovers worldwide.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
