import React, { useEffect, useMemo, useState } from 'react';
import './AdminPage.css';

const API_BASE = 'http://localhost:5000/api/books';

const formatNumber = (value) =>
  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();

const ADMIN_ACTIVITY = [
  {
    id: 1,
    action: 'Published new release bundle',
    icon: 'fas fa-bolt',
    timestamp: '2 hours ago'
  },
  {
    id: 2,
    action: 'Approved 14 user reviews',
    icon: 'fas fa-comment-dots',
    timestamp: '4 hours ago'
  },
  {
    id: 3,
    action: 'Imported 8 curated audiobooks',
    icon: 'fas fa-headphones',
    timestamp: 'Yesterday'
  }
];

function AdminPage() {
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    genre: 'All',
    sort: 'rating'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [trendingRes, newRes, topRes] = await Promise.all([
          fetch(`${API_BASE}/trending`, { signal: controller.signal }),
          fetch(`${API_BASE}/new-releases`, { signal: controller.signal }),
          fetch(`${API_BASE}/top-rated`, { signal: controller.signal })
        ]);

        if (!trendingRes.ok || !newRes.ok || !topRes.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const [trendingData, newData, topData] = await Promise.all([
          trendingRes.json(),
          newRes.json(),
          topRes.json()
        ]);

        setTrendingBooks(trendingData);
        setNewReleases(newData);
        setTopRated(topData);
        setError('');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Admin dashboard error:', err);
          setError('Unable to load analytics. Please try again shortly.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    return () => controller.abort();
  }, []);

  const allBooks = useMemo(() => {
    const map = new Map();
    [...trendingBooks, ...newReleases, ...topRated].forEach((book) => {
      map.set(book.id, book);
    });
    return Array.from(map.values());
  }, [trendingBooks, newReleases, topRated]);

  const metrics = useMemo(() => {
    if (!allBooks.length) {
      return {
        totalBooks: 0,
        trendingCount: 0,
        newReleaseCount: 0,
        averageRating: 0,
        lastUpdated: '—'
      };
    }

    const ratingSum = allBooks.reduce(
      (sum, book) => sum + (parseFloat(book.rating) || 0),
      0
    );

    const lastUpdated = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      totalBooks: allBooks.length,
      trendingCount: trendingBooks.length,
      newReleaseCount: newReleases.length,
      averageRating: ratingSum ? (ratingSum / allBooks.length).toFixed(1) : '0.0',
      lastUpdated
    };
  }, [allBooks, trendingBooks.length, newReleases.length]);

  const genres = useMemo(() => {
    const genreSet = new Set();
    allBooks.forEach((book) => {
      if (book.genre) {
        genreSet.add(book.genre);
      }
    });
    return ['All', ...Array.from(genreSet).sort()];
  }, [allBooks]);

  const filteredBooks = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return allBooks
      .filter((book) => {
        const matchesQuery =
          !query ||
          book.title?.toLowerCase().includes(query) ||
          book.author?.toLowerCase().includes(query);

        const matchesGenre =
          filters.genre === 'All' || book.genre === filters.genre;

        return matchesQuery && matchesGenre;
      })
      .sort((a, b) => {
        if (filters.sort === 'rating') {
          return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
        }
        if (filters.sort === 'year') {
          return (b.year || 0) - (a.year || 0);
        }
        return a.title.localeCompare(b.title);
      });
  }, [allBooks, filters]);

  const topPerformance = filteredBooks.slice(0, 10);

  const highlightBook = topRated[0] || trendingBooks[0];

  return (
    <div className="admin-page">
      <header className="admin-hero">
        <div>
          <h1>MANGU admin</h1>
          <p>
            Monitor catalog health, surface trends, and take action faster with live insights.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button className="primary">Add new title</button>
          <button>Sync catalog</button>
          <button>Export report</button>
        </div>
      </header>

      {error && <div className="admin-error-banner">{error}</div>}

      <section className="admin-metrics">
        <article className="metric-card">
          <span className="metric-label">Total titles</span>
          <strong className="metric-value">{metrics.totalBooks}</strong>
          <span className="metric-footnote">
            +{formatNumber(metrics.newReleaseCount)} added this month
          </span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Trending spotlight</span>
          <strong className="metric-value">{metrics.trendingCount}</strong>
          <span className="metric-footnote">Audience engagement in the last 30 days</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Average rating</span>
          <strong className="metric-value">{metrics.averageRating}</strong>
          <span className="metric-footnote">Across entire catalog</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Last sync</span>
          <strong className="metric-value">{metrics.lastUpdated}</strong>
          <span className="metric-footnote">Refresh to pull latest data</span>
        </article>
      </section>

      <section className="admin-panels">
        <div className="admin-inventory">
          <div className="inventory-header">
            <div>
              <h2>Catalog performance</h2>
              <p>Track how your titles are performing at a glance.</p>
            </div>
            <div className="inventory-filters">
              <input
                type="search"
                placeholder="Search by title or author"
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, search: event.target.value }))
                }
              />
              <select
                value={filters.genre}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, genre: event.target.value }))
                }
              >
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
              <select
                value={filters.sort}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, sort: event.target.value }))
                }
              >
                <option value="rating">Sort by rating</option>
                <option value="year">Sort by year</option>
                <option value="title">Sort alphabetically</option>
              </select>
            </div>
          </div>

          <div className="inventory-table-wrapper">
            {loading ? (
              <div className="admin-loading">
                <div className="spinner" />
                <p>Syncing catalog intelligence…</p>
              </div>
            ) : (
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Genre</th>
                    <th>Year</th>
                    <th>Rating</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformance.map((book) => (
                    <tr key={book.id}>
                      <td>
                        <div className="table-title">
                          <img src={book.cover} alt={book.title} />
                          <div>
                            <strong>{book.title}</strong>
                            <span>{book.description?.slice(0, 60) || 'No summary available.'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{book.author}</td>
                      <td>{book.genre || '—'}</td>
                      <td>{book.year || '—'}</td>
                      <td>
                        <span className="rating-pill">
                          <i className="fas fa-star"></i> {parseFloat(book.rating || 0).toFixed(1)}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill">
                          {book.rating >= 4.5 ? 'Hot' : 'Monitor'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!topPerformance.length && (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        No titles match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside className="admin-sidebar">
          <div className="admin-highlight">
            <h3>Publisher focus</h3>
            {highlightBook ? (
              <div className="highlight-card">
                <img src={highlightBook.cover} alt={highlightBook.title} />
                <div>
                  <h4>{highlightBook.title}</h4>
                  <p>{highlightBook.author}</p>
                  <span>{highlightBook.genre}</span>
                  <div className="highlight-rating">
                    <i className="fas fa-star"></i>
                    {parseFloat(highlightBook.rating || 0).toFixed(1)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted">Add a title to feature it here.</p>
            )}
          </div>

          <div className="admin-actions">
            <h3>Quick actions</h3>
            <div className="actions-grid">
              {[
                { icon: 'fas fa-plus-circle', label: 'Create campaign' },
                { icon: 'fas fa-upload', label: 'Bulk import' },
                { icon: 'fas fa-users-cog', label: 'Manage authors' },
                { icon: 'fas fa-podcast', label: 'Schedule podcast drop' }
              ].map((action) => (
                <button key={action.label}>
                  <i className={action.icon}></i>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-activity">
            <h3>Recent admin activity</h3>
            <ul>
              {ADMIN_ACTIVITY.map((item) => (
                <li key={item.id}>
                  <div className="activity-icon">
                    <i className={item.icon}></i>
                  </div>
                  <div>
                    <strong>{item.action}</strong>
                    <span>{item.timestamp}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default AdminPage;
