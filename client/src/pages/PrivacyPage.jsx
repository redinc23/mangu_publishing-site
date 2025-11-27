import React from 'react';
import './PrivacyPage.css';

function PrivacyPage() {
  return (
    <div className="privacy-page">
      <div className="container">
        <h1>Privacy Policy</h1>
        <div className="content">
          <section>
            <h2>1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, including when you create an
              account, make a purchase, or contact us for support.
            </p>
          </section>
          <section>
            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services,
              process transactions, and communicate with you.
            </p>
          </section>
          <section>
            <h2>3. Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may
              share information in certain limited circumstances.
            </p>
          </section>
          <section>
            <h2>4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>
          <section>
            <h2>5. Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal information at any time
              through your account settings.
            </p>
          </section>
          <section>
            <h2>6. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our website and
              hold certain information.
            </p>
          </section>
        </div>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default PrivacyPage;

