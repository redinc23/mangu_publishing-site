'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const BOOK_COVERS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723a9ce6899?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1600189261867-30e5ffe7b8da?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1485322551133-3a4c27a9d925?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=400&q=80'
];

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const container = document.getElementById('bookBackground');
    if (!container) return;

    container.innerHTML = '';
    const isMobile = window.innerWidth <= 768;
    const itemCount = isMobile ? 60 : 48;
    const shuffled = [...BOOK_COVERS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < itemCount; i++) {
      const tile = document.createElement('div');
      tile.className = 'book-tile';
      tile.style.opacity = '0';
      tile.style.transform = 'scale(0.9)';
      tile.style.animationDelay = `${(i % 10) * 0.1}s`;

      const img = document.createElement('img');
      img.src = shuffled[i % shuffled.length];
      img.alt = 'Book Cover';
      img.loading = 'lazy';
      img.className = 'w-full h-full object-cover';

      const overlay = document.createElement('div');
      overlay.className = 'book-overlay absolute inset-0 bg-gradient-to-br from-blue-900/60 to-emerald-900/60 opacity-0 transition-opacity duration-300 flex items-center justify-center';

      const icon = document.createElement('div');
      icon.className = 'book-icon w-8 h-8 rounded-full bg-white/95 flex items-center justify-center text-blue-600 text-sm';
      icon.innerHTML = '📖';

      overlay.appendChild(icon);
      tile.appendChild(img);
      tile.appendChild(overlay);
      container.appendChild(tile);

      setTimeout(() => {
        tile.style.opacity = '1';
        tile.style.transform = 'scale(1)';
      }, (i % 10) * 100);
    }

    const handleResize = () => {
      container.innerHTML = '';
      const newIsMobile = window.innerWidth <= 768;
      const newCount = newIsMobile ? 60 : 48;
      const newShuffled = [...BOOK_COVERS].sort(() => Math.random() - 0.5);

      for (let i = 0; i < newCount; i++) {
        const tile = document.createElement('div');
        tile.className = 'book-tile';
        const img = document.createElement('img');
        img.src = newShuffled[i % newShuffled.length];
        img.alt = 'Book Cover';
        img.loading = 'lazy';
        img.className = 'w-full h-full object-cover';
        tile.appendChild(img);
        container.appendChild(tile);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    showNotification('Signing in…', 'info');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1800));
      showNotification('Welcome back to MANGU!', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    } catch (error) {
      showNotification('Sign in failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    showNotification(`Redirecting to ${provider === 'google' ? 'Google' : 'Apple'}...`, 'info');
  };

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Dynamic Book Cover Background */}
      <div
        id="bookBackground"
        className="fixed inset-0 z-[1] grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] auto-rows-[minmax(120px,1fr)] gap-1.5 p-3"
        style={{
          transform: 'perspective(1000px) rotateX(15deg) rotateY(-5deg)',
          animation: 'float 24s ease-in-out infinite'
        }}
      />

      {/* Glass Overlay */}
      <div className="fixed inset-0 z-[2] bg-gradient-to-br from-[#0a0a0a]/60 via-orange-900/10 to-orange-800/10 backdrop-blur-md" />

      {/* Sign In Container */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[90%] max-w-[420px]">
        <div className="relative bg-[#1e1e1e]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700" />

          {/* Header */}
          <div className="text-center mb-9">
            <div className="text-3xl font-black mb-3 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent">
              MANGU
            </div>
            <h1 className="text-2xl font-bold mb-2">Continue Your Story</h1>
            <p className="text-[15px] text-[#b8b8b8] max-w-[300px] mx-auto">
              Sign in to access your library and writing tools
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-semibold mb-2 text-white">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="username"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-[15px] font-medium transition-all focus:outline-none focus:border-orange-500 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(255,119,0,0.15)] placeholder:text-[#6b6b6b]"
                />
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="block text-sm font-semibold mb-2 text-white">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-[15px] font-medium transition-all focus:outline-none focus:border-orange-500 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(255,119,0,0.15)] placeholder:text-[#6b6b6b]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#b8b8b8] cursor-pointer text-base transition-all hover:text-white hover:bg-white/10 rounded-full p-2"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6 text-sm">
              <label className="flex items-center gap-2 text-[#b8b8b8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 cursor-pointer"
                />
                Remember me
              </label>
              <Link href="#" className="text-orange-500 no-underline font-medium transition-colors hover:text-orange-400 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-xl text-white text-base font-bold cursor-pointer transition-all relative overflow-hidden mb-5 shadow-[0_4px_15px_rgba(255,119,0,0.3)] ${
                loading
                  ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(255,119,0,0.4)]'
              }`}
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-7 text-[#6b6b6b] text-[13px] font-medium">
            <div className="flex-1 h-px bg-white/10" />
            <span className="px-3">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social Buttons */}
          <div className="flex gap-3 mb-7">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 backdrop-blur-md hover:bg-white/10 hover:border-orange-500 hover:-translate-y-0.5"
            >
              <span className="text-base">🔍</span>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('apple')}
              className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 backdrop-blur-md hover:bg-white/10 hover:border-orange-500 hover:-translate-y-0.5"
            >
              <span className="text-base">🍎</span>
              Apple
            </button>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-[#b8b8b8]">
            New to MANGU?{' '}
            <Link href="#" className="text-orange-500 no-underline font-semibold transition-colors hover:text-orange-400 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-[1000] px-5 py-3.5 rounded-xl font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center gap-2.5 max-w-[320px] transition-transform duration-300 ${
            notification.type === 'error'
              ? 'bg-gradient-to-r from-[#dc2626] to-[#ef4444]'
              : notification.type === 'info'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700'
              : 'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700'
          }`}
          style={{ transform: 'translateX(0)' }}
        >
          <span className="text-lg">
            {notification.type === 'error' ? '❌' : notification.type === 'info' ? 'ℹ️' : '✅'}
          </span>
          <span>{notification.message}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: perspective(1000px) rotateX(15deg) rotateY(-5deg) translateY(0);
          }
          50% {
            transform: perspective(1000px) rotateX(18deg) rotateY(-8deg) translateY(-20px);
          }
        }

        .book-tile {
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          background: #121212;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: fadeInScale 1s ease-out forwards;
        }

        @keyframes fadeInScale {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .book-tile:hover {
          transform: scale(1.08) translateZ(20px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
          z-index: 10;
        }

        .book-tile:hover .book-overlay {
          opacity: 1;
        }

        .book-tile:hover img {
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          #bookBackground {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            grid-auto-rows: minmax(80px, 1fr);
            gap: 1px;
            padding: 2px;
          }
        }
      `}</style>
    </main>
  );
}
