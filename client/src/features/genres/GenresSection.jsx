import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './GenresSection.module.css';

const GenresSection = () => {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    // Fetch unique genres from API
    fetch('/api/books/all/genres')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setGenres(data);
        }
      })
      .catch(err => console.error('Failed to fetch genres', err));
  }, []);

  return (
    <section className={styles.genresSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Popular Genres</h2>
        <a href="/genres" className={styles.viewAll}>Browse All</a>
      </div>
      <div className={styles.genresGrid}>
        {genres.map((genre) => (
          <Link 
            key={genre} 
            to={"/genres?filter=" + encodeURIComponent(genre)} 
            className={styles.genreCard}
          >
            <span className={styles.genreName}>{genre}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default GenresSection;