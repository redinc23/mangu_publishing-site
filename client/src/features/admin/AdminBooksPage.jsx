import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './AdminBooksPage.module.css';

const AdminBooksPage = () => {
  const [books, setBooks] = useState([]);

  // Fetch books from the public API for now
  useEffect(() => {
    fetch('/api/books')
      .then(res => res.json())
      .then(data => setBooks(data))
      .catch(err => console.error('Failed to fetch books', err));
  }, []);

  const handleDelete = (bookId) => {
    // TODO: Connect to backend API
    if (window.confirm('Are you sure you want to delete this book?')) {
      console.log('Would delete book with ID:', bookId);
      // fetch(`/api/admin/books/${bookId}`, { method: 'DELETE' })
      // .then(...)
    }
  };

  return (
    <div>
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
          {books.map(book => (
            <tr key={book.id}>
              <td>
                {book.cover && (
                  <img src={book.cover} alt={book.title} className={styles.bookCover} />
                )}
              </td>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.genre}</td>
              <td>
                <div className={styles.actionButtons}>
                  <button className={styles.editBtn}>Edit</button>
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(book.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBooksPage;