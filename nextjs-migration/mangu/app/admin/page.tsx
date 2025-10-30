'use client';

import Nav from '@/components/Nav';
import { useEffect, useState } from 'react';

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const creds = { admin: 'mangupub2024', publisher: 'books123', manager: 'content456' } as const;

  useEffect(() => { setLoggedIn(sessionStorage.getItem('adminLoggedIn') === 'true'); }, []);

  function login(e: React.FormEvent) {
    e.preventDefault();
    if ((creds as any)[u] === p) {
      sessionStorage.setItem('adminLoggedIn', 'true');
      sessionStorage.setItem('adminUsername', u);
      setLoggedIn(true);
    } else {
      alert('Invalid credentials');
    }
  }

  function logout() { sessionStorage.clear(); setLoggedIn(false); }

  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-[1200px] px-[4%] pt-28 pb-20">
        {!loggedIn ? (
          <form onSubmit={login} className="mx-auto w-full max-w-md rounded-2xl border border-orange-500 bg-[#1e1e32]/80 p-8 shadow-[0_20px_40px_rgba(255,132,0,0.3)]">
            <div className="mb-2 text-2xl font-bold text-orange-400">ADMIN ACCESS</div>
            <div className="mb-6 text-white/70">Mangu Publishing Dashboard</div>
            <label className="mb-2 block text-sm font-semibold text-orange-400">Username</label>
            <input className="mb-4 w-full rounded-lg border-2 border-orange-500 bg-white/10 p-3 outline-none focus:border-yellow-400" value={u} onChange={(e)=>setU(e.target.value)} />
            <label className="mb-2 block text-sm font-semibold text-orange-400">Password</label>
            <input type="password" className="mb-6 w-full rounded-lg border-2 border-orange-500 bg-white/10 p-3 outline-none focus:border-yellow-400" value={p} onChange={(e)=>setP(e.target.value)} />
            <button className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 p-3 font-bold">Access Dashboard</button>
          </form>
        ) : (
          <>
            <header className="sticky top-[70px] z-10 mb-6 flex items-center justify-between border-b border-orange-500/60 bg-black/70 p-4 backdrop-blur">
              <div className="text-xl font-bold text-orange-400">MANGU PUBLISHING - ADMIN</div>
              <button onClick={logout} className="rounded-full bg-red-600/80 px-4 py-2">Logout</button>
            </header>
            <h1 className="mb-2 text-3xl font-bold text-orange-400">Dashboard Overview</h1>
            <p className="mb-6 text-white/70">Manage your publishing content and monitor performance</p>
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                ['127', 'Total Books'],
                ['45', 'Videos'],
                ['12.5K', 'Active Users'],
                ['89%', 'Engagement'],
              ].map(([n, l]) => (
                <div key={l} className="rounded-xl border border-orange-500/60 bg-[#1e1e32]/70 p-6 text-center">
                  <div className="text-3xl font-extrabold text-orange-400">{n}</div>
                  <div className="text-white/80">{l}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card title="Upload New Book">
                <Upload accept=".pdf,.epub,.mobi" label="Drag & drop book files here" />
                <FormRow />
                <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 p-3 font-bold">Upload Book</button>
              </Card>
              <Card title="Upload Video Content">
                <Upload accept=".mp4,.mov,.avi" label="Drag & drop video files here" />
                <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 p-3 font-bold">Upload Video</button>
              </Card>
              <Card title="Manage Book Covers">
                <Upload accept=".jpg,.jpeg,.png,.webp" label="Drag & drop cover images here" />
                <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 p-3 font-bold">Upload Cover</button>
              </Card>
              <Card title="Content Management">
                <label className="mb-2 block text-sm font-semibold text-orange-400">Description</label>
                <textarea className="h-28 w-full rounded-lg border-2 border-orange-500 bg-white/10 p-3 outline-none" />
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 p-3 font-bold">Save Changes</button>
                  <button className="rounded-lg border-2 border-orange-500 p-3 font-bold text-orange-400">Preview</button>
                </div>
              </Card>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-orange-500 bg-[#1e1e32]/90 p-6 shadow-[0_15px_30px_rgba(255,132,0,0.3)]">
      <h3 className="mb-3 text-lg font-bold text-orange-400">{title}</h3>
      {children}
    </div>
  );
}

function Upload({ accept, label }: { accept: string; label: string }) {
  return (
    <label className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-orange-500 p-10 text-center hover:bg-orange-500/10">
      <input type="file" accept={accept} hidden />
      <div className="text-3xl">⬆</div>
      <div className="mt-2">{label}</div>
      <div className="text-sm text-white/70">Max sizes vary per type</div>
    </label>
  );
}

function FormRow() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <input className="rounded-lg border-2 border-orange-500 bg-white/10 p-3 outline-none" placeholder="Book Title" />
      <input className="rounded-lg border-2 border-orange-500 bg-white/10 p-3 outline-none" placeholder="Author" />
    </div>
  );
}

