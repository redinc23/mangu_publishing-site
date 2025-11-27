import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import NotionAI from '../../components/NotionAI';
import styles from './BookForm.module.css';

const BookForm = ({ book: initialBook, isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  // State to manage form data
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    year: '',
    rating: '',
    cover: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit && !initialBook);

  useEffect(() => {
    if (isEdit && id && !initialBook) {
      // Load book data for editing
      const loadBook = async () => {
        try {
          const bookData = await apiClient.admin.getBook(id);
          setFormData({
            title: bookData.title || '',
            author:
              bookData.author ||
              (Array.isArray(bookData.authors)
                ? (typeof bookData.authors[0] === 'string'
                    ? bookData.authors[0]
                    : bookData.authors[0]?.name)
                : ''),
            genre:
              bookData.genre ||
              (Array.isArray(bookData.categories) && bookData.categories.length > 0
                ? bookData.categories[0]
                : ''),
            year:
              bookData.year ||
              (bookData.publication_date
                ? new Date(bookData.publication_date).getFullYear().toString()
                : ''),
            rating:
              bookData.rating !== undefined && bookData.rating !== null
                ? Number(bookData.rating).toString()
                : '',
            cover: bookData.cover_url || bookData.cover || '',
            description: bookData.description || ''
          });
        } catch (error) {
          console.error('Failed to load book:', error);
        } finally {
          setLoading(false);
        }
      };
      loadBook();
    } else if (initialBook) {
      // Use provided initial book data
      setFormData({
        title: initialBook.title || '',
        author:
          initialBook.author ||
          (Array.isArray(initialBook.authors)
            ? (typeof initialBook.authors[0] === 'string'
                ? initialBook.authors[0]
                : initialBook.authors[0]?.name)
            : ''),
        genre:
          initialBook.genre ||
          (Array.isArray(initialBook.categories) && initialBook.categories.length > 0
            ? initialBook.categories[0]
            : ''),
        year:
          initialBook.year ||
          (initialBook.publication_date
            ? new Date(initialBook.publication_date).getFullYear().toString()
            : ''),
        rating:
          initialBook.rating !== undefined && initialBook.rating !== null
            ? Number(initialBook.rating).toString()
            : '',
        cover: initialBook.cover_url || initialBook.cover || '',
        description: initialBook.description || ''
      });
      setLoading(false);
    }
  }, [isEdit, id, initialBook]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const normalizedYear = formData.year ? parseInt(formData.year, 10) : null;
      if (formData.year && Number.isNaN(normalizedYear)) {
        throw new Error('Year must be a valid number');
      }

      const normalizedRating = formData.rating ? parseFloat(formData.rating) : null;
      if (formData.rating && (Number.isNaN(normalizedRating) || normalizedRating < 0 || normalizedRating > 5)) {
        throw new Error('Rating must be between 0 and 5');
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        cover: formData.cover,
        cover_url: formData.cover,
        author: formData.author,
        authors: formData.author ? [{ name: formData.author }] : [],
        genre: formData.genre,
        categories: formData.genre ? [formData.genre] : [],
        year: normalizedYear,
        rating: normalizedRating,
        publication_date: normalizedYear ? `${normalizedYear}-01-01` : null
      };

      if (isEdit && id) {
        // Update existing book
        await apiClient.admin.updateBook(id, payload);
        alert('Book updated successfully!');
      } else {
        // Create new book
        await apiClient.admin.createBook(payload);
        // Reset form
        setFormData({
          title: '',
          author: '',
          genre: '',
          year: '',
          rating: '',
          cover: '',
          description: ''
        });
        alert('Book added successfully!');
      }
      navigate('/admin/books'); // Redirect back to books list
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} book:`, error);
      alert(`Error ${isEdit ? 'updating' : 'creating'} book. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading book data...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h2>{isEdit ? 'Edit Book' : 'Add New Book'}</h2>
      <form onSubmit={handleSubmit} className={styles.bookForm}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="author">Author *</label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="genre">Genre *</label>
          <input
            type="text"
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="year">Year</label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              min="1900"
              max="2030"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="rating">Rating (0-5)</label>
            <input
              type="number"
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              min="0"
              max="5"
              step="0.1"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cover">Cover Image URL</label>
          <input
            type="url"
            id="cover"
            name="cover"
            value={formData.cover}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
          />
        </div>

        {/* Notion AI Integration */}
        <NotionAI
          book={{
            title: formData.title,
            authors: formData.author ? [formData.author] : [],
            genre: formData.genre,
            tags: []
          }}
          onContentGenerated={(type, content) => {
            if (type === 'description' || type === 'summary') {
              setFormData(prev => ({
                ...prev,
                description: content
              }));
            }
          }}
        />

        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={() => navigate('/admin/books')}
            className={styles.cancelBtn}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Book' : 'Add Book')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookForm;