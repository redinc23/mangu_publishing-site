import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../lib/api';
import {
  getFeaturedBook,
  getTrendingBooks,
  getNewReleases
} from '../data/mockBooks';
import { mockAudiobooks } from '../data/mockAudiobooks';

const heroVideo = '/video/laps.mp4';

const formatCurrency = (cents = 0) => `$${(cents / 100).toFixed(2)}`;
const formatRating = (value) => Number(value || 0).toFixed(1);

export default function HomePageV2() {
  const [searchParams] = useSearchParams();
  const [featured, setFeatured] = useState(null);
  const [trending, setTrending] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [showcaseAudio] = useState(mockAudiobooks[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Handle Stripe redirects
    if (searchParams.get('success') === '1') {
      // Show success message (could use a toast/notification system)
      console.log('Payment successful!');
    } else if (searchParams.get('canceled') === '1') {
      // Show cancellation message
      console.log('Payment canceled');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try to load from API, fallback to mock data on error
        const [featuredData, trendingData, newReleasesData] = await Promise.allSettled([
          apiClient.books.featured(),
          apiClient.books.trending({ limit: 6 }),
          apiClient.books.newReleases({ limit: 4 })
        ]);

        // Use API data if successful, otherwise fallback to mock
        setFeatured(
          featuredData.status === 'fulfilled' && featuredData.value
            ? featuredData.value
            : getFeaturedBook()
        );
        
        setTrending(
          trendingData.status === 'fulfilled' && Array.isArray(trendingData.value)
            ? trendingData.value.slice(0, 6)
            : getTrendingBooks(6)
        );
        
        setNewReleases(
          newReleasesData.status === 'fulfilled' && Array.isArray(newReleasesData.value)
            ? newReleasesData.value.slice(0, 4)
            : getNewReleases(4)
        );
      } catch (err) {
        console.warn('API load failed, using mock data:', err);
        setError(err.message);
        // Fallback to mock data
        setFeatured(getFeaturedBook());
        setTrending(getTrendingBooks(6));
        setNewReleases(getNewReleases(4));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading && !featured) {
    return (
      <div className="bg-[#050505] text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] text-white min-h-screen">
      {error && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-4 py-2 text-sm text-center">
          Using offline data. API unavailable: {error}
        </div>
      )}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#050505] via-[#0f111a] to-[#050a2b]">
        <div className="absolute inset-0 opacity-30">
          <video
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            poster={featured?.cover_url}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32 grid md:grid-cols-[1.2fr,0.8fr] gap-12">
          <div>
            <p className="uppercase tracking-[0.4em] text-sm text-white/70 mb-4">
              Beta · Storyverse V2
            </p>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Streaming stories, real data, real vibes.
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mb-8">
              Your main flow is ready: sign in, dive into the library, drill into
              any book, then toss it into the cart. Powered by real APIs with graceful fallback.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/signin"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6b00] to-[#ff3d00] px-6 py-3 text-base font-semibold shadow-lg shadow-[#ff6b0033] transition hover:translate-y-0.5"
              >
                Start at Sign In
                <span aria-hidden>→</span>
              </Link>
              <Link
                to="/library"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white/80 transition hover:border-white hover:text-white"
              >
                Jump to Library
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/80">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/60">
                  Featured Title
                </p>
                <strong className="text-lg">{featured?.title}</strong>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/60">
                  Rating
                </p>
                <strong className="text-lg">
                  {featured?.rating?.toFixed(1)} ·{' '}
                  {featured?.rating_count?.toLocaleString()} voices
                </strong>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/60">
                  Add it to cart for
                </p>
                <strong className="text-lg">
                  {formatCurrency(featured?.price_cents)}
                </strong>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-4">
              Main Flow
            </p>
            <ol className="space-y-4 text-white/90">
              <li className="flex gap-3">
                <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center font-semibold">
                  1
                </span>
                <div>
                  <p className="font-semibold">Sign in (mock)</p>
                  <p className="text-sm text-white/60">
                    Use any email; the demo session will persist locally.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center font-semibold">
                  2
                </span>
                <div>
                  <p className="font-semibold">Browse the Library</p>
                  <p className="text-sm text-white/60">
                    Filter or search mock data, then pick a book card.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center font-semibold">
                  3
                </span>
                <div>
                  <p className="font-semibold">Open any Book</p>
                  <p className="text-sm text-white/60">
                    `/book/:id` renders rich details, library and cart actions.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center font-semibold">
                  4
                </span>
                <div>
                  <p className="font-semibold">Head to the Cart</p>
                  <p className="text-sm text-white/60">
                    The mock cart keeps quantities and totals in memory.
                  </p>
                </div>
              </li>
            </ol>
            <div className="mt-8 rounded-xl border border-white/15 p-4 text-sm text-white/70">
              <p className="font-semibold mb-1 text-white">
                Bonus Routes
              </p>
              <p>
                `/profile` mirrors the signed-in state, `/audiobooks/audio-1`
                showcases the player, and `/admin` highlights the dashboard cards.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 space-y-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">Tonight&apos;s Picks</h2>
          <Link to="/library" className="text-sm text-white/70 hover:text-white">
            Browse the library →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {trending.map((book) => (
            <Link
              key={book.id}
              to={`/book/${book.id}`}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-white/30"
            >
              <div className="flex gap-4">
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="h-32 w-24 rounded-xl object-cover"
                  loading="lazy"
                />
                <div className="flex flex-col">
                  <p className="text-sm uppercase tracking-wide text-white/50">
                    {book.categories?.[0] || 'Featured'}
                  </p>
                  <h3 className="text-lg font-semibold">{book.title}</h3>
                  <p className="text-white/70 text-sm mt-1">
                    By {book.authors?.map((a) => a.name).join(', ')}
                  </p>
                  <p className="mt-auto text-sm text-white/60">
                  {formatRating(book.rating)} ·{' '}
                    {book.view_count.toLocaleString()} views
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                <span>Tap to open the details</span>
                <span aria-hidden>↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10 grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Fresh drops</h2>
            <Link to="/library" className="text-sm text-white/70 hover:text-white">
              view all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {newReleases.map((book) => (
              <article
                key={book.id}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <p className="text-xs uppercase tracking-wide text-white/50">
                  New release
                </p>
                <h3 className="text-lg font-semibold mt-1">{book.title}</h3>
                <p className="text-white/70 text-sm">
                  {book.authors?.[0]?.name}
                </p>
                <p className="text-sm text-white/50 mt-1">
                  {book.description
                    ? `${book.description.slice(0, 90)}…`
                    : 'Preview more details inside the book view.'}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                  <span>{formatCurrency(book.price_cents)}</span>
                  <Link
                    to={`/book/${book.id}`}
                    className="text-white hover:underline"
                  >
                    Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#090909] p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Audiobook studio
          </p>
          <h2 className="text-3xl font-semibold mt-2 mb-4">
            {showcaseAudio.title}
          </h2>
          <p className="text-white/70 mb-4">
            Narrated by {showcaseAudio.narrator} ·{' '}
            {Math.round(showcaseAudio.duration_seconds / 3600)} hrs
          </p>
          <div className="flex items-center gap-3 text-sm text-white/60 mb-6">
            <span>⭐ {formatRating(showcaseAudio.rating)}</span>
            <span>·</span>
            <span>
              {(showcaseAudio.rating_count ?? 0).toLocaleString()} listeners
            </span>
          </div>
          <Link
            to={`/audiobooks/${showcaseAudio.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/20"
          >
            Launch the audio player
            <span aria-hidden>▶</span>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-white/60 uppercase tracking-wide">
                Sign-in →
              </p>
              <p className="text-white text-lg font-semibold">
                `/signin`
              </p>
            </div>
            <div>
              <p className="text-sm text-white/60 uppercase tracking-wide">
                Library →
              </p>
              <p className="text-white text-lg font-semibold">
                `/library`
              </p>
            </div>
            <div>
              <p className="text-sm text-white/60 uppercase tracking-wide">
                Book & Cart →
              </p>
              <p className="text-white text-lg font-semibold">
                `/book/:id` · `/cart`
              </p>
            </div>
          </div>
          <p className="text-white/70 text-sm mt-6">
            Powered by real APIs with graceful fallback to mock data. All data loads from the backend when available.
          </p>
        </div>
      </section>
    </div>
  );
}

