import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuthorCard.module.css';

const AuthorCard = ({ author }) => {
  const navigate = useNavigate();
  const { id, name, genre, rating, bookCount, photo } = author;

  const handleViewBooks = () => {
    // Navigate to author profile page
    navigate(`/author/${id}`);
  };
  const handleFollowAuthor = () => {
    // Placeholder for follow action
    console.log(`Followed author ${name}`);
  };

  return (
    <div className={styles.bookCard}>
      <img src={photo} alt={name} className={styles.bookCover} />
      <div className={styles.bookOverlay}>
        <div className={styles.bookActions}>
          <div className={styles.bookAction} onClick={handleFollowAuthor}>
            <i className="fas fa-user-plus"></i>
          </div>
          <div className={styles.bookAction} onClick={handleViewBooks}>
            <i className="fas fa-book"></i>
          </div>
        </div>
        <div className={styles.bookInfo}>
          <div className={styles.bookTitle}>{name}</div>
          <div className={styles.bookAuthor}>{genre} Author</div>
          <div className={styles.bookRating}>★ {rating.toFixed(1)} • {bookCount} books</div>
        </div>
      </div>
    </div>
  );
};

export default AuthorCard;
