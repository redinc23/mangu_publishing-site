import React, { useEffect, useState } from 'react';
import BookCard from '../../components/BookCard';
import styles from './BookRow.module.css';

const BookRow = () => {
  const [newReleases, setNewReleases] = useState([]);

  useEffect(() => {
    fetch('/api/books/new-releases')
      .then(res => res.json())
      .then(data => setNewReleases(data))
      .catch(err => console.error('Failed to fetch new releases', err));
  }, []);

  return (
    <section className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>New Releases</h2>
        <a href="#" className={styles.viewAll}>See all</a>
      </div>
      <div className={styles.booksContainer}>
        <div className={styles.booksRow}>
          {newReleases.map(book => (
            <BookCard key={book.id} book={book} variant="detailed" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookRow;
