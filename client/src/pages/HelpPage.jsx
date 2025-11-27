import React from 'react';
import './LegalPage.css';

function HelpPage() {
  return (
    <div className="legal-page">
      <h1>Help & Support</h1>
      <div className="legal-content">
        <section>
          <h2>Frequently Asked Questions</h2>

          <h3>How do I purchase a book?</h3>
          <p>Browse our catalog, click on a book you're interested in, and click "Add to Cart". Then proceed to checkout to complete your purchase.</p>

          <h3>What payment methods do you accept?</h3>
          <p>We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor.</p>

          <h3>How do I access my purchased books?</h3>
          <p>After purchase, books will appear in your Library. You can access your library anytime by clicking the Library link in the navigation menu.</p>

          <h3>Can I return or refund a book?</h3>
          <p>Due to the digital nature of our products, refunds are generally not available. However, we may make exceptions on a case-by-case basis. Contact support@mangu.com for assistance.</p>

          <h3>How do I track my reading progress?</h3>
          <p>Reading progress is automatically tracked as you read. You can view your reading statistics in your profile.</p>

          <h3>Can I share my purchased books with others?</h3>
          <p>Digital books are licensed for individual use only and cannot be shared.</p>

          <h3>I'm having technical issues. What should I do?</h3>
          <p>First, try refreshing the page or logging out and back in. If the issue persists, contact our support team at support@mangu.com with details about the problem.</p>

          <h3>How do I contact customer support?</h3>
          <p>You can reach our support team at support@mangu.com or through the contact form on our Contact page.</p>
        </section>

        <section>
          <h2>For Authors</h2>
          <p>If you're an author interested in publishing with MANGU, please visit our Author Portal or contact us at authors@mangu.com</p>
        </section>
      </div>
    </div>
  );
}

export default HelpPage;
