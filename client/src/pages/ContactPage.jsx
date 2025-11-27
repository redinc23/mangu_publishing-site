import React, { useState } from 'react';
import './LegalPage.css';

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send the form data to an API
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="legal-page">
        <h1>Thank You!</h1>
        <div className="legal-content">
          <p>We've received your message and will get back to you as soon as possible.</p>
          <button onClick={() => setSubmitted(false)} className="btn-primary">Send Another Message</button>
        </div>
      </div>
    );
  }

  return (
    <div className="legal-page">
      <h1>Contact Us</h1>
      <div className="legal-content">
        <section>
          <h2>Get in Touch</h2>
          <p>Have a question, suggestion, or need help? We'd love to hear from you!</p>
        </section>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="6"
              required
            />
          </div>

          <button type="submit" className="btn-primary">Send Message</button>
        </form>

        <section className="contact-info">
          <h2>Other Ways to Reach Us</h2>
          <p><strong>General Inquiries:</strong> info@mangu.com</p>
          <p><strong>Support:</strong> support@mangu.com</p>
          <p><strong>Authors:</strong> authors@mangu.com</p>
          <p><strong>Press:</strong> press@mangu.com</p>
        </section>
      </div>
    </div>
  );
}

export default ContactPage;
