import React from 'react';
import './LegalPage.css';

function PrivacyPage() {
  return (
    <div className="legal-page">
      <h1>Privacy Policy</h1>
      <div className="legal-content">
        <p className="last-updated">Last Updated: November 27, 2024</p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including name, email address, payment information, and reading preferences.</p>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
        </section>

        <section>
          <h2>3. Information Sharing</h2>
          <p>We do not sell your personal information. We may share information with service providers, law enforcement when required, and with your consent.</p>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information, but no method of transmission over the internet is 100% secure.</p>
        </section>

        <section>
          <h2>5. Cookies and Tracking</h2>
          <p>We use cookies and similar tracking technologies to collect information about your browsing activities and improve your experience.</p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information. Contact us to exercise these rights.</p>
        </section>

        <section>
          <h2>7. Children's Privacy</h2>
          <p>Our service is not directed to children under 13. We do not knowingly collect information from children under 13.</p>
        </section>

        <section>
          <h2>8. Contact Us</h2>
          <p>For privacy-related questions, please contact us at privacy@mangu.com</p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPage;
