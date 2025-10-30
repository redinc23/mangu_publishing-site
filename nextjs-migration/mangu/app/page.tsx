'use client';

import Nav from '@/components/Nav';
import { Button, OutboundBtn } from '@/components/Buttons';
import { useEffect, useState } from 'react';

const VIDEO_SRC = process.env.NEXT_PUBLIC_HERO_VIDEO || '/laps.mp4';
const HERO_POSTER = 'https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=1600&q=80';

const OUTBOUND = {
  apple: process.env.NEXT_PUBLIC_LINK_APPLE || '#',
  google: process.env.NEXT_PUBLIC_LINK_GOOGLE || '#',
  amazon: process.env.NEXT_PUBLIC_LINK_AMAZON || '#',
};

const TRENDING = [
  { title: 'The Silent Patient', author: 'Alex Michaelides', year: 2019, img: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=400&q=80', genres: ['Thriller', 'Mystery'], new: true, rating: 4.7 },
  { title: 'Project Hail Mary', author: 'Andy Weir', year: 2021, img: 'https://images.unsplash.com/photo-1536746803623-cef87080c7b2?auto=format&fit=crop&w=400&q=80', genres: ['Sci-Fi', 'Adventure'], rating: 4.8 },
  { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', year: 2021, img: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80', genres: ['Sci-Fi', 'Literary'], new: true, rating: 4.5 },
  { title: 'The Last Thing He Told Me', author: 'Laura Dave', year: 2021, img: 'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?auto=format&fit=crop&w=400&q=80', genres: ['Mystery', 'Thriller'], rating: 4.3 },
  { title: 'The Four Winds', author: 'Kristin Hannah', year: 2021, img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80', genres: ['Historical', 'Fiction'], rating: 4.6 },
  { title: 'The Paris Library', author: 'Janet Skeslien Charles', year: 2021, img: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80', genres: ['Historical', 'Fiction'], new: true, rating: 4.4 },
];

const NEW_RELEASES = [
  { title: 'The Maid', author: 'Nita Prose', img: 'https://images.unsplash.com/photo-1515125520141-3e3b67bc0a88?auto=format&fit=crop&w=120&q=80', rating: '★★★★☆' },
  { title: 'Black Cake', author: 'Charmaine Wilkerson', img: 'https://images.unsplash.com/photo-1558901357-ca41e027e43a?auto=format&fit=crop&w=120&q=80', rating: '★★★★☆' },
  { title: 'The Christie Affair', author: 'Nina de Gramont', img: 'https://images.unsplash.com/photo-1554757380-2fb69b9c4549?auto=format&fit=crop&w=120&q=80', rating: '★★★★☆' },
  { title: 'Reminders of Him', author: 'Colleen Hoover', img: 'https://images.unsplash.com/photo-1551818255-e6e109c4f7db?auto=format&fit=crop&w=120&q=80', rating: '★★★★★' },
  { title: 'Sea of Tranquility', author: 'Emily St. John Mandel', img: 'https://images.unsplash.com/photo-1603162109209-4d12f1ebced1?auto=format&fit=crop&w=120&q=80', rating: '★★★★☆' },
  { title: 'The Club', author: 'Ellery Lloyd', img: 'https://images.unsplash.com/photo-1558901357-ca41e027e43a?auto=format&fit=crop&w=120&q=80', rating: '★★★★☆' },
  { title: 'This Time Tomorrow', author: 'Emma Straub', img: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=120&q=80', rating: '★★★★☆' },
];

const POPULAR_AUTHORS = [
  { name: 'Stephen King', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', books: 65 },
  { name: 'J.K. Rowling', img: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=600&q=80', books: 15 },
  { name: 'James Patterson', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', books: 200 },
  { name: 'Margaret Atwood', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80', books: 18 },
  { name: 'John Grisham', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80', books: 47 },
];

export default function HomePage() {
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleVideo = () => {
    const video = document.getElementById('heroBackgroundVideo') as HTMLVideoElement;
    if (video) {
      if (videoPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setVideoPlaying(!videoPlaying);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right', carouselId: string) => {
    const track = document.getElementById(carouselId) as HTMLElement;
    if (track) {
      track.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  return (
    <main className="relative">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-transparent z-[1060]">
        <div className="h-full bg-orange-500 transition-all duration-200" style={{ width: `${scrollProgress}%` }} />
      </div>

      <Nav />

      {/* Hero with Full Background Video */}
      <section className="relative h-[100dvh] flex items-center overflow-hidden bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] via-[#16213e] via-[#0f3460] to-[#533483]">
        {/* Video Background */}
        <div className="absolute inset-0 z-[1]">
          {VIDEO_SRC ? (
            <video
              id="heroBackgroundVideo"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              poster={HERO_POSTER}
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
          ) : (
            <img src={HERO_POSTER} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/40 z-[2]" />
        </div>

        {/* Video Pause Button */}
        <button
          onClick={toggleVideo}
          className="absolute bottom-5 right-5 w-[50px] h-[50px] bg-black/70 border-2 border-orange-500 rounded-full text-white cursor-pointer z-[4] flex items-center justify-center text-base transition-all hover:bg-orange-500 hover:scale-110"
        >
          {videoPlaying ? '⏸' : '▶'}
        </button>

        {/* Hero Content */}
        <div className="relative z-[3] mx-auto flex h-full w-full max-w-[1920px] items-center justify-between px-[4%]">
          <div className="max-w-xl">
            <h1 className="mb-3 text-5xl font-light tracking-[0.2em] md:text-7xl text-white">MANGU PUBLISHING</h1>
            <p className="mb-6 max-w-prose text-white/85 text-xl">
              Discover a universe of stories. Stream unlimited books, audiobooks, and exclusive videos anywhere, anytime.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#featured"
                className="inline-flex items-center gap-3 bg-orange-500 text-white px-5 py-2.5 text-base rounded-md transition-all hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(255,119,0,0.4)] hover:bg-[#cc5500]"
              >
                ▶ Start Reading Now
              </a>
            </div>
          </div>
          <div className="hidden flex-1 md:flex" aria-hidden />
        </div>
      </section>

      {/* Featured Hero Section */}
      <section id="featured" className="relative z-10 -mt-[150px] bg-gradient-to-t from-[#141414] to-transparent pb-16 pt-[150px]">
        <div className="mx-auto max-w-full px-[4%]">
          <h2 className="text-white text-2xl font-normal mb-8">Featured This Week</h2>
          <div className="relative flex rounded-xl border-2 border-orange-500 bg-[#222] md:min-h-[400px] -mx-5 overflow-hidden">
            {/* Orange side bars */}
            <div className="absolute left-0 top-0 bottom-0 w-[26px] bg-orange-500" />
            <div className="absolute right-0 top-0 bottom-0 w-[26px] bg-orange-500" />

            {/* Vertical Navigation Bar (Far Left) */}
            <div className="flex-shrink-0 w-16 bg-[#1a1a1a] flex flex-col items-center py-6 gap-6 border-r border-white/10">
              <a href="/" className="text-white/80 hover:text-white transition-colors text-xl" title="Home">
                🏠
              </a>
              <a href="/library" className="text-white/80 hover:text-white transition-colors text-xl" title="Books">
                📚
              </a>
              <a href="/audiobooks" className="text-white/80 hover:text-white transition-colors text-xl" title="Audiobooks">
                🎧
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors text-xl" title="Bookmarks">
                🔖
              </a>
              <a href="/profile" className="text-white/80 hover:text-white transition-colors text-xl" title="Profile">
                👤
              </a>
            </div>

            {/* Left Half - Book Details */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 p-8">
              {/* Book Cover */}
              <div className="flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80"
                  alt="The Midnight Library cover"
                  className="h-[220px] w-[150px] md:h-[300px] md:w-[200px] rounded-md object-cover cursor-pointer transition-transform hover:scale-105"
                />
              </div>

              {/* Book Details */}
              <div className="flex-1">
                <h3 className="text-3xl font-bold md:text-5xl text-white mb-1">The Midnight Library</h3>
                <p className="mt-1 text-orange-400 text-base mb-4">By Matt Haig</p>
                <div className="flex flex-wrap items-center gap-4 text-white/75 mb-4">
                  <strong className="text-white">4.7</strong>
                  <span className="text-yellow-400">★★★★★</span>
                  <span>352 pages</span>
                  <span>2020</span>
                </div>
                <div className="mb-5">
                  <span className="text-yellow-400 text-base mr-2">★★★★★</span>
                  <span className="text-white/60 text-sm">4.7 (12.4k reviews)</span>
                </div>
                <p className="text-white leading-relaxed mb-5 max-w-prose">
                  Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices... Would you have done anything different, if you had the chance to undo your regrets?
                </p>
                <div className="flex gap-2 mb-4">
                  <button className="px-4 py-2 rounded bg-[#007aff] text-white text-xs font-bold hover:bg-[#0066cc] transition-all">Apple Books</button>
                  <button className="px-4 py-2 rounded bg-[#4285f4] text-white text-xs font-bold hover:bg-[#357ae8] transition-all">Google Play</button>
                  <button className="px-4 py-2 rounded bg-[#ff9900] text-white text-xs font-bold hover:bg-[#e68900] transition-all">Amazon</button>
                </div>
                <div className="flex gap-2.5 mt-4">
                  <div className="w-8 h-8 rounded-full bg-[#444] flex items-center justify-center text-orange-500 text-sm cursor-pointer hover:bg-[#555] transition-all">
                    🔗
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#444] flex items-center justify-center text-orange-500 text-sm cursor-pointer hover:bg-[#555] transition-all">
                    ⬇
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#444] flex items-center justify-center text-orange-500 text-sm cursor-pointer hover:bg-[#555] transition-all">
                    🚩
                  </div>
                </div>
              </div>
            </div>

            {/* Right Half - TV Section */}
            <div className="flex-shrink-0 w-full md:w-[500px] h-[400px] md:h-full relative bg-[#1a1a1a] border-l border-white/10">
              <div className="w-full h-full p-8 flex items-center justify-center">
                {/* Vintage TV Frame - Larger Silhouette */}
                <div className="relative w-full max-w-[400px] h-[350px] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-tl-[12px] rounded-tr-[12px] rounded-bl-[30px] rounded-br-[30px] p-6 shadow-[0_12px_48px_rgba(0,0,0,0.9),inset_0_2px_8px_rgba(0,0,0,0.5)]">
                  {/* Top bezel */}
                  <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#1a1a1a] to-transparent rounded-tl-[12px] rounded-tr-[12px]" />
                  
                  {/* Red LED indicator */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_12px_#ff0000]" />

                  {/* TV Screen - Larger */}
                  <div className="w-full h-[calc(100%-40px)] mt-6 bg-black rounded-[6px] overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.95)] relative">
                    {/* TV Screen Content - Silhouette effect */}
                    <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#0a0a0a] flex items-center justify-center relative">
                      {/* Screen scan lines effect */}
                      <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
                      }} />
                      {/* Subtle glow */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
                    </div>
                  </div>

                  {/* Vintage TV Controls/Speaker Grille (Right Side) - Larger */}
                  <div className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-[12px] h-[160px] flex flex-col gap-3 items-center">
                    {/* Knobs */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#444] to-[#222] border-2 border-[#666] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.5)]" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#444] to-[#222] border-2 border-[#666] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.5)]" />
                    {/* Speaker grille */}
                    <div className="w-full h-20 flex flex-col gap-1.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-[2px] bg-[#555] rounded-full" />
                      ))}
                    </div>
                  </div>

                  {/* Bottom bezel with controls */}
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#1a1a1a] to-transparent rounded-bl-[30px] rounded-br-[30px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Now Section */}
      <section className="my-10 mx-[4%]">
        <div className="w-full">
          <div className="flex items-center justify-between mb-2.5 px-[4%]">
            <h2 className="text-white text-2xl md:text-[28px] font-semibold">Trending Now</h2>
            <a href="/library" className="text-white/70 hover:text-white text-sm transition-colors cursor-pointer">
              See All →
            </a>
          </div>

          <div className="relative">
            <button
              onClick={() => scrollCarousel('left', 'trendingCarousel')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white text-2xl px-3 py-2 cursor-pointer z-[3] rounded-full hover:bg-black/70 transition-all"
            >
              ‹
            </button>
            <div id="trendingCarousel" className="flex gap-5 overflow-x-auto scroll-smooth pb-2.5 px-16 scrollbar-hide">
              {TRENDING.map((book) => (
                <TrendingCard key={book.title} {...book} />
              ))}
            </div>
            <button
              onClick={() => scrollCarousel('right', 'trendingCarousel')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white text-2xl px-3 py-2 cursor-pointer z-[3] rounded-full hover:bg-black/70 transition-all"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* New Releases Section */}
      <section className="my-5 mx-[4%] py-10">
        <div className="w-full">
          <div className="flex items-center justify-between mb-5 px-[4%]">
            <h2 className="text-white text-2xl font-semibold">New Releases</h2>
            <a href="/library" className="text-white/75 text-sm no-underline hover:text-white transition-colors">
              View All →
            </a>
          </div>
          <div className="relative">
            <button
              onClick={() => scrollCarousel('left', 'newReleasesCarousel')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white text-2xl px-3 py-2 cursor-pointer z-[3] rounded-full hover:bg-black/70 transition-all"
            >
              ‹
            </button>
            <div id="newReleasesCarousel" className="flex gap-5 overflow-x-auto scroll-smooth pb-2.5 px-16 scrollbar-hide">
              {NEW_RELEASES.map((book) => (
                <NewReleaseCard key={book.title} {...book} />
              ))}
            </div>
            <button
              onClick={() => scrollCarousel('right', 'newReleasesCarousel')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white text-2xl px-3 py-2 cursor-pointer z-[3] rounded-full hover:bg-black/70 transition-all"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* Popular Authors Section */}
      <section className="my-5 mx-[4%] py-10">
        <div className="w-full">
          <div className="flex items-center justify-between mb-5 px-[4%]">
            <h2 className="text-white text-2xl font-semibold">Popular Authors</h2>
            <a href="/library" className="text-white/75 text-sm no-underline hover:text-white transition-colors">
              View All →
            </a>
          </div>
          <div className="relative">
            <button
              onClick={() => scrollCarousel('left', 'authorsCarousel')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white text-2xl px-3 py-2 cursor-pointer z-[3] rounded-full hover:bg-black/70 transition-all"
            >
              ‹
            </button>
            <div id="authorsCarousel" className="flex gap-5 overflow-x-auto scroll-smooth pb-2.5 px-16 scrollbar-hide">
              {POPULAR_AUTHORS.map((author) => (
                <AuthorCard key={author.name} {...author} />
              ))}
            </div>
            <button
              onClick={() => scrollCarousel('right', 'authorsCarousel')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/50 border-none text-white text-2xl px-3 py-2 cursor-pointer z-[3] rounded-full hover:bg-black/70 transition-all"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#181818] py-10 px-[4%] mt-16">
        <div className="mx-auto max-w-[1920px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-base font-semibold mb-4">Company</h3>
              <div className="flex flex-col gap-2.5">
                <a href="/about" className="text-white/75 text-sm no-underline hover:text-white transition-colors">About Us</a>
                <a href="#" className="text-white/75 text-sm no-underline hover:text-white transition-colors">Careers</a>
                <a href="#" className="text-white/75 text-sm no-underline hover:text-white transition-colors">Contact</a>
                <a href="#" className="text-white/75 text-sm no-underline hover:text-white transition-colors">Investor Relations</a>
              </div>
            </div>
            <div>
              <h3 className="text-white text-base font-semibold mb-4">Help</h3>
              <div className="flex flex-col gap-2.5">
                <a href="#" className="text-white/75 text-sm no-underline hover:text-white transition-colors">FAQ</a>
                <a href="#" className="text-white/75 text-sm no-underline hover:text-white transition-colors">Account</a>
                <a href="#" className="text-white/75 text-sm no-underline hover:text-white transition-colors">Redeem Gift</a>
                <a href="#" className="text-white/75 text-sm no-underline hover:text-white transition-colors">Terms of Use</a>
              </div>
            </div>
            <div>
              <h3 className="text-white text-base font-semibold mb-4">Browse</h3>
              <div className="flex flex-col gap-2.5">
                <a href="/library" className="text-white/75 text-sm no-underline hover:text-white transition-colors">Books</a>
                <a href="/audiobooks" className="text-white/75 text-sm no-underline hover:text-white transition-colors">Audiobooks</a>
                <a href="/video" className="text-white/75 text-sm no-underline hover:text-white transition-colors">TV Shows</a>
                <a href="#" className="text-white/75 text-sm no-underline hover:text-white transition-colors">Movies</a>
              </div>
            </div>
            <div>
              <h3 className="text-white text-base font-semibold mb-4">Connect</h3>
              <div className="flex flex-col gap-2.5">
                <a href="#" className="text-white/75 text-sm no-underline hover:text-white transition-colors">Facebook</a>
                <a href="#" className="text-white/75 text-sm no-underline hover:text-white transition-colors">Twitter</a>
                <a href={process.env.NEXT_PUBLIC_INSTAGRAM || '#'} className="text-white/75 text-sm no-underline hover:text-white transition-colors">Instagram</a>
                <a href={process.env.NEXT_PUBLIC_YOUTUBE || '#'} className="text-white/75 text-sm no-underline hover:text-white transition-colors">YouTube</a>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-5 border-t border-white/10">
            <p className="text-white/75 text-sm mb-4 md:mb-0">© 2023 MANGU PUBLISHING. All Rights Reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-white/75 text-lg hover:text-white transition-colors" aria-label="Facebook">📘</a>
              <a href="#" className="text-white/75 text-lg hover:text-white transition-colors" aria-label="Twitter">🐦</a>
              <a href={process.env.NEXT_PUBLIC_INSTAGRAM || '#'} className="text-white/75 text-lg hover:text-white transition-colors" aria-label="Instagram">📷</a>
              <a href={process.env.NEXT_PUBLIC_YOUTUBE || '#'} className="text-white/75 text-lg hover:text-white transition-colors" aria-label="YouTube">▶️</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function TrendingCard({ title, author, year, img, genres, new: isNew, rating }: { title: string; author: string; year: number; img: string; genres: string[]; new?: boolean; rating: number }) {
  return (
    <div className="snap-start">
      <div className="relative bg-[#222] rounded-lg w-[200px] h-[360px] overflow-hidden flex flex-col transition-all hover:-translate-y-2.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.5)] cursor-pointer group">
        {isNew && (
          <span className="absolute top-2.5 left-2.5 bg-[#e50914] px-1.5 py-0.5 text-xs font-bold rounded z-[2] uppercase">
            New
          </span>
        )}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#181818]" />
        <img src={img} alt={`${title} cover`} className="w-full h-[60%] object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="p-2.5 flex-1 flex flex-col justify-end relative">
          <h3 className="text-lg font-semibold mb-1.5 line-clamp-2 text-white">{title}</h3>
          <div className="text-xs text-[#bbb] flex gap-1.5 flex-wrap mb-2">
            <span>{author}</span>
            <span>•</span>
            <span>{year}</span>
          </div>
          <div className="mb-2">
            {genres && genres.map((genre) => (
              <span key={genre} className="bg-white/10 px-1 py-0.5 text-[11px] mr-1 rounded inline-block">
                {genre}
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-1.5">
            <button className="bg-white/10 p-1.5 rounded text-sm hover:bg-white/20 transition-all hover:scale-110 flex items-center justify-center">
              ▶
            </button>
            <button className="bg-white/10 p-1.5 rounded text-sm hover:bg-white/20 transition-all hover:scale-110 flex items-center justify-center">
              ➕
            </button>
            <button className="bg-white/10 p-1.5 rounded text-sm hover:bg-white/20 transition-all hover:scale-110 flex items-center justify-center">
              👍
            </button>
            <button className="bg-white/10 p-1.5 rounded text-sm hover:bg-white/20 transition-all hover:scale-110 flex items-center justify-center">
              👎
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewReleaseCard({ title, author, img, rating }: { title: string; author: string; img: string; rating: string }) {
  return (
    <div className="snap-start">
      <div className="bg-[#111] rounded-md min-w-[120px] overflow-hidden relative transition-all hover:scale-105 cursor-pointer group">
        <img src={img} alt={`${title} cover`} className="w-full h-auto" />
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent text-white p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2 mb-1.5">
            <button className="bg-white/20 rounded-full w-[30px] h-[30px] flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all hover:scale-110 text-sm">
              ▶
            </button>
            <button className="bg-white/20 rounded-full w-[30px] h-[30px] flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all hover:scale-110 text-sm">
              ➕
            </button>
            <button className="bg-white/20 rounded-full w-[30px] h-[30px] flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all hover:scale-110 text-sm">
              👍
            </button>
          </div>
          <div className="text-xs">
            <div className="text-sm font-semibold mb-1 leading-tight">{title}</div>
            <div className="text-xs text-white/75 mb-0.5">{author}</div>
            <div className="text-xs text-white/90">{rating}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthorCard({ name, img, books }: { name: string; img: string; books: number }) {
  return (
    <div className="snap-start">
      <div className="bg-[#111] rounded-md min-w-[120px] overflow-hidden relative transition-all hover:scale-105 cursor-pointer group">
        <img src={img} alt={`${name}`} className="w-full h-auto" />
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent text-white p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2 mb-1.5">
            <button className="bg-white/20 rounded-full w-[30px] h-[30px] flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all hover:scale-110 text-sm">
              👤➕
            </button>
          </div>
          <div className="text-xs">
            <div className="text-sm font-semibold mb-1 leading-tight">{name}</div>
            <div className="text-xs text-white/75">{books} books</div>
          </div>
        </div>
      </div>
    </div>
  );
}
