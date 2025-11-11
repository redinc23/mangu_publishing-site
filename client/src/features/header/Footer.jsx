import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer = () => {
  const companyLinks = [
    { to: '/about', label: 'About MANGU' },
    { to: '/careers', label: 'Careers' },
    { to: '/press', label: 'Press Center' },
    { to: '/investors', label: 'Investor Relations' },
    { to: '/corporate', label: 'Corporate Info' }
  ];

  const experienceLinks = [
    { to: '/library', label: 'Browse Library' },
    { to: '/releases', label: 'New Releases' },
    { to: '/bestsellers', label: 'Bestsellers' },
    { to: '/free-books', label: 'Free Books' },
    { to: '/audiobooks', label: 'Audiobooks' }
  ];

  const supportLinks = [
    { to: '/help', label: 'Help Center' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/profile#account', label: 'Account Settings' },
    { to: '/devices', label: 'Reading Devices' },
    { to: '/accessibility', label: 'Accessibility' }
  ];

  const legalLinks = [
    { to: '/terms', label: 'Terms of Use' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/cookies', label: 'Cookie Preferences' },
    { to: '/guidelines', label: 'Content Guidelines' },
    { to: '/copyright', label: 'Copyright Notice' }
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerGrid}>
          <div className={styles.footerColumn}>
            <h4>Company</h4>
            {companyLinks.map(({ to, label }) => (
              <Link key={label} to={to}>
                {label}
              </Link>
            ))}
          </div>
          <div className={styles.footerColumn}>
            <h4>Reading Experience</h4>
            {experienceLinks.map(({ to, label }) => (
              <Link key={label} to={to}>
                {label}
              </Link>
            ))}
          </div>
          <div className={styles.footerColumn}>
            <h4>Support</h4>
            {supportLinks.map(({ to, label }) => (
              <Link key={label} to={to}>
                {label}
              </Link>
            ))}
          </div>
          <div className={styles.footerColumn}>
            <h4>Legal</h4>
            {legalLinks.map(({ to, label }) => (
              <Link key={label} to={to}>
                {label}
              </Link>
            ))}
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
