import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LibraryContext } from '../context/LibraryContext';
import './ProfilePage.css';

const PREFERENCE_DEFAULTS = {
  weeklyDigest: true,
  releaseAlerts: true,
  autoPlayAudio: false,
  darkMode: true
};

const formatMinutes = (minutes) => {
  if (!minutes) return '—';
  if (minutes < 120) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)} hrs`;
};

const getInitials = (name = '') => {
  const segments = name.split(' ').filter(Boolean);
  if (!segments.length) return 'MP';
  if (segments.length === 1) return segments[0].slice(0, 2).toUpperCase();
  return (segments[0][0] + segments[segments.length - 1][0]).toUpperCase();
};

const TAB_MAP = {
  '/profile': 'overview',
  '/bookmarks': 'overview',
  '/history': 'activity',
  '/recommendations': 'overview',
  '/gift-cards': 'settings'
};

function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loginWithHostedUI } = useAuth();
  const { libraryItems } = useContext(LibraryContext);

  const [activeTab, setActiveTab] = useState('overview');
  const [formState, setFormState] = useState({
    displayName: '',
    email: '',
    bio: '',
    location: '',
    profession: ''
  });
  const [preferences, setPreferences] = useState(PREFERENCE_DEFAULTS);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedListFilter, setSelectedListFilter] = useState('saved');

  useEffect(() => {
    const defaultTab = TAB_MAP[location.pathname] || 'overview';
    setActiveTab(defaultTab);
  }, [location.pathname]);

  useEffect(() => {
    if (user?.signInDetails?.loginId) {
      const fallbackName = user?.username || user?.signInDetails?.loginId?.split('@')[0] || 'Reader';
      setFormState((prev) => ({
        ...prev,
        email: user.signInDetails.loginId,
        displayName: prev.displayName || fallbackName
      }));
    }
  }, [user]);

  const stats = useMemo(() => {
    const total = libraryItems.length;
    const minutes = total ? total * 320 : 0;

    const genreCounts = libraryItems.reduce((acc, book) => {
      if (book.genre) {
        acc[book.genre] = (acc[book.genre] || 0) + 1;
      }
      return acc;
    }, {});

    const topGenreEntry = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];
    const favoriteGenre = topGenreEntry ? topGenreEntry[0] : 'Literary Fiction';

    return {
      totalSaved: total,
      completed: Math.max(1, Math.round(total * 0.6)),
      minutes,
      streakDays: Math.max(3, Math.min(30, total * 2)),
      favoriteGenre
    };
  }, [libraryItems]);

  const curatedLists = useMemo(() => {
    const saved = libraryItems.slice(0, 6);
    const trending = libraryItems.filter((book) => parseFloat(book.rating || 0) >= 4.5).slice(0, 6);
    const recent = [...libraryItems].reverse().slice(0, 6);
    return { saved, trending, recent };
  }, [libraryItems]);

  const activityFeed = useMemo(() => {
    if (libraryItems.length === 0) {
      return [
        {
          id: 'placeholder-1',
          action: 'Explore your library',
          description: 'Save books, audiobooks, videos, and magazines to keep track of everything you love.',
          timestamp: 'Today'
        }
      ];
    }

    return libraryItems.slice(0, 6).map((book, index) => {
      const date = new Date(Date.now() - index * 86400000);
      return {
        id: book.id ?? index,
        action: index === 0 ? 'Finished reading' : 'Added to library',
        title: book.title,
        description: book.author || 'Featured creator on MANGU',
        timestamp: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    });
  }, [libraryItems]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    setStatusMessage('Profile updated. We\'ll sync this across your devices.');
    setTimeout(() => setStatusMessage(''), 3500);
  };

  const handlePreferenceToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    setStatusMessage('Preferences saved for your next session.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  if (!user) {
    return (
      <div className="profile-page">
        <section className="profile-empty-state">
          <div className="profile-empty-card">
            <h1>Sign in to personalise your MANGU space</h1>
            <p>
              Sync your library, recommendations, and listening progress across every device.
            </p>
            <div className="profile-empty-actions">
              <button className="primary" onClick={() => navigate('/signin')}>
                Sign in with email
              </button>
              <button onClick={loginWithHostedUI}>
                Continue with MANGU ID
              </button>
            </div>
            <span className="profile-empty-footnote">
              Don&apos;t have an account? <Link to="/signup">Create one in seconds</Link>
            </span>
          </div>
        </section>
      </div>
    );
  }

  const activeList = curatedLists[selectedListFilter] || curatedLists.saved;

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-identity">
          <div className="profile-avatar-lg">{getInitials(formState.displayName)}</div>
          <div className="profile-identity-text">
            <h1>{formState.displayName || 'Your Library'}</h1>
            <p>{formState.email || user.signInDetails?.loginId}</p>
            <div className="profile-tags">
              <span><i className="fas fa-bolt"></i> Member since 2024</span>
              <span><i className="fas fa-crown"></i> MANGU Plus</span>
              <span><i className="fas fa-map-marker-alt"></i> Global reader</span>
            </div>
            <div className="profile-hero-actions">
              <button className="primary" onClick={() => navigate('/library')}>
                Continue reading
              </button>
              <button onClick={() => navigate('/cart')}>
                View cart
              </button>
              <button onClick={signOut}>
                Sign out
              </button>
            </div>
          </div>
        </div>
        <div className="profile-quick-stats">
          <div className="profile-stat">
            <span className="stat-value">{stats.totalSaved}</span>
            <span className="stat-label">Saved titles</span>
          </div>
          <div className="profile-stat">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="profile-stat">
            <span className="stat-value">{formatMinutes(stats.minutes)}</span>
            <span className="stat-label">Listening time</span>
          </div>
          <div className="profile-stat">
            <span className="stat-value">{stats.favoriteGenre}</span>
            <span className="stat-label">Top genre</span>
          </div>
        </div>
      </section>

      <nav className="profile-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: 'fas fa-user-circle' },
          { id: 'activity', label: 'Reading activity', icon: 'fas fa-chart-line' },
          { id: 'settings', label: 'Account settings', icon: 'fas fa-sliders-h' }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={tab.icon}></i> {tab.label}
          </button>
        ))}
      </nav>

      {statusMessage && (
        <div className="profile-status-banner">
          <i className="fas fa-check-circle"></i>
          <span>{statusMessage}</span>
        </div>
      )}

      {activeTab === 'overview' && (
        <section className="profile-overview">
          <div className="profile-overview-grid">
            <div className="profile-overview-card">
              <h2>Reading streak</h2>
              <p className="streak-count">{stats.streakDays} days</p>
              <p className="muted">Keep exploring daily to maintain your momentum.</p>
              <button onClick={() => navigate('/library')}>
                Discover new releases
              </button>
            </div>
            <div className="profile-overview-card">
              <h2>Continue listening</h2>
              {libraryItems.length ? (
                <ul className="continue-list">
                  {libraryItems.slice(0, 3).map((book) => (
                    <li key={book.id}>
                      <div className="continue-cover">
                        <img src={book.cover} alt={book.title} />
                      </div>
                      <div>
                        <h3>{book.title}</h3>
                        <p>{book.author}</p>
                      </div>
                      <button onClick={() => navigate(`/book/${book.id}`)}>
                        Resume
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Save a book to see it here.</p>
              )}
            </div>
          </div>

          <div className="profile-library-preview">
            <div className="profile-library-header">
              <h2>Your curated shelves</h2>
              <div className="profile-library-filters">
                {[
                  { id: 'saved', label: 'Saved' },
                  { id: 'trending', label: 'Trending' },
                  { id: 'recent', label: 'Recently added' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    className={selectedListFilter === filter.id ? 'active' : ''}
                    onClick={() => setSelectedListFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="profile-library-grid">
              {activeList.length ? (
                activeList.map((book) => (
                  <article
                    key={book.id}
                    className="profile-library-card"
                    onClick={() => navigate(`/book/${book.id}`)}
                  >
                    <div className="library-card-cover">
                      <img src={book.cover} alt={book.title} />
                    </div>
                    <div className="library-card-body">
                      <h3>{book.title}</h3>
                      <p>{book.author}</p>
                      <span>{book.genre || 'Featured genre'}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="profile-empty-list">
                  <p>No titles yet. Start building your universe.</p>
                  <button onClick={() => navigate('/library')}>
                    Explore catalog
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-quick-links">
            <h2>Quick actions</h2>
            <div className="quick-links-grid">
              {[
                { icon: 'fas fa-book', label: 'My library', to: '/library' },
                { icon: 'fas fa-bookmark', label: 'Bookmarks', to: '/bookmarks' },
                { icon: 'fas fa-history', label: 'Reading history', to: '/history' },
                { icon: 'fas fa-gift', label: 'Gift cards', to: '/gift-cards' },
                { icon: 'fas fa-certificate', label: 'Rewards', to: '/profile#rewards' },
                { icon: 'fas fa-cog', label: 'Account settings', to: '/profile#account' }
              ].map((link) => (
                <Link key={link.label} to={link.to} className="quick-link-card">
                  <i className={link.icon}></i>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'activity' && (
        <section className="profile-activity">
          <div className="activity-header">
            <h2>Recent activity</h2>
            <p className="muted">
              A timeline of everything you&apos;ve enjoyed on MANGU.
            </p>
          </div>
          <div className="activity-feed">
            {activityFeed.map((entry) => (
              <div key={entry.id} className="activity-item">
                <div className="activity-icon">
                  <i className="fas fa-check"></i>
                </div>
                <div className="activity-body">
                  <span className="activity-title">
                    {entry.action} {entry.title && <strong>{entry.title}</strong>}
                  </span>
                  <span className="activity-description">{entry.description}</span>
                </div>
                <span className="activity-time">{entry.timestamp}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'settings' && (
        <section className="profile-settings" id="account">
          <div className="settings-grid">
            <form className="profile-form" onSubmit={handleProfileSubmit}>
              <h2>Account information</h2>
              <div className="form-row">
                <label htmlFor="displayName">Display name</label>
                <input
                  id="displayName"
                  name="displayName"
                  value={formState.displayName}
                  onChange={handleFormChange}
                  placeholder="How people see you on MANGU"
                />
              </div>
              <div className="form-row">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleFormChange}
                  placeholder="name@email.com"
                />
              </div>
              <div className="form-row">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  name="location"
                  value={formState.location}
                  onChange={handleFormChange}
                  placeholder="City, Country"
                />
              </div>
              <div className="form-row">
                <label htmlFor="profession">Profession</label>
                <input
                  id="profession"
                  name="profession"
                  value={formState.profession}
                  onChange={handleFormChange}
                  placeholder="What do you do?"
                />
              </div>
              <div className="form-row">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="3"
                  value={formState.bio}
                  onChange={handleFormChange}
                  placeholder="Share a little about your reading journey…"
                />
              </div>
              <button type="submit" className="primary">
                Save changes
              </button>
            </form>

            <div className="profile-preferences" id="preferences">
              <h2>Preferences</h2>
              <div className="preference-toggle">
                {[
                  { key: 'weeklyDigest', label: 'Weekly MANGU digest', description: 'Curated picks delivered every Sunday.' },
                  { key: 'releaseAlerts', label: 'New release alerts', description: 'Be the first to know when authors you follow publish.' },
                  { key: 'autoPlayAudio', label: 'Autoplay audiobooks', description: 'Automatically switch to the audio track when it\'s available.' },
                  { key: 'darkMode', label: 'Match system dark mode', description: 'Sync theme with your device appearance.' }
                ].map((option) => (
                  <label key={option.key} className="toggle-row">
                    <div>
                      <span>{option.label}</span>
                      <p>{option.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences[option.key]}
                      onChange={() => handlePreferenceToggle(option.key)}
                    />
                  </label>
                ))}
              </div>

              <div className="profile-security" id="privacy">
                <h3>Security</h3>
                <p className="muted">Manage how you sign in to MANGU.</p>
                <div className="security-actions">
                  <button onClick={() => navigate('/help')}>
                    Change password
                  </button>
                  <button onClick={loginWithHostedUI}>
                    Enable social sign-in
                  </button>
                </div>
                <span className="last-updated">Last updated today</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default ProfilePage;
