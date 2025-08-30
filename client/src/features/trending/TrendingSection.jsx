import React, { useEffect, useState } from 'react';
import BookCard from '../../components/BookCard';
import styles from './TrendingSection.module.css';

const TrendingSection = () => {
  const [trendingBooks, setTrendingBooks] = useState([]);

  useEffect(() => {
    fetch('/api/books/trending')
      .then(res => res.json())
      .then(data => setTrendingBooks(data))
      .catch(err => console.error('Failed to fetch trending books', err));
  }, []);

  return (
    <section className={styles.trendingSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Trending Now</h2>
      </div>
      <div className={styles.trendingGrid}>
        {trendingBooks.map(book => (
          <BookCard key={book.id} book={book} variant="grid" />
        ))}
      </div>
    </section>
  );
};

export default TrendingSection;
