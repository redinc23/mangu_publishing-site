import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BookForm.module.css';

const BookForm = () => {
  const navigate = useNavigate();
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
      const response = await fetch('/api/admin/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year),
          rating: formData.rating ? parseFloat(formData.rating) : null
        })
      });

      if (response.ok) {
        // Reset form and redirect on success
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
        navigate('/admin/books'); // Redirect back to books list
      } else {
        throw new Error('Failed to create book');
      }
    } catch (error) {
      console.error('Error creating book:', error);
      alert('Error creating book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2>Add New Book</h2>
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
            {isSubmitting ? 'Adding...' : 'Add Book'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookForm;