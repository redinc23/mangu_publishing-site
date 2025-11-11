import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BookCard from '../../components/BookCard';
import styles from './TopRatedRow.module.css';

const TopRatedRow = () => {
  const [topRatedBooks, setTopRatedBooks] = useState([]);

  useEffect(() => {
    // Fetch top rated books from API
    fetch('/api/books/top-rated')
      .then(res => res.json())
      .then(data => setTopRatedBooks(data))
      .catch(err => console.error('Failed to fetch top rated books', err));
  }, []);

  return (
    <section className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Top Rated Books</h2>
        <Link to="/library/top-rated" className={styles.viewAll}>
          See all
        </Link>
      </div>
      <div className={styles.booksContainer}>
        <div className={styles.booksRow}>
          {topRatedBooks.map(book => (
            <BookCard key={book.id} book={book} variant="detailed" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopRatedRow;
