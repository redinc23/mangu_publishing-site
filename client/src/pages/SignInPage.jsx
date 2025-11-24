import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SignInPage.css';

const MODE = {
  SIGN_IN: 'signin',
  SIGN_UP: 'signup',
  CONFIRM: 'confirm'
};

function SignInPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp, confirmSignUp, loginWithHostedUI } = useAuth();

  const [mode, setMode] = useState(MODE.SIGN_IN);
  const [formState, setFormState] = useState({ name: '', email: '', password: '' });
  const [confirmCode, setConfirmCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (location.pathname.includes('signup')) {
      setMode(MODE.SIGN_UP);
    } else {
      setMode(MODE.SIGN_IN);
    }
    setError('');
    setSuccess('');
  }, [location.pathname]);

  const ctaText = useMemo(() => {
    if (mode === MODE.SIGN_UP) return 'Create account';
    if (mode === MODE.CONFIRM) return 'Verify account';
    return 'Sign in';
  }, [mode]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn(formState.email, formState.password);
    if (result.success) {
      setSuccess('Welcome back to MANGU.');
      setTimeout(() => navigate('/profile'), 800);
    } else {
      setError(result.error || 'Unable to sign in. Please try again.');
    }
    setLoading(false);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const result = await signUp(formState.email, formState.password, formState.name);
    if (result.success) {
      setPendingEmail(formState.email);
      setMode(MODE.CONFIRM);
      setSuccess('We sent you a verification code. Enter it below to activate your account.');
    } else {
      setError(result.error || 'Unable to create account. Please try again.');
    }
    setLoading(false);
  };

  const handleConfirm = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const emailToConfirm = pendingEmail || formState.email;
    const result = await confirmSignUp(emailToConfirm, confirmCode);
    if (result.success) {
      setSuccess('Account confirmed! You can now sign in.');
      setMode(MODE.SIGN_IN);
    } else {
      setError(result.error || 'Verification failed. Check your code and try again.');
    }
    setLoading(false);
  };

  const renderForm = () => {
    if (mode === MODE.SIGN_UP) {
      return (
        <form className="auth-form" onSubmit={handleSignUp}>
          <div className="form-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              placeholder="MANGU Reader"
              value={formState.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@email.com"
              value={formState.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a secure password"
                value={formState.password}
                onChange={handleInputChange}
                required
                minLength={8}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            <span className="field-hint">8+ characters, one number or symbol recommended.</span>
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      );
    }

    if (mode === MODE.CONFIRM) {
      return (
        <form className="auth-form" onSubmit={handleConfirm}>
          <div className="form-field">
            <label htmlFor="code">Verification code</label>
            <input
              id="code"
              name="code"
              placeholder="Enter the 6-digit code"
              value={confirmCode}
              onChange={(event) => setConfirmCode(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify account'}
          </button>
          <p className="small-text">
            Didn&apos;t get a code?{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => setMode(MODE.SIGN_UP)}
            >
              Resend
            </button>
          </p>
        </form>
      );
    }

    return (
      <form className="auth-form" onSubmit={handleSignIn}>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@email.com"
            value={formState.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formState.password}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>
        <div className="form-aux">
          <label className="remember">
            <input type="checkbox" /> Remember me
          </label>
          <Link to="/reset-password" className="link-button" style={{ background: 'none', border: 'none', padding: 0, color: 'inherit' }}>
            Forgot password?
          </Link>
        </div>
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    );
  };

  return (
    <div className="auth-page">
      <section className="auth-illustration">
        <div className="auth-overlay">
          <h1>Just Read Love.</h1>
          <p>
            Unlimited books, audiobooks, podcasts, documentaries, and exclusive interviews.
            Join a global community of readers shaping the future of storytelling.
          </p>
          <div className="auth-highlights">
            <div>
              <strong>5k+</strong>
              <span>Premium titles added monthly</span>
            </div>
            <div>
              <strong>Immersive</strong>
              <span>Audio + visual experiences in sync</span>
            </div>
            <div>
              <strong>Creators</strong>
              <span>Original stories from voices worldwide</span>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{ctaText}</h2>
            <p>
              {mode === MODE.SIGN_IN
                ? 'Enter your details to continue exploring MANGU.'
                : mode === MODE.SIGN_UP
                ? 'Create your account to unlock personalised recommendations.'
                : 'Finish setting up your account with the one-time verification code.'}
            </p>
          </div>

          <div className="auth-switch">
            {mode !== MODE.SIGN_IN && (
              <button onClick={() => setMode(MODE.SIGN_IN)} type="button">
                <i className="fas fa-sign-in-alt"></i> I already have an account
              </button>
            )}
            {mode !== MODE.SIGN_UP && mode !== MODE.CONFIRM && (
              <button onClick={() => setMode(MODE.SIGN_UP)} type="button">
                <i className="fas fa-user-plus"></i> Create a new account
              </button>
            )}
          </div>

          {error && <div className="auth-alert error">{error}</div>}
          {success && <div className="auth-alert success">{success}</div>}

          {renderForm()}

          <div className="auth-divider">
            <span></span>
            <p>or</p>
            <span></span>
          </div>

          <button
            type="button"
            className="auth-social"
            onClick={loginWithHostedUI}
            disabled={loading}
          >
            <i className="fab fa-google"></i>
            Continue with Google
          </button>

          <p className="auth-footnote">
            {mode === MODE.SIGN_IN ? (
              <>
                Need an account? <Link to="/signup">Sign up</Link>
              </>
            ) : (
              <>
                Already a member? <Link to="/signin">Sign in</Link>
              </>
            )}
          </p>
        </div>
        <div className="auth-trust">
          <span>Trusted by teams and readers working at</span>
          <div className="trust-logos">
            <span>HarborLight</span>
            <span>Verse Labs</span>
            <span>Aurora Media</span>
            <span>Inkline</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SignInPage;
