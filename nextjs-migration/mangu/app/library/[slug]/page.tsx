import Nav from '@/components/Nav';

type BookFormat = {
  name: string;
  detail: string;
  price: string;
};

type BookReview = {
  author: string;
  date: string;
  rating: number;
  quote: string;
};

type RelatedBook = {
  title: string;
  cover: string;
};

type AuthorMeta = {
  name: string;
  avatar: string;
  bio: string;
  stats: { label: string; value: string }[];
  socials: { icon: string; label: string }[];
};

type BookDetail = {
  slug: string;
  title: string;
  subtitle: string;
  badge?: string;
  cover: string;
  heroBackdrop: string;
  rating: number;
  reviews: string;
  pages: number;
  language: string;
  genre: string;
  synopsis: string[];
  formats: BookFormat[];
  audiobook: {
    duration: string;
    sampleChapter: string;
    currentTime: string;
    totalTime: string;
  };
  trailer: {
    image: string;
    blurb: string;
  };
  reviewsList: BookReview[];
  author: AuthorMeta;
  related: RelatedBook[];
};

const BOOKS: BookDetail[] = [
  {
    slug: 'whispers-in-the-shadow',
    title: 'Whispers in the Shadow',
    subtitle:
      'A hypnotic psychological thriller where whispers wrap around you like fog and nothing is quite what it seems.',
    badge: "Editor’s Pick",
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
    heroBackdrop: 'https://images.unsplash.com/photo-1535025639604-9a804c092faa?auto=format&fit=crop&w=1400&q=80',
    rating: 4.8,
    reviews: '12.4k reviews',
    pages: 432,
    language: 'English',
    genre: 'Psychological Thriller',
    synopsis: [
      'In the rain-soaked streets of London, a series of inexplicable disappearances has left Scotland Yard baffled. Renowned psychologist Dr. Evelyn Shaw is called in to consult on the case, only to discover that the victims all share a common thread—they were last seen whispering to shadows.',
      'As Dr. Shaw delves deeper into the mystery, she finds herself drawn into a world where reality blurs with nightmare. The whispers begin to follow her, revealing fragments of a truth too terrifying to comprehend.',
      '“Whispers in the Shadow” explores the fragile boundary between sanity and madness, and the darkness that lurks just beyond the edge of perception.'
    ],
    formats: [
      { name: 'Hardcover', detail: 'Premium edition with foil-stamped dust jacket', price: '$24.99' },
      { name: 'eBook', detail: 'Instant download · EPUB, MOBI, PDF', price: '$12.99' },
      { name: 'Audiobook', detail: 'Narrated by Alexandra Rivers', price: '$19.99' }
    ],
    audiobook: {
      duration: '15m 42s remaining',
      sampleChapter: 'Chapter 3 · The First Clue',
      currentTime: '02:15',
      totalTime: '18:00'
    },
    trailer: {
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      blurb:
        'Experience the cinematic book trailer directed by Michael Vance—neon rain, impossible silhouettes, and a score that hums with dread.'
    },
    reviewsList: [
      {
        author: 'Sarah Johnson',
        date: 'June 15, 2024',
        rating: 5,
        quote:
          'I couldn’t put this book down! The atmosphere is electric and the psychological depth is exceptional. The ending still haunts me.'
      },
      {
        author: 'Michael Chen',
        date: 'July 9, 2024',
        rating: 4,
        quote:
          'Alexandra Rivers crafts tension like no one else. The audiobook is a masterclass in immersive narration.'
      }
    ],
    author: {
      name: 'Alexandra Rivers',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=320&q=80',
      bio:
        'Alexandra Rivers is an award-winning author of psychological thrillers. With a background in clinical psychology, her work explores the liminal spaces between perception and reality. She lives in Edinburgh with her husband and two cats.',
      stats: [
        { label: 'Books', value: '12' },
        { label: 'Avg. Rating', value: '4.7' },
        { label: 'Followers', value: '183k' }
      ],
      socials: [
        { icon: '🐦', label: 'Twitter' },
        { icon: '📸', label: 'Instagram' },
        { icon: '📚', label: 'Goodreads' },
        { icon: '🌐', label: 'Website' }
      ]
    },
    related: [
      {
        title: 'The Silent Echo',
        cover: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'Midnight Whispers',
        cover: 'https://images.unsplash.com/photo-1536746803623-cef87080c7b2?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'Shadow Games',
        cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'The Forgotten Room',
        cover: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=400&q=80'
      }
    ]
  },
  {
    slug: 'the-silent-echo',
    title: 'The Silent Echo',
    subtitle: 'A lyrical techno-thriller that vibrates with neon suspense and orchestral intrigue.',
    badge: 'Bestseller',
    cover: 'https://images.unsplash.com/photo-1536746803623-cef87080c7b2?auto=format&fit=crop&w=600&q=80',
    heroBackdrop: 'https://images.unsplash.com/photo-1451186859696-371d9477be93?auto=format&fit=crop&w=1400&q=80',
    rating: 4.6,
    reviews: '8.1k reviews',
    pages: 388,
    language: 'English',
    genre: 'Cyberpunk Mystery',
    synopsis: [
      'A disgraced sound engineer discovers a hidden frequency embedded in the city’s electrical grid. The more she listens, the faster reality fractures.',
      'Her search for answers leads beneath the subway, above the skyline, and into the heart of a conspiracy that can be heard long before it is seen.'
    ],
    formats: [
      { name: 'Hardcover', detail: 'Spot UV jacket with schematics', price: '$26.99' },
      { name: 'Paperback', detail: 'Matte finish · Bonus interview', price: '$18.99' },
      { name: 'Audiobook', detail: 'Sound designed by the author', price: '$22.99' }
    ],
    audiobook: {
      duration: '08m 21s remaining',
      sampleChapter: 'Chapter 2 · Resonance',
      currentTime: '04:09',
      totalTime: '12:30'
    },
    trailer: {
      image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80',
      blurb: 'Dive into a neon-drenched trailer scored with original synth compositions. Every frame pulses with the rhythm of the city.'
    },
    reviewsList: [
      {
        author: 'Lena Duarte',
        date: 'May 28, 2024',
        rating: 5,
        quote: 'Sound design as plot device has never been this electric. I finished it and had to sit in silence for an hour.'
      },
      {
        author: 'Theo Marshall',
        date: 'June 02, 2024',
        rating: 4,
        quote: 'A blaring, brilliant mystery that hums with danger. The hardcover edition is gorgeous.'
      }
    ],
    author: {
      name: 'Rin Okoye',
      avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80',
      bio:
        'Rin Okoye writes speculative thrillers about the future of sound. A former audio engineer, she now blends immersive storytelling with experimental music theory.',
      stats: [
        { label: 'Books', value: '6' },
        { label: 'Avg. Rating', value: '4.6' },
        { label: 'Followers', value: '92k' }
      ],
      socials: [
        { icon: '🐦', label: 'Twitter' },
        { icon: '🎧', label: 'SoundCloud' },
        { icon: '📺', label: 'YouTube' }
      ]
    },
    related: [
      {
        title: 'Resonance Field',
        cover: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'Midnight Network',
        cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80'
      },
      {
        title: 'City of Frequencies',
        cover: 'https://images.unsplash.com/photo-1558901601-0c3d3be40cd4?auto=format&fit=crop&w=400&q=80'
      }
    ]
  }
];

