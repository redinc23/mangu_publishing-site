// client/src/pages/VerifyEmailPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './SignInPage.css';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/auth/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Email verified successfully! Redirecting to sign in...');
        setTimeout(() => navigate('/signin'), 2000);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Verification code resent to your email');
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="auth-container">
        <form className="auth-form" onSubmit={handleVerify}>
          <h1>Verify Your Email</h1>
          <p className="auth-subtitle">
            We sent a verification code to your email address. Enter it below to activate your account.
          </p>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="code">Verification Code</label>
            <input
              id="code"
              type="text"
              name="code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
            <small className="field-hint">
              Check your email for the 6-digit verification code
            </small>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading || !email || !code}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div className="auth-footer">
            <button
              type="button"
              className="auth-link"
              onClick={handleResendCode}
              disabled={loading || !email}
            >
              Resend Code
            </button>
            <span className="auth-divider">•</span>
            <Link to="/signin" className="auth-link">
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
