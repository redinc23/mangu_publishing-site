import React from 'react';
import './TermsPage.css';

function TermsPage() {
  return (
    <div className="terms-page">
      <div className="container">
        <h1>Terms of Use</h1>
        <div className="content">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using MANGU Publishing, you accept and agree to be bound by the terms
              and provision of this agreement.
            </p>
          </section>
          <section>
            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily access the materials on MANGU Publishing's website
              for personal, non-commercial transitory viewing only.
            </p>
          </section>
          <section>
            <h2>3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password
              and for restricting access to your computer.
            </p>
          </section>
          <section>
            <h2>4. Intellectual Property</h2>
            <p>
              All content on this website, including text, graphics, logos, and software, is the
              property of MANGU Publishing or its content suppliers.
            </p>
          </section>
          <section>
            <h2>5. Limitation of Liability</h2>
            <p>
              MANGU Publishing shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages.
            </p>
          </section>
          <section>
            <h2>6. Changes to Terms</h2>
            <p>
              MANGU Publishing reserves the right to revise these terms at any time without notice.
            </p>
          </section>
        </div>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default TermsPage;

