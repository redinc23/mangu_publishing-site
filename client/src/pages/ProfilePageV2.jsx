import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMockSessionStore } from '../state/useMockSessionStore';
import { LibraryContext } from '../context/LibraryContext';
import { CartContext } from '../context/CartContext';

const USE_MOCK_AUTH = !import.meta.env.VITE_AWS_REGION || !import.meta.env.VITE_COGNITO_USER_POOL_ID;
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80';

export default function ProfilePageV2() {
  const auth = useAuth();
  const mockAuth = useMockSessionStore((state) => ({
    user: state.user,
    signOut: state.signOut
  }));

  // Use real auth if configured, otherwise fallback to mock
  const activeAuth = USE_MOCK_AUTH ? mockAuth : auth;
  const user = USE_MOCK_AUTH ? mockAuth.user : auth.user;
  const signOut = USE_MOCK_AUTH ? mockAuth.signOut : auth.signOut;

  const { libraryItems } = useContext(LibraryContext);
  const { cartItems } = useContext(CartContext);

  // Transform Cognito user to match expected format
  const displayUser = user ? (USE_MOCK_AUTH ? user : {
    name: user.username || user.signInDetails?.loginId?.split('@')[0] || 'User',
    email: user.signInDetails?.loginId || user.username || '',
    avatarUrl: DEFAULT_AVATAR,
    membership: 'Member',
    favoriteGenres: [],
    badges: []
  }) : null;

  if (auth.loading && !USE_MOCK_AUTH) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6 py-16">
        <div className="max-w-xl text-center space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Profile</p>
          <h1 className="text-4xl font-bold">
            {USE_MOCK_AUTH ? "You're viewing the demo mode." : "Please sign in"}
          </h1>
          <p className="text-white/70">
            {USE_MOCK_AUTH 
              ? "Head back to the sign-in page, drop in any email, and we'll hydrate this view with mock data instantly."
              : "Sign in to view your profile and access your library."}
          </p>
          <Link
            to="/signin"
            className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-3 text-base font-semibold hover:bg-white/20"
          >
            {USE_MOCK_AUTH ? 'Return to sign in' : 'Sign in'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040404] text-white px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <img
              src={displayUser.avatarUrl}
              alt={displayUser.name}
              className="h-20 w-20 rounded-2xl object-cover border border-white/10"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                Member
              </p>
              <h1 className="text-3xl font-bold">{displayUser.name}</h1>
              <p className="text-white/70">{displayUser.email}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm text-white/70">
            <p>
              Membership · <strong className="text-white">{displayUser.membership}</strong>
            </p>
            {displayUser.favoriteGenres && displayUser.favoriteGenres.length > 0 && (
              <p>
                Favorite genres ·{' '}
                <strong className="text-white">{displayUser.favoriteGenres.join(', ')}</strong>
              </p>
            )}
            {displayUser.badges && displayUser.badges.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {displayUser.badges.map((badge) => (
                  <span key={badge} className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide">
                    {badge}
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={signOut}
              className="self-start rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/70 hover:text-white"
            >
              Sign out {USE_MOCK_AUTH ? '(mock)' : ''}
            </button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Library</p>
            <p className="text-3xl font-bold mt-2">{libraryItems.length}</p>
            <p className="text-sm text-white/70 mt-2">Books saved via the V2 flow.</p>
            <Link className="text-sm text-white/80 hover:text-white mt-4 inline-flex items-center gap-2" to="/library">
              Browse more
              <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Cart</p>
            <p className="text-3xl font-bold mt-2">{cartItems.length}</p>
            <p className="text-sm text-white/70 mt-2">Items waiting for checkout.</p>
            <Link className="text-sm text-white/80 hover:text-white mt-4 inline-flex items-center gap-2" to="/cart">
              View cart
              <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Audiobook</p>
            <p className="text-3xl font-bold mt-2">/audio</p>
            <p className="text-sm text-white/70 mt-2">Jump into the new player.</p>
            <Link className="text-sm text-white/80 hover:text-white mt-4 inline-flex items-center gap-2" to="/audiobooks/audio-1">
              Open player
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Saved titles</h2>
            <span className="text-sm text-white/60">Live mock data</span>
          </div>
          {libraryItems.length === 0 ? (
            <div className="text-white/70 text-sm">
              Nothing yet. Use the <Link to="/library" className="text-white underline">library</Link> page to add a book.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {libraryItems.map((book) => (
                <Link
                  to={`/book/${book.id}`}
                  key={book.id}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/30 transition"
                >
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="h-24 w-20 rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div className="text-sm text-white/80">
                    <p className="text-xs uppercase tracking-wide text-white/50">
                      {book.categories?.[0] || 'Featured'}
                    </p>
                    <h3 className="text-lg font-semibold text-white">{book.title}</h3>
                    <p className="mt-1">
                      {book.authors?.map((a) => a.name).join(', ')}
                    </p>
                    <p className="text-white/60 mt-2">
                      Last opened via <span className="text-white">/book/{book.id}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

