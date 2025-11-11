import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NewsletterPage.css';

function NewsletterPage() {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    interests: [],
    frequency: 'weekly'
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Create floating bubbles
    const createBubbles = () => {
      for (let i = 0; i < 20; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.style.left = Math.random() * 100 + '%';
        bubble.style.width = Math.random() * 30 + 10 + 'px';
        bubble.style.height = bubble.style.width;
        bubble.style.animationDelay = Math.random() * 15 + 's';
        bubble.style.animationDuration = Math.random() * 10 + 10 + 's';
        document.querySelector('.newsletter-page')?.appendChild(bubble);
      }
    };

    // Create stars
    const createStars = () => {
      for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 70 + '%';
        star.style.width = Math.random() * 3 + 1 + 'px';
        star.style.height = star.style.width;
        star.style.animationDelay = Math.random() * 5 + 's';
        document.querySelector('.newsletter-page')?.appendChild(star);
      }
    };

    createBubbles();
    createStars();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        interests: checked
          ? [...prev.interests, value]
          : prev.interests.filter(i => i !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Newsletter subscription:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="newsletter-page">
      <div className="ocean-layer"></div>
      <div className="sky-layer"></div>

      <div className="container">
        <h1 className="page-title">Subscribe to Our Newsletter</h1>
        <p className="subtitle">
          Stay updated with the latest books, authors, and exclusive content
        </p>

        {submitted ? (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            <h2>Thank you for subscribing!</h2>
            <p>Check your email for confirmation.</p>
          </div>
        ) : (
          <div className="newsletter-card">
            <h2 className="form-title">
              <i className="fas fa-envelope"></i>
              Join Our Community
            </h2>
            <form className="subscription-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="frequency">Email Frequency</label>
                <select
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Interests (Select all that apply)</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="new-releases"
                    value="new-releases"
                    checked={formData.interests.includes('new-releases')}
                    onChange={handleChange}
                  />
                  <label htmlFor="new-releases">New Releases</label>
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="author-interviews"
                    value="author-interviews"
                    checked={formData.interests.includes('author-interviews')}
                    onChange={handleChange}
                  />
                  <label htmlFor="author-interviews">Author Interviews</label>
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="events"
                    value="events"
                    checked={formData.interests.includes('events')}
                    onChange={handleChange}
                  />
                  <label htmlFor="events">Events & Book Signings</label>
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="deals"
                    value="deals"
                    checked={formData.interests.includes('deals')}
                    onChange={handleChange}
                  />
                  <label htmlFor="deals">Special Deals & Discounts</label>
                </div>
              </div>

              <button type="submit" className="subscribe-btn">
                <i className="fas fa-paper-plane"></i> Subscribe Now
              </button>
            </form>
          </div>
        )}

        <div className="benefits-section">
          <h2>What You'll Get</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <i className="fas fa-book"></i>
              <h3>Exclusive Content</h3>
              <p>Early access to new releases and author content</p>
            </div>
            <div className="benefit-card">
              <i className="fas fa-tags"></i>
              <h3>Special Offers</h3>
              <p>Member-only discounts and promotions</p>
            </div>
            <div className="benefit-card">
              <i className="fas fa-calendar"></i>
              <h3>Event Invitations</h3>
              <p>Get notified about book signings and events</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsletterPage;

