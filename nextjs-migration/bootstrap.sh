#!/usr/bin/env bash

set -euo pipefail

APP_NAME="mangu"

echo "🚀 Starting MANGU Next.js Bootstrap..."

# 1) Create Next.js app
echo "📦 Creating Next.js app..."
npm create next-app@latest "$APP_NAME" -- --typescript --app --eslint --src-dir=false --import-alias "@/*" --tailwind=false --yes

cd "$APP_NAME"

# 2) Tailwind setup
echo "🎨 Setting up Tailwind CSS..."
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p --yes

cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
EOF

mkdir -p app components

cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# 3) Env placeholders
echo "⚙️  Setting up environment variables..."
cat > .env.local << 'EOF'
NEXT_PUBLIC_HERO_VIDEO=
NEXT_PUBLIC_LINK_APPLE=
NEXT_PUBLIC_LINK_GOOGLE=
NEXT_PUBLIC_LINK_AMAZON=
NEXT_PUBLIC_INSTAGRAM=
NEXT_PUBLIC_YOUTUBE=
EOF

# 4) Layout
echo "📄 Creating layout..."
cat > app/layout.tsx << 'EOF'
import './globals.css';

export const metadata = {
  title: 'MANGU PUBLISHING',
  description: 'Discover a universe of stories.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#141414] text-white antialiased">{children}</body>
    </html>
  );
}
EOF

# 5) Components
echo "🧩 Creating components..."
cat > components/Nav.tsx << 'EOF'
import Link from 'next/link';

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[70px] bg-gradient-to-b from-black/60 to-transparent data-[scrolled=true]:bg-black/90">
      <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between px-[4%]">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold">
          MANGU
        </Link>
        <nav className="ml-6 hidden items-center gap-5 md:flex">
          <NavLink href="/library">Library</NavLink>
          <NavLink href="/audiobooks">Audiobooks</NavLink>
          <NavLink href="/video">Video</NavLink>
          <NavLink href="/new">New and Noteworthy</NavLink>
          <NavLink href="/about">About Us</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search titles, authors, or keywords"
            className="w-56 rounded-md border border-white/40 bg-black/70 px-3 py-2 text-sm placeholder:text-white/60 focus:border-white focus:outline-none md:w-72"
          />
          <Link href="/signin" className="rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/10">Sign in</Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative text-sm text-white hover:text-white/70">
      {children}
    </Link>
  );
}
EOF

cat > components/Buttons.tsx << 'EOF'
export function Button({ children, className = 'bg-orange-500 hover:bg-orange-600' }: { children: React.ReactNode; className?: string }) {
  return <button className={`inline-flex items-center gap-2 rounded-md px-4 py-2 font-semibold transition ${className}`}>{children}</button>;
}

export function OutboundBtn({ href, label, color }: { href: string; label: string; color: string }) {
  const url = href || '#';
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`rounded-md px-3 py-2 text-sm font-bold ${color}`} aria-label={label}>
      {label}
    </a>
  );
}
EOF

echo "✅ Bootstrap script created! Run it with: bash bootstrap.sh"
echo "📝 All page files will be created by the script when you run it."