import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMockSessionStore } from '../state/useMockSessionStore';

const DEMO_EMAIL = 'reader@mangu.studio';
const USE_MOCK_AUTH = !import.meta.env.VITE_AWS_REGION || !import.meta.env.VITE_COGNITO_USER_POOL_ID;

export default function SignInPageV2() {
  const navigate = useNavigate();
  const auth = useAuth();
  const mockAuth = useMockSessionStore((state) => ({
    user: state.user,
    signIn: state.signIn,
    signOut: state.signOut
  }));

  // Use real auth if configured, otherwise fallback to mock
  const activeAuth = USE_MOCK_AUTH ? mockAuth : auth;
  const user = USE_MOCK_AUTH ? mockAuth.user : auth.user;

  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Avery Reader');
  const [message, setMessage] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated
    if (user && !USE_MOCK_AUTH) {
      navigate('/library');
    }
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      if (USE_MOCK_AUTH) {
        // Mock auth flow
        const result = mockAuth.signIn({ email: email.trim(), name });
        if (result.success) {
          setMessage(`Signed in as ${result.user.name}. Redirecting to the library…`);
          setTimeout(() => navigate('/library'), 700);
        } else {
          setMessage(result.error || 'Unable to sign in. Try again.');
        }
      } else {
        // Real Cognito auth flow
        if (!password) {
          setMessage('Password is required for real authentication');
          setSubmitting(false);
          return;
        }
        const result = await auth.signIn(email.trim(), password);
        if (result.success) {
          setMessage('Signed in successfully. Redirecting…');
          setTimeout(() => navigate('/library'), 700);
        } else {
          setMessage(result.error || 'Unable to sign in. Try again.');
        }
      }
    } catch (error) {
      setMessage(error.message || 'An error occurred during sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040404] text-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-4xl grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-transparent to-transparent p-8 space-y-6"
        >
          <div>
            <p className="uppercase tracking-[0.5em] text-xs text-white/60 mb-3">
              Step one
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">
              {USE_MOCK_AUTH ? 'Mock sign-in, zero friction.' : 'Sign in to MANGU'}
            </h1>
            <p className="text-white/70 mt-3 text-base">
              {USE_MOCK_AUTH 
                ? "No passwords, no backend. Use any email and we'll keep it in local storage so the profile page has something meaningful to show."
                : "Sign in with your account to access your library and continue reading."}
            </p>
          </div>

          <label className="block text-sm font-semibold text-white/80">
            Display name
            <input
              className="mt-2 w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-base text-white outline-none focus:border-white transition"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Avery Reader"
            />
          </label>

          <label className="block text-sm font-semibold text-white/80">
            Email
            <input
              type="email"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-base text-white outline-none focus:border-white transition"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="reader@mangu.studio"
              required
            />
          </label>

          {!USE_MOCK_AUTH && (
            <label className="block text-sm font-semibold text-white/80">
              Password
              <input
                type="password"
                className="mt-2 w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-base text-white outline-none focus:border-white transition"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>
          )}

          <button
            type="submit"
            disabled={isSubmitting || auth.loading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#ff6b00] to-[#ff3d00] px-4 py-3 text-lg font-semibold shadow-lg shadow-[#ff6b0044] transition hover:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : USE_MOCK_AUTH ? 'Save session & open the library' : 'Sign in'}
          </button>

          {message && (
            <p className="text-sm text-white/80" role="status">
              {message}
            </p>
          )}

          {user && (
            <div className="rounded-2xl border border-white/15 bg-black/30 p-4 text-sm text-white/70">
              <p className="font-semibold text-white">Current {USE_MOCK_AUTH ? 'mock' : ''} user</p>
              <p>{user.name || user.username}</p>
              <p>{user.email || user.signInDetails?.loginId}</p>
              <button
                type="button"
                onClick={USE_MOCK_AUTH ? mockAuth.signOut : auth.signOut}
                className="mt-3 text-xs uppercase tracking-wide text-white/60 hover:text-white"
              >
                {USE_MOCK_AUTH ? 'Clear session' : 'Sign out'}
              </button>
            </div>
          )}
        </form>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#070709] p-6">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Next steps
            </p>
            <ul className="mt-4 space-y-4 text-sm text-white/80">
              <li>
                <span className="text-white font-semibold">/library</span> shows all mock books with filters.
              </li>
              <li>
                <span className="text-white font-semibold">/book/:id</span> surfaces premium details, tabs, and the add-to-cart action.
              </li>
              <li>
                <span className="text-white font-semibold">/cart</span> reflects anything you add.
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/library"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white"
              >
                Go to Library
              </Link>
              <Link
                to="/book/1"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white"
              >
                Jump directly to a book
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">Need to prove the profile state?</p>
            <h2 className="text-2xl font-semibold mt-2 mb-4">Visit /profile after this.</h2>
            <p className="text-white/70 text-sm">
              The profile view reads from the same mock session store, so you can confirm the sign-in stuck without hitting a backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