function findBook(slug: string): BookDetail {
  return BOOKS.find((book) => book.slug === slug) ?? BOOKS[0];
}

export default function BookDetailPage({ params }: { params: { slug: string } }) {
  const book = findBook(decodeURIComponent(params.slug));

  return (
    <main className="relative min-h-screen bg-[#070707] text-white">
      <Nav />

      <div className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
          style={{ backgroundImage: `url(${book.heroBackdrop})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070707] via-[#070707]/95 to-[#070707]" />

        <section className="relative z-10 mx-auto max-w-[1400px] px-[4%] pt-32 pb-16">
          <div className="flex flex-wrap items-start justify-between gap-10">
            <div className="max-w-[620px] space-y-6">
              {book.badge ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[13px] uppercase tracking-[0.25em] text-white/80">
                  ✨ {book.badge}
                </span>
              ) : null}
              <h1 className="text-4xl font-semibold leading-tight md:text-6xl">{book.title}</h1>
              <p className="text-base text-white/70 md:text-lg">{book.subtitle}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  ⭐ {book.rating.toFixed(1)} <span className="text-white/50">({book.reviews})</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">📄 {book.pages} pages</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">🌍 {book.language}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">🏷️ {book.genre}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-1 hover:bg-orange-600">
                  🛒 Add to Cart
                </button>
                <button className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:-translate-y-1 hover:bg-white/10">
                  ❤️ Wishlist
                </button>
                <button className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:-translate-y-1 hover:bg-white/10">
                  🔁 Share
                </button>
                <button className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:-translate-y-1 hover:bg-cyan-400">
                  ▶ Sample
                </button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_25px_70px_rgba(0,0,0,0.5)]">
              <img src={book.cover} alt={`${book.title} cover`} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
              <button className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition hover:opacity-100">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-2xl font-semibold text-black shadow-lg">▶</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="relative z-10 mx-auto max-w-[1400px] px-[4%] pb-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-12">
            <div className="rounded-2xl border border-white/10 bg-[#111]/85 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <h2 className="mb-6 text-xl font-semibold">Choose your format</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {book.formats.map((format) => (
                  <div
                    key={format.name}
                    className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-[2px] hover:border-orange-400/70 hover:bg-white/10"
                  >
                    <div className="text-sm font-semibold text-white">{format.name}</div>
                    <p className="mt-2 text-sm text-white/60">{format.detail}</p>
                    <div className="mt-4 text-lg font-bold text-orange-400">{format.price}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#101010]/85 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">Listen to a sample</h3>
                  <p className="text-sm text-white/60">{book.audiobook.sampleChapter}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                  ⏱️ {book.audiobook.duration}
                </span>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6">
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg transition hover:bg-white/20">«</button>
                <button className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-3xl text-black shadow-lg transition hover:bg-orange-400">
                  ▶
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg transition hover:bg-white/20">»</button>
              </div>
              <div className="mt-8 h-[6px] w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500" />
              </div>
              <div className="mt-3 flex justify-between text-xs text-white/60">
                <span>{book.audiobook.currentTime}</span>
                <span>{book.audiobook.totalTime}</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101010]/90 shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
              <div className="flex flex-col gap-6 p-8 lg:flex-row">
                <div className="relative flex-1 overflow-hidden rounded-xl">
                  <img
                    src={book.trailer.image}
                    alt="Book trailer artwork"
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />
                  <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-3xl text-black shadow-lg">▶</span>
                  </button>
                </div>
                <div className="flex-1 space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/60">
                    exclusive trailer
                  </div>
                  <h3 className="text-2xl font-semibold">Official Book Trailer</h3>
                  <p className="text-sm leading-relaxed text-white/70">{book.trailer.blurb}</p>
                  <div className="flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:-translate-y-[2px] hover:bg-white/10">
                      📺 Watch on YouTube
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:-translate-y-[2px] hover:bg-white/10">
                      ⬇️ Download HD
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">Synopsis</h2>
              <div className="space-y-5 text-base leading-relaxed text-white/70">
                {book.synopsis.map((paragraph, index) => (
                  <p key={index} className="transition hover:text-white">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold">Reader Reviews</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {book.reviewsList.map((review) => (
                  <div
                    key={review.author}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]/85 p-6 transition hover:-translate-y-1 hover:border-orange-400/60 hover:bg-[#131313]"
                  >
                    <div className="absolute -top-12 right-4 text-[140px] font-serif text-white/5">“</div>
                    <div className="mb-4 flex items-center justify-between text-sm text-white/60">
                      <span className="text-white/90">{review.author}</span>
                      <span>{review.date}</span>
                    </div>
                    <div className="mb-4 flex items-center gap-1 text-orange-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-white/70">{review.quote}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">Readers also enjoyed</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {book.related.map((related) => (
                  <a
                    key={related.title}
                    href={`/library/${encodeURIComponent(related.title.toLowerCase().replace(/\s+/g, '-'))}`}
                    className="group relative overflow-hidden rounded-xl"
                  >
                    <img
                      src={related.cover}
                      alt={`${related.title} cover`}
                      className="h-[260px] w-full rounded-xl object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex translate-y-4 items-end justify-between bg-gradient-to-t from-black via-black/60 to-transparent p-4 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                      <span className="text-sm font-semibold text-white">{related.title}</span>
                      <span className="text-2xl text-orange-400">→</span>
                    </div>
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg border-l-4 border-orange-400 bg-white/5 px-4 py-3 text-sm text-white/70">
                💡 Recommendations update dynamically based on your reading history.
              </div>
            </section>
          </div>

          <aside className="h-full space-y-6 rounded-2xl border border-white/10 bg-[#0d0d0d]/90 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-4">
              <img
                src={book.author.avatar}
                alt={book.author.name}
                className="h-20 w-20 rounded-full border-2 border-orange-400 object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold">{book.author.name}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/60">
                  {book.author.stats.map((stat) => (
                    <span key={stat.label} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                      <span className="text-orange-400">{stat.value}</span> {stat.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button className="w-full rounded-md border border-orange-500 bg-orange-500 px-4 py-2 text-sm font-semibold text-black transition hover:-translate-y-[2px] hover:bg-orange-400">
              ➕ Follow Author
            </button>
            <p className="text-sm leading-relaxed text-white/65">{book.author.bio}</p>
            <div className="flex flex-wrap gap-3">
              {book.author.socials.map((social) => (
                <button
                  key={social.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:-translate-y-[1px] hover:border-orange-400 hover:text-white"
                >
                  <span>{social.icon}</span>
                  {social.label}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

