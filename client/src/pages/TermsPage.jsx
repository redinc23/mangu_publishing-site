import React from 'react';
import './LegalPage.css';

function TermsPage() {
  return (
    <div className="legal-page">
      <h1>Terms of Service</h1>
      <div className="legal-content">
        <p className="last-updated">Last Updated: November 27, 2024</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using MANGU Publishing ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
        </section>

        <section>
          <h2>2. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
        </section>

        <section>
          <h2>3. Content and Intellectual Property</h2>
          <p>All content provided on MANGU Publishing, including books, audiobooks, and other materials, is protected by copyright and other intellectual property laws.</p>
        </section>

        <section>
          <h2>4. Purchases and Payments</h2>
          <p>All purchases are processed through secure payment gateways. Refund policies are outlined in our separate Refund Policy document.</p>
        </section>

        <section>
          <h2>5. User Conduct</h2>
          <p>Users agree not to misuse the Service, violate any laws, or infringe upon the rights of others.</p>
        </section>

        <section>
          <h2>6. Limitation of Liability</h2>
          <p>MANGU Publishing is not liable for any damages arising from the use or inability to use the Service.</p>
        </section>

        <section>
          <h2>7. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website.</p>
        </section>

        <section>
          <h2>8. Contact Information</h2>
          <p>For questions about these terms, please contact us at legal@mangu.com</p>
        </section>
      </div>
    </div>
  );
}

export default TermsPage;
