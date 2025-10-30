'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [libraryDropdownOpen, setLibraryDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-[1030] h-[70px] transition-all ${
      scrolled ? 'bg-[#141414] shadow-md' : 'bg-gradient-to-b from-black/70 to-transparent'
    }`}>
      <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between px-[4%]">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold text-white no-underline">
          <div className="relative w-8 h-8 bg-gradient-to-br from-[#ff7700] to-[#cc5500] rounded-full flex items-center justify-center overflow-hidden">
            <div className="absolute inset-[2px] bg-gradient-to-br from-[#ff9900] to-[#ff6600] rounded-full opacity-80" />
            <span className="relative z-[1] text-base">🔥</span>
          </div>
          <span className="tracking-tight">MANGU</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-5 md:flex">
          <NavLink href="/" active>
            Home
          </NavLink>
          <div
            className="relative"
            onMouseEnter={() => setLibraryDropdownOpen(true)}
            onMouseLeave={() => setLibraryDropdownOpen(false)}
          >
            <NavLink href="/library">
              Library <span className="ml-1 text-xs">▼</span>
            </NavLink>
            {libraryDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-[#181818] rounded-md border border-white/10 shadow-xl py-2 z-50">
                <Link href="/library" className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                  Books
                </Link>
                <Link href="/library/research-papers" className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                  Research Papers
                </Link>
                <div className="block px-4 py-2 text-sm text-white/40 cursor-not-allowed">
                  (Coming Soon)
                </div>
              </div>
            )}
          </div>
          <NavLink href="/audiobooks">Audiobooks</NavLink>
          <NavLink href="/video">Videos</NavLink>
          <NavLink href="/new">New & Noteworthy</NavLink>
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-white/60 text-sm">🔍</span>
            <input
              type="search"
              placeholder="Search titles, authors, or keywords"
              className="w-64 rounded-md border border-white/85 bg-black/75 pl-10 pr-3 py-2 text-sm text-white placeholder:text-white/60 focus:border-white focus:bg-black/90 focus:outline-none transition-all md:w-72"
            />
          </div>

          <button className="relative text-white text-xl cursor-pointer transition-colors hover:text-white/60 bg-transparent border-none p-0">
            🔔
            <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white rounded-full w-[18px] h-[18px] text-[11px] flex items-center justify-center font-bold">
              3
            </span>
          </button>

          <button className="text-white text-xl cursor-pointer transition-colors hover:text-white/60 bg-transparent border-none p-0">
            🔖
          </button>

          <div className="flex items-center gap-2 cursor-pointer relative">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#0073e6] to-[#8a2be2] flex items-center justify-center font-bold text-sm text-white">
              JS
            </div>
            <span className="text-white/60 text-sm">▼</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`relative text-sm transition-colors ${
        active ? 'text-white/60' : 'text-white hover:text-white/60'
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-6 left-0 right-0 h-[3px] bg-orange-500" />
      )}
    </Link>
  );
}
