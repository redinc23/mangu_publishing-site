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

