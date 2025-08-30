import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../../context/CartContext';
import { LibraryContext } from '../../context/LibraryContext';
import styles from './FeaturedBook.module.css';

const FeaturedBook = () => {
  const { addToLibrary } = useContext(LibraryContext);
  const { addToCart } = useContext(CartContext);
  const [featured, setFeatured] = useState(null);

  // Fetch featured book data from API on mount
  useEffect(() => {
    fetch('/api/books/featured')
      .then(res => res.json())
      .then(data => setFeatured(data))
      .catch(err => console.error('Failed to fetch featured book', err));
  }, []);

  if (!featured) {
    return null; // or a loading state
  }

  const { title, author, genre, year, description, cover } = featured;

  return (
    <section className={styles.featuredHero} id="featured">
      <div className={styles.featuredContainer}>
        <div className={styles.featuredPoster}>
          <img src={cover} alt={title} />
        </div>
        <div className={styles.featuredInfo}>
          <h2 className={styles.featuredTitle}>{title}</h2>
          <p className={styles.featuredAuthor}>by {author}</p>
          <div className={styles.featuredMeta}>
            <span><i className="fas fa-star"></i> {genre}</span>
            <span>•</span>
            <span>{year} Edition</span>
          </div>
          <p className={styles.featuredDescription}>{description}</p>
          <div className={styles.featuredActions}>
            <button className={styles.btnPlay}>
              <i className="fas fa-play"></i>
              Read Now
            </button>
            <button className={styles.btnSecondary} onClick={() => addToLibrary(featured.id)}>
              <i className="fas fa-bookmark"></i>
              Add to Library
            </button>
            <button className={styles.btnIcon} onClick={() => addToCart(featured.id)}>
              <i className="fas fa-shopping-cart"></i>
            </button>
            {/* Additional icons for audio or info can be added as needed */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBook;
