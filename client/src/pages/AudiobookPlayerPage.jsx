import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getAudiobookById,
  mockAudiobooks,
  formatDuration
} from '../data/mockAudiobooks';
import { getBookById } from '../data/mockBooks';

const SAMPLE_AUDIO =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
const formatRating = (value) => Number(value || 0).toFixed(1);

export default function AudiobookPlayerPage() {
  const { audioId } = useParams();
  const navigate = useNavigate();
  const audiobook = getAudiobookById(audioId) || mockAudiobooks[0];
  const relatedBook = getBookById(audiobook.book_id);
  const initialChapter =
    audiobook?.chapters?.[0] ?? {
      id: 'preview',
      title: 'Preview mix',
      duration: audiobook.duration_seconds || 0,
      start_time: 0
    };
  const [activeChapter, setActiveChapter] = useState(initialChapter);

  const chapters = useMemo(() => audiobook.chapters ?? [initialChapter], [
    audiobook,
    initialChapter
  ]);

  return (
    <div className="min-h-screen bg-[#030303] text-white px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Audiobook player
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">{audiobook.title}</h1>
            <p className="text-white/70 text-sm mt-2">
              Narrated by {audiobook.narrator} ·{' '}
              {formatDuration(audiobook.duration_seconds)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-white/70">
            <button
              type="button"
              onClick={() => navigate(`/book/${audiobook.book_id}`)}
              className="rounded-full border border-white/20 px-4 py-2 text-white/80 hover:text-white"
            >
              View matching book
            </button>
            <Link
              to="/library"
              className="rounded-full bg-white/10 px-4 py-2 font-semibold hover:bg-white/20"
            >
              Back to library
            </Link>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6 space-y-6">
            <div className="flex flex-col gap-5 md:flex-row">
              <img
                src={audiobook.cover_url}
                alt={audiobook.title}
                className="h-52 w-40 rounded-2xl object-cover shadow-2xl"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">{activeChapter.title}</h2>
                <p className="text-white/70 text-sm mt-2">
                  Chapter length · {formatDuration(activeChapter.duration)}
                </p>
                <audio
                  key={activeChapter.id}
                  controls
                  className="mt-6 w-full rounded-xl bg-black/40"
                >
                  <source src={SAMPLE_AUDIO} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <p className="text-xs text-white/50 mt-3">
                  Audio is a shared sample. Switching chapters updates the UI,
                  demonstrating the experience.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => setActiveChapter(chapter)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    activeChapter.id === chapter.id
                      ? 'border-white/50 bg-white/10'
                      : 'border-white/10 bg-black/30 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{chapter.title}</span>
                    <span className="text-white/60">
                      {formatDuration(chapter.duration)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-black/40 p-6 space-y-5">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Linked book
            </p>
            {relatedBook ? (
              <div className="space-y-4">
                <img
                  src={relatedBook.cover_url}
                  alt={relatedBook.title}
                  className="h-60 w-full rounded-2xl object-cover"
                />
                <div>
                  <h3 className="text-2xl font-semibold">{relatedBook.title}</h3>
                  <p className="text-white/70 text-sm">
                    {relatedBook.authors?.map((a) => a.name).join(', ')}
                  </p>
                  <p className="text-white/60 text-sm mt-3">
                    Rating · {formatRating(relatedBook.rating)} (
                    {(relatedBook.rating_count ?? 0).toLocaleString()} reviews)
                  </p>
                  <div className="flex gap-3 mt-4">
                    <Link
                      to={`/book/${relatedBook.id}`}
                      className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                    >
                      Open details
                    </Link>
                    <Link
                      to="/cart"
                      className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white"
                    >
                      Check cart
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white/70 text-sm">
                No linked book found. Double-check the mock data id.
              </p>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              <p className="font-semibold text-white">Route reminder</p>
              <p className="mt-1">
                You&apos;re on <code className="bg-black/40 px-2 py-1 rounded">/audiobooks/{audiobook.id}</code>. Use the Header or the cards to prove the route is alive.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

