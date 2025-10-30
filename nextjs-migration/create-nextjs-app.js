#!/usr/bin/env node

/**
 * Complete Next.js Bootstrap Generator for MANGU Publishing
 * Creates all pages, components, and configuration files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APP_NAME = 'mangu';
const BASE_DIR = path.join(__dirname, APP_NAME);

console.log('🚀 Creating MANGU Next.js Project...\n');

// Step 1: Create Next.js app
console.log('📦 Creating Next.js app...');
execSync(`npm create next-app@latest ${APP_NAME} -- --typescript --app --eslint --src-dir=false --import-alias "@/*" --tailwind=false --yes`, { 
  stdio: 'inherit',
  cwd: __dirname 
});

// Create directories
const dirs = ['app', 'components', 'app/library', 'app/library/[slug]', 'app/signin', 'app/profile', 'app/admin', 'app/about', 'app/audiobooks', 'app/video', 'app/new'];
dirs.forEach(dir => {
  const fullPath = path.join(BASE_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Step 2: Install Tailwind
console.log('\n🎨 Installing Tailwind CSS...');
execSync('npm i -D tailwindcss postcss autoprefixer', { 
  stdio: 'inherit',
  cwd: BASE_DIR 
});
execSync('npx tailwindcss init -p --yes', { 
  stdio: 'inherit',
  cwd: BASE_DIR 
});

// Files to create
const files = {
  // Tailwind config
  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};`,

  // Globals CSS
  'app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`,

  // Layout
  'app/layout.tsx': `import './globals.css';

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
}`,

  // Environment
  '.env.local': `NEXT_PUBLIC_HERO_VIDEO=
NEXT_PUBLIC_LINK_APPLE=
NEXT_PUBLIC_LINK_GOOGLE=
NEXT_PUBLIC_LINK_AMAZON=
NEXT_PUBLIC_INSTAGRAM=
NEXT_PUBLIC_YOUTUBE=`,

  // Nav Component
  'components/Nav.tsx': `import Link from 'next/link';

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
}`,

  // Buttons Component  
  'components/Buttons.tsx': `export function Button({ children, className = 'bg-orange-500 hover:bg-orange-600' }: { children: React.ReactNode; className?: string }) {
  return <button className={\`inline-flex items-center gap-2 rounded-md px-4 py-2 font-semibold transition \${className}\`}>{children}</button>;
}

export function OutboundBtn({ href, label, color }: { href: string; label: string; color: string }) {
  const url = href || '#';
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={\`rounded-md px-3 py-2 text-sm font-bold \${color}\`} aria-label={label}>
      {label}
    </a>
  );
}`,
};

console.log('\n📝 Creating files...');

// Write all files
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(BASE_DIR, filePath);
  fs.writeFileSync(fullPath, content);
  console.log(`  ✓ ${filePath}`);
});

// Note: Page files will be created in separate step due to length
console.log('\n✅ Base structure created!');
console.log('\n📚 Next steps:');
console.log(`  1. cd ${APP_NAME}`);
console.log('  2. Run page generation script or create pages manually');
console.log('  3. npm run dev');

