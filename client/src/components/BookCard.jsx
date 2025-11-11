import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { LibraryContext } from '../context/LibraryContext';
import styles from './BookCard.module.css';

const BookCard = ({ book, variant = 'detailed' }) => {
  const { id, title, author, cover, rating } = book;
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { addToLibrary } = useContext(LibraryContext);

  // Handlers for button actions
  const handleReadNow = () => {
    // Navigate to book details page (could be a reader in a real app)
    navigate(`/book/${id}`);
  };
  const handleAddToLibrary = () => {
    addToLibrary(id);
  };
  const handleAddToCart = () => {
    addToCart(id);
  };

  // For "grid" variant (Trending Now), we simplify the card
  const isGrid = variant === 'grid';

  return (
    <div className={styles.bookCard}>
      {/* Book cover image */}
      <img src={cover} alt={title} className={styles.bookCover} />
      {/* Overlay (appears on hover or always visible on certain variants) */}
      <div className={styles.bookOverlay}>
        {/* Actions */}
          <div className={styles.bookActions}>
            {isGrid ? (
              /* In grid variant, only show an "Add to Cart" button */
              <button
                type="button"
                className={styles.bookAction}
                onClick={handleAddToCart}
                aria-label={`Add ${title} to cart`}
              >
                <i className="fas fa-shopping-cart"></i>
              </button>
            ) : (
              /* In detailed variant, show Read, Bookmark, and Cart actions */
              <>
                <button
                  type="button"
                  className={styles.bookAction}
                  onClick={handleReadNow}
                  aria-label={`Read ${title}`}
                >
                  <i className="fas fa-play"></i>
                </button>
                <button
                  type="button"
                  className={styles.bookAction}
                  onClick={handleAddToLibrary}
                  aria-label={`Add ${title} to library`}
                >
                  <i className="fas fa-bookmark"></i>
                </button>
                <button
                  type="button"
                  className={styles.bookAction}
                  onClick={handleAddToCart}
                  aria-label={`Add ${title} to cart`}
                >
                  <i className="fas fa-shopping-cart"></i>
                </button>
              </>
            )}
          </div>
        {/* Info (title, author, rating) */}
        <div className={styles.bookInfo}>
          <div className={styles.bookTitle}>{title}</div>
          {/* Show author and rating in detailed view; in grid view, we might omit author */}
          {!isGrid && <div className={styles.bookAuthor}>{author}</div>}
          {!isGrid && rating != null && (
            <div className={styles.bookRating}>★ {rating.toFixed(1)}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
