import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthorSubmitPage.css';

function AuthorSubmitPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    coverFile: null,
    manuscriptFile: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('genre', formData.genre);
      if (formData.coverFile) {
        formDataToSend.append('cover', formData.coverFile);
      }
      if (formData.manuscriptFile) {
        formDataToSend.append('manuscript', formData.manuscriptFile);
      }

      const response = await fetch('http://localhost:3002/api/author/submissions', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          // JWT token would go here
          // 'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/author-portal');
        }, 2000);
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="author-submit-page">
        <div className="success-message">
          <h2>✓ Submission Successful!</h2>
          <p>Thank you for your submission. We'll review it and get back to you soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="author-submit-page">
      <div className="submit-header">
        <h1>Submit Your Book</h1>
        <p>Share your work with the MANGU community</p>
      </div>

      <form className="submit-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="title">Book Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter your book's title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="6"
            placeholder="Describe your book (plot, themes, target audience)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="genre">Genre *</label>
          <select
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            required
          >
            <option value="">Select a genre</option>
            <option value="fiction">Fiction</option>
            <option value="non-fiction">Non-Fiction</option>
            <option value="mystery">Mystery</option>
            <option value="romance">Romance</option>
            <option value="sci-fi">Science Fiction</option>
            <option value="fantasy">Fantasy</option>
            <option value="biography">Biography</option>
            <option value="self-help">Self-Help</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="coverFile">Cover Image</label>
          <input
            type="file"
            id="coverFile"
            name="coverFile"
            onChange={handleFileChange}
            accept="image/*"
          />
          <small>Recommended: JPG or PNG, at least 1000x1500px</small>
        </div>

        <div className="form-group">
          <label htmlFor="manuscriptFile">Manuscript</label>
          <input
            type="file"
            id="manuscriptFile"
            name="manuscriptFile"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
          />
          <small>Accepted formats: PDF, DOC, DOCX</small>
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>
    </div>
  );
}

export default AuthorSubmitPage;
