import React, { useState } from 'react';
import './HelpPage.css';

function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Click on the "Sign Up" button in the top right corner and follow the instructions to create your account.'
    },
    {
      question: 'How do I purchase a book?',
      answer: 'Browse our library, add books to your cart, and proceed to checkout. You can pay using various payment methods.'
    },
    {
      question: 'Can I read books offline?',
      answer: 'Yes, you can download books to read offline. Go to your library and click the download button on any book you own.'
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription at any time from your account settings page.'
    },
    {
      question: 'What formats are available?',
      answer: 'We offer ebooks, audiobooks, and physical books. Format availability varies by title.'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="help-page">
      <section className="help-hero">
        <div className="hero-content">
          <h1>How can we help you?</h1>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="container">
        <div className="help-sections">
          <section className="quick-links">
            <h2>Quick Links</h2>
            <div className="links-grid">
              <a href="#faq" className="help-link">
                <i className="fas fa-question-circle"></i>
                <span>FAQ</span>
              </a>
              <a href="#contact" className="help-link">
                <i className="fas fa-envelope"></i>
                <span>Contact Us</span>
              </a>
              <a href="#account" className="help-link">
                <i className="fas fa-user"></i>
                <span>Account Help</span>
              </a>
              <a href="#billing" className="help-link">
                <i className="fas fa-credit-card"></i>
                <span>Billing</span>
              </a>
            </div>
          </section>

          <section id="faq" className="faq-section">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-list">
              {filteredFaqs.length === 0 ? (
                <p className="no-results">No results found. Try a different search term.</p>
              ) : (
                filteredFaqs.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default HelpPage;

