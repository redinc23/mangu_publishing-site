import React from 'react';
import { Link } from 'react-router-dom';
import { mockBooks } from '../data/mockBooks';
import { mockAudiobooks } from '../data/mockAudiobooks';

const formatCurrency = (cents = 0) => `$${(cents / 100).toFixed(2)}`;

export default function AdminDashboardPage() {
  const totalBooks = mockBooks.length;
  const featuredBooks = mockBooks.filter((book) => book.is_featured).length;
  const audiobookCount = mockAudiobooks.length;
  const avgRating =
    mockBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / totalBooks;

  const topBooks = [...mockBooks]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#020202] text-white px-6 py-16">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Admin dashboard
            </p>
            <h1 className="text-4xl font-bold mt-2">
              V2 telemetry at a glance.
            </h1>
            <p className="text-white/70 mt-2 max-w-2xl">
              Everything on this page is powered by the same mock data as the
              end-user experience, making it obvious that we have a stable,
              demo-friendly loop without touching the backend.
            </p>
          </div>
          <Link
            to="/library"
            className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/20"
          >
            Back to consumer view
          </Link>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Books tracked" value={totalBooks} />
          <StatCard label="Featured slots" value={featuredBooks} />
          <StatCard label="Audiobooks live" value={audiobookCount} />
          <StatCard
            label="Avg. rating"
            value={avgRating.toFixed(1)}
            helper="Mock aggregate"
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Top performing titles</h2>
            <Link to="/book/1" className="text-sm text-white/70 hover:text-white">
              Inspect any book →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/80">
              <thead className="text-white/60 text-xs uppercase tracking-wide">
                <tr>
                  <th className="py-3 pr-4">Title</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Views</th>
                  <th className="py-3 pr-4">Rating</th>
                  <th className="py-3 pr-4">Price</th>
                </tr>
              </thead>
              <tbody>
                {topBooks.map((book) => (
                  <tr key={book.id} className="border-t border-white/5">
                    <td className="py-4 pr-4">
                      <Link
                        to={`/book/${book.id}`}
                        className="font-semibold text-white hover:underline"
                      >
                        {book.title}
                      </Link>
                      <p className="text-xs text-white/50">
                        By {book.authors?.map((a) => a.name).join(', ')}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      {book.categories?.slice(0, 2).join(', ')}
                    </td>
                    <td className="py-4 pr-4">{book.view_count.toLocaleString()}</td>
                    <td className="py-4 pr-4">{book.rating.toFixed(1)}</td>
                    <td className="py-4 pr-4">{formatCurrency(book.price_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-green-500/10 to-blue-500/10 p-6 space-y-4 mb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">📊 Analytics Dashboard</h2>
            <Link
              to="/admin/analytics"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
            >
              View Analytics →
            </Link>
          </div>
          <p className="text-white/70">
            Track platform metrics, revenue, user activity, and top-performing content in real-time.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 space-y-4">
          <h2 className="text-2xl font-semibold">Route checklist</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { path: '/', status: 'new HomePageV2', description: 'Hero, flow map, trending' },
              { path: '/library', status: 'grid ready', description: 'Filters + search on mock data' },
              { path: '/book/:id', status: 'details stable', description: 'Tabs, add-to-cart, add-to-library' },
              { path: '/cart', status: 'mock cart', description: 'Local storage cart w/ totals' },
              { path: '/profile', status: 'reads session', description: 'Uses Zustand store' },
              { path: '/audiobooks/audio-1', status: 'player ready', description: 'Chapters + CTA back to book' },
              { path: '/admin', status: 'you are here', description: 'High-level counters' },
              { path: '/admin/analytics', status: 'NEW', description: 'Real-time metrics & performance' },
              { path: '/signin', status: 'entry point', description: 'Mock auth + redirect' }
            ].map((item) => (
              <div
                key={item.path}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80"
              >
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                  {item.status}
                </p>
                <p className="text-lg font-semibold text-white mt-1">{item.path}</p>
                <p className="mt-2">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.4em] text-white/60">{label}</p>
      <p className="text-4xl font-bold mt-2">{value}</p>
      {helper && <p className="text-xs text-white/50 mt-1">{helper}</p>}
    </div>
  );
}

