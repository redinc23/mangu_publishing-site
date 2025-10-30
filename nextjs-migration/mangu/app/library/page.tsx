'use client';

import Nav from '@/components/Nav';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Book = {
  title: string;
  author: string;
  category: string;
  rating: number;
  badge?: string;
  cover: string;
  hasTrailer: boolean;
};

const BOOKS_DATA: Book[] = [
  {
    title: 'Echoes of Tomorrow',
    author: 'Eleanor Vance',
    category: 'Sci-Fi',
    rating: 4.9,
    badge: 'Bestseller',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
    hasTrailer: true
  },
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    category: 'Fantasy',
    rating: 4.8,
    badge: 'New Release',
    cover: 'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?auto=format&fit=crop&w=400&q=80',
    hasTrailer: true
  },
  {
    title: 'Silent Whispers',
    author: 'Isabella Rossi',
    category: 'Mystery',
    rating: 4.7,
    badge: 'Trending',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
    hasTrailer: true
  },
  {
    title: 'Beyond the Horizon',
    author: 'Marcus Chen',
    category: 'Adventure',
    rating: 4.6,
    badge: "Editor's Pick",
    cover: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=400&q=80',
    hasTrailer: false
  },
  {
    title: 'The Art of Letting Go',
    author: 'Sophie Williams',
    category: 'Self-Help',
    rating: 4.5,
    badge: '',
    cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=400&q=80',
    hasTrailer: true
  },
  {
    title: 'Crimson Skies',
    author: 'Alexander Grant',
    category: 'Historical',
    rating: 4.8,
    badge: 'Award Winner',
    cover: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=400&q=80',
    hasTrailer: true
  },
  {
    title: 'Digital Dreams',
    author: 'Alex Thompson',
    category: 'Cyberpunk',
    rating: 4.4,
    badge: '',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=400&q=80',
    hasTrailer: true
  },
  {
    title: "Ocean's Heart",
    author: 'Marina Blue',
    category: 'Romance',
    rating: 4.7,
    badge: 'Trending',
    cover: 'https://images.unsplash.com/photo-1507525428034-b723a9ce6899?auto=format&fit=crop&w=400&q=80',
    hasTrailer: false
  },
  {
    title: 'Forest of Shadows',
    author: 'Oliver Queen',
    category: 'Fantasy',
    rating: 4.9,
    badge: 'New Release',
    cover: 'https://images.unsplash.com/photo-1506260405121-e77d8a6e2b7a?auto=format&fit=crop&w=400&q=80',
    hasTrailer: true
  },
  {
    title: 'The Last Light',
    author: 'Emma Stone',
    category: 'Post-Apocalyptic',
    rating: 4.3,
    badge: '',
    cover: 'https://images.unsplash.com/photo-1554757380-2fb69b9c4549?auto=format&fit=crop&w=400&q=80',
    hasTrailer: true
  }
];

