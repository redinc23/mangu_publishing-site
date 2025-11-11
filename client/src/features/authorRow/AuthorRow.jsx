import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthorCard from '../../components/AuthorCard';
import styles from './AuthorRow.module.css';

const AuthorRow = () => {
  const [featuredAuthors, setFeaturedAuthors] = useState([]);

  useEffect(() => {
    fetch('/api/authors/featured')
      .then(res => res.json())
      .then(data => setFeaturedAuthors(data))
      .catch(err => console.error('Failed to fetch featured authors', err));
  }, []);

  return (
    <section className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Featured Authors</h2>
        <Link to="/authors" className={styles.viewAll}>
          See all
        </Link>
      </div>
      <div className={styles.booksContainer}>
        <div className={styles.booksRow}>
          {featuredAuthors.map(author => (
            <AuthorCard key={author.id} author={author} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AuthorRow;
