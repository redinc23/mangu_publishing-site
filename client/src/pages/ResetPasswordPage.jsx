// client/src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignInPage.css';

const STEP = {
  REQUEST: 'request',
  CONFIRM: 'confirm',
  SUCCESS: 'success',
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP.REQUEST);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/auth/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Password reset code sent to your email');
        setStep(STEP.CONFIRM);
      } else {
        setError(data.error || 'Failed to send reset code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError('Password must contain uppercase, lowercase, and number');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Password reset successfully!');
        setStep(STEP.SUCCESS);
        setTimeout(() => navigate('/signin'), 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderRequestStep = () => (
    <form className="auth-form" onSubmit={handleRequestReset}>
      <h1>Reset Password</h1>
      <p className="auth-subtitle">
        Enter your email address and we'll send you a code to reset your password.
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
          autoFocus
        />
      </div>

      <button
        type="submit"
        className="auth-button"
        disabled={loading || !email}
      >
        {loading ? 'Sending...' : 'Send Reset Code'}
      </button>

      <div className="auth-footer">
        <Link to="/signin" className="auth-link">
          Back to Sign In
        </Link>
      </div>
    </form>
  );

  const renderConfirmStep = () => (
    <form className="auth-form" onSubmit={handleConfirmReset}>
      <h1>Enter Reset Code</h1>
      <p className="auth-subtitle">
        We sent a verification code to {email}. Enter it below along with your new password.
      </p>

      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}

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
      </div>

      <div className="form-field">
        <label htmlFor="newPassword">New Password</label>
        <input
          id="newPassword"
          type="password"
          name="newPassword"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <small className="field-hint">
          Min 8 characters, must include uppercase, lowercase, and number
        </small>
      </div>

      <div className="form-field">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        className="auth-button"
        disabled={loading || !code || !newPassword || !confirmPassword}
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>

      <div className="auth-footer">
        <button
          type="button"
          className="auth-link"
          onClick={() => setStep(STEP.REQUEST)}
          disabled={loading}
        >
          Resend Code
        </button>
      </div>
    </form>
  );

  const renderSuccessStep = () => (
    <div className="auth-form">
      <h1>✓ Password Reset Successfully</h1>
      <p className="auth-subtitle">
        Your password has been reset. You can now sign in with your new password.
      </p>

      <div className="auth-success">
        Redirecting to sign in page...
      </div>

      <Link to="/signin" className="auth-button" style={{ display: 'inline-block', marginTop: '20px' }}>
        Go to Sign In
      </Link>
    </div>
  );

  return (
    <div className="signin-page">
      <div className="auth-container">
        {step === STEP.REQUEST && renderRequestStep()}
        {step === STEP.CONFIRM && renderConfirmStep()}
        {step === STEP.SUCCESS && renderSuccessStep()}
      </div>
    </div>
  );
}