function getRandomBooks(count: number): Book[] {
  const shuffled = [...BOOKS_DATA].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function LibraryPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [aiToggle, setAiToggle] = useState('For You');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1740&q=80',
      badge: "Editor's Pick",
      badgeIcon: '👑',
      title: 'Echoes of Tomorrow',
      rating: 4.9,
      year: '2023',
      genres: ['Sci-Fi', 'Thriller', 'Mystery'],
      description: 'A breathtaking sci-fi epic that explores the boundaries of time and consciousness. Winner of the Hugo Award.'
    },
    {
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1740&q=80',
      badge: 'Trending Now',
      badgeIcon: '🔥',
      title: 'The Midnight Library',
      rating: 4.8,
      year: '2023',
      genres: ['Fantasy', 'Philosophy'],
      description: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.'
    },
    {
      image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=1740&q=80',
      badge: 'Award Winner',
      badgeIcon: '🏆',
      title: 'Beyond the Horizon',
      rating: 4.7,
      year: '2023',
      genres: ['Adventure', 'Mystery'],
      description: 'An epic journey across uncharted lands where ancient secrets await discovery. Winner of the National Book Award.'
    }
  ];

  const progressBooks = [
    { title: 'Echoes of Tomorrow', author: 'Eleanor Vance', cover: BOOKS_DATA[0].cover, progress: 65 },
    { title: 'The Midnight Library', author: 'Matt Haig', cover: BOOKS_DATA[1].cover, progress: 42 },
    { title: 'Silent Whispers', author: 'Isabella Rossi', cover: BOOKS_DATA[2].cover, progress: 78 }
  ];

  const authors = [
    {
      name: 'Eleanor Vance',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&q=80',
      books: '12 Books • Sci-Fi & Fantasy',
      bio: 'Award-winning author known for her imaginative worlds and complex characters.'
    },
    {
      name: 'Isabella Rossi',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=500&q=80',
      books: '8 Books • Mystery & Thriller',
      bio: 'Master of suspense with multiple bestsellers and a dedicated global following.'
    },
    {
      name: 'Marcus Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
      books: '6 Books • Adventure & Historical',
      bio: 'Brings history to life with meticulously researched and vividly told stories.'
    },
    {
      name: 'Sophie Williams',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=500&q=80',
      books: '10 Books • Self-Help & Psychology',
      bio: 'Helps readers navigate life\'s challenges with wisdom and practical advice.'
    }
  ];

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 bg-[#0a0a0a]">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at top left, rgba(30, 58, 138, 0.15) 0%, transparent 50%),
                         radial-gradient(ellipse at bottom right, rgba(6, 78, 59, 0.15) 0%, transparent 50%),
                         radial-gradient(ellipse at center, rgba(59, 130, 246, 0.08) 0%, transparent 70%)`
          }}
        />
      </div>

      <Nav />

      {/* Hero Carousel */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden mb-5">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            <div className="absolute bottom-[20%] left-[5%] max-w-[600px] z-10">
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500 px-4 py-2 rounded-full text-sm font-semibold text-yellow-500 mb-6 backdrop-blur-md">
                <span>{slide.badgeIcon}</span>
                {slide.badge}
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight drop-shadow-lg">
                {slide.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                  ⭐ {slide.rating}
                </div>
                <div className="text-gray-400 font-medium">{slide.year}</div>
                <div className="flex gap-2 flex-wrap">
                  {slide.genres.map((genre) => (
                    <span key={genre} className="bg-white/10 px-3 py-1 rounded-full text-xs text-gray-300">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-lg text-gray-300 mb-6 max-w-[500px] drop-shadow-md">
                {slide.description}
              </p>
              <div className="flex gap-4">
                <button className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 px-8 py-3 rounded text-white font-bold text-base transition-transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/50">
                  ▶ Watch Trailer
                </button>
                <button className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl px-8 py-3 rounded text-white font-semibold text-base transition-colors hover:bg-white/30">
                  ➕ My List
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentSlide ? 'bg-yellow-500 scale-125' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Filter System */}
      <section className="px-[4%] py-8 bg-[#121212] rounded-lg mb-10">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold">Find Your Next Read</h3>
          <button className="text-blue-400 text-sm hover:text-yellow-500 transition-colors">Reset Filters</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm text-gray-400">Genre</label>
            <select className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-white/10 rounded text-white text-sm focus:border-yellow-500 focus:outline-none">
              <option>All Genres</option>
              <option>Fantasy</option>
              <option>Sci-Fi</option>
              <option>Mystery</option>
              <option>Romance</option>
              <option>Historical</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm text-gray-400">Mood</label>
            <select className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-white/10 rounded text-white text-sm focus:border-yellow-500 focus:outline-none">
              <option>Any Mood</option>
              <option>Lighthearted</option>
              <option>Dark</option>
              <option>Thought-provoking</option>
              <option>Exciting</option>
              <option>Relaxing</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm text-gray-400">Length</label>
            <select className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-white/10 rounded text-white text-sm focus:border-yellow-500 focus:outline-none">
              <option>Any Length</option>
              <option>Short (under 200 pages)</option>
              <option>Medium (200-400 pages)</option>
              <option>Long (400-600 pages)</option>
              <option>Epic (600+ pages)</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm text-gray-400">Rating</label>
            <input type="range" min="0" max="5" step="0.5" defaultValue="4" className="w-full h-1 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-yellow-500" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>4.0+</span>
              <span>5</span>
            </div>
          </div>
        </div>
        <button className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 px-6 py-3 rounded text-white font-semibold transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/50">
          Apply Filters
        </button>
      </section>

      {/* Reading Progress Section */}
      <section className="px-[4%] py-8 bg-[#121212] rounded-lg mb-10">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold">Continue Reading</h2>
          <Link href="#" className="text-gray-400 text-sm hover:text-yellow-500 transition-colors">View All</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {progressBooks.map((book) => (
            <div key={book.title} className="flex gap-4 bg-[#1a1a1a] rounded-lg overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-xl">
              <img src={book.cover} alt={book.title} className="w-20 h-32 object-cover" />
              <div className="flex-1 p-4">
                <h3 className="text-base font-bold mb-1">{book.title}</h3>
                <p className="text-sm text-gray-400 mb-3">{book.author}</p>
                <div className="h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 rounded-full"
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400">{book.progress}% Complete</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Netflix Style Rows */}
      <BookRow title="Trending Now" books={getRandomBooks(8)} />
      <BookRow title="New Releases" books={getRandomBooks(6)} />
      <BookRow title="Because You Read Fantasy" books={getRandomBooks(7)} />

      {/* AI Recommendation Section */}
      <section className="px-[4%] py-16 bg-[#121212] rounded-lg mb-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='circuit' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='10' cy='10' r='1' fill='rgba(59,130,246,0.1)' /%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23circuit)' /%3E%3C/svg%3E")`
        }} />
        <div className="relative z-10 text-center mb-10">
          <h2 className="text-3xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 bg-clip-text text-transparent">
            AI-Powered Recommendations
          </h2>
          <p className="text-gray-400 max-w-[600px] mx-auto">Our magical algorithm finds books tailored just for you</p>
        </div>
        <div className="flex justify-center mb-8 gap-0">
          {['For You', 'Popular', 'Hidden Gems'].map((option) => (
            <button
              key={option}
              onClick={() => setAiToggle(option)}
              className={`px-5 py-2.5 border border-white/10 transition-all ${
                aiToggle === option
                  ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white border-transparent'
                  : 'bg-transparent text-gray-400 hover:text-white'
              } ${option === 'For You' ? 'rounded-l' : option === 'Hidden Gems' ? 'rounded-r' : ''}`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="relative z-10">
          <BookRow books={getRandomBooks(5)} hideTitle />
        </div>
      </section>

      {/* Featured Authors Section */}
      <section className="px-[4%] py-16 mb-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 bg-clip-text text-transparent">
            Featured Authors
          </h2>
          <p className="text-gray-400 max-w-[600px] mx-auto">Discover the brilliant minds behind your favorite stories</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {authors.map((author) => (
            <div key={author.name} className="bg-[#121212] rounded-lg p-8 text-center transition-transform hover:-translate-y-2 hover:shadow-xl">
              <img src={author.avatar} alt={author.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-orange-500 object-cover" />
              <h3 className="text-xl font-bold mb-1">{author.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{author.books}</p>
              <p className="text-sm text-gray-400 mb-4 line-clamp-3">{author.bio}</p>
              <button className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 px-4 py-2 rounded-full text-white font-semibold text-sm transition-transform hover:scale-105">
                Follow
              </button>
            </div>
          ))}
        </div>
      </section>

      <BookRow title="Award Winners" books={getRandomBooks(6)} />

      {/* Book Collections Section */}
      <section className="px-[4%] py-16 mb-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-500 bg-clip-text text-transparent">
            Curated Collections
          </h2>
          <p className="text-gray-400 max-w-[600px] mx-auto">Handpicked books organized by themes and moods</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Mind-Bending Sci-Fi', count: '24 Books', image: heroSlides[0].image },
            { title: 'Epic Fantasy Worlds', count: '32 Books', image: heroSlides[1].image },
            { title: 'Gripping Mysteries', count: '18 Books', image: heroSlides[2].image }
          ].map((collection) => (
            <div
              key={collection.title}
              className="relative h-[200px] rounded-lg overflow-hidden transition-transform hover:-translate-y-2 hover:shadow-xl group cursor-pointer"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${collection.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-xl font-bold mb-1">{collection.title}</h3>
                <p className="text-sm text-gray-400">{collection.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <BookRow title="Staff Picks" books={getRandomBooks(5)} />
    </main>
  );
}

function BookRow({ title, books, hideTitle }: { title?: string; books: Book[]; hideTitle?: boolean }) {
  return (
    <div className="mb-10">
      {!hideTitle && title && (
        <div className="flex justify-between items-center mb-4 px-[4%]">
          <h2 className="text-2xl font-bold">{title}</h2>
          <Link href="#" className="text-gray-400 text-sm hover:text-yellow-500 transition-colors">See All</Link>
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto px-[4%] pb-3 scrollbar-hide">
        {books.map((book) => (
          <BookCard key={`${book.title}-${Math.random()}`} book={book} />
        ))}
      </div>
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/library/${encodeURIComponent(book.title.toLowerCase().replace(/\s+/g, '-'))}`}
      className="relative min-w-[220px] h-[330px] rounded overflow-hidden bg-[#1a1a1a] border border-white/10 transition-all flex-shrink-0 cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'scale(1.08) rotateY(5deg)' : 'scale(1)',
        boxShadow: hovered ? '0 10px 25px rgba(0,0,0,0.8)' : '0 10px 40px rgba(0,0,0,0.4)',
        borderColor: hovered ? '#d4af37' : 'rgba(255,255,255,0.1)'
      }}
    >
        {book.badge && (
          <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">
            {book.badge}
          </div>
        )}
      <img
        src={book.cover}
        alt={book.title}
        className="w-full h-full object-cover transition-all"
        style={{ filter: hovered ? 'brightness(0.7)' : 'brightness(1)' }}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-transform ${
          hovered ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <h3 className="text-base font-bold mb-1.5">{book.title}</h3>
        <p className="text-sm text-gray-400 mb-3">by {book.author}</p>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1 text-yellow-500 font-semibold text-sm">
            ⭐ {book.rating}
          </div>
        </div>
        <div className="flex gap-2.5">
          <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border-none text-white flex items-center justify-center cursor-pointer transition-all hover:bg-yellow-500 hover:text-black hover:scale-110">
            {book.hasTrailer ? '▶' : '📖'}
          </button>
          <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border-none text-white flex items-center justify-center cursor-pointer transition-all hover:bg-yellow-500 hover:text-black hover:scale-110">
            ➕
          </button>
          <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border-none text-white flex items-center justify-center cursor-pointer transition-all hover:bg-yellow-500 hover:text-black hover:scale-110">
            ❤️
          </button>
        </div>
      </div>
    </Link>
  );
}
