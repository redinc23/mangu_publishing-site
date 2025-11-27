import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api.js';
import styles from './AdminBooksPage.module.css';

const AdminBooksPage = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [notification, setNotification] = useState(null);

  // Fetch books from the public API for now
  useEffect(() => {
    let isMounted = true;

    const loadBooks = async () => {
      try {
        const response = await apiClient.admin.listBooks({ limit: 100, offset: 0 });
        if (isMounted) {
          setBooks(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        console.error('Failed to fetch admin books', err);
      }
    };

    loadBooks();

    return () => {
      isMounted = false;
    };
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
              await apiClient.admin.deleteBook(bookId);
      setBooks(prev => prev.filter(book => book.id !== bookId));
      showNotification('Book deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete book', error);
      showNotification(error?.message || 'Failed to delete book. Please try again.', 'error');
    }
  };

  const handleEdit = (bookId) => {
    navigate(`/admin/books/${bookId}/edit`);
  };

  return (
    <div>
      {notification && (
        <div 
          className={notification.type === 'success' 
            ? styles.notificationSuccess 
            : styles.notificationError}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '8px',
            backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          {notification.message}
        </div>
      )}
      <div className={styles.pageHeader}>
        <h1>Manage Books</h1>
        <Link to="/admin/books/new" className={styles.addButton}>
          + Add New Book
        </Link>
      </div>

      <table className={styles.booksTable}>
        <thead>
          <tr>
            <th>Cover</th>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map(book => {
            const coverUrl = book.cover_url || book.cover;
            const authorName =
              book.author ||
              (Array.isArray(book.authors) && book.authors.length > 0
                ? book.authors[0]
                : '');
            const genre =
              book.genre ||
              (Array.isArray(book.categories) && book.categories.length > 0
                ? book.categories[0]
                : '');
            return (
              <tr key={book.id}>
              <td>
                {coverUrl && (
                  <img src={coverUrl} alt={book.title} className={styles.bookCover} />
                )}
              </td>
              <td>{book.title}</td>
              <td>{authorName || '—'}</td>
              <td>{genre || '—'}</td>
              <td>
                <div className={styles.actionButtons}>
                  <button 
                    className={styles.editBtn}
                    onClick={() => handleEdit(book.id)}
                  >
                    Edit
                  </button>
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(book.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBooksPage;
