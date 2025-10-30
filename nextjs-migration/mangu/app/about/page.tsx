import Nav from '@/components/Nav';

export default function About() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-[900px] px-[4%] pt-28 pb-20">
        <h1 className="mb-4 text-4xl font-extrabold">About MANGU</h1>
        <p className="mb-6 text-white/80">
          MANGU PUBLISHING brings books, audiobooks, and exclusive video stories together in one fast, beautiful destination.
        </p>
        <h2 className="mb-3 text-2xl font-bold">Our Story</h2>
        <p className="mb-6 text-white/75">
          We started with a simple idea: make discovering and enjoying great stories effortless and delightful.
        </p>
        <h2 className="mb-3 text-2xl font-bold">Featured Authors</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { name: 'Alexandra Rivers', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80' },
            { name: 'Michael Vance', img: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=400&q=80' },
            { name: 'Marina Song', img: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80' },
          ].map((x) => (
            <div key={x.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <img src={x.img} alt={x.name} className="mb-3 h-40 w-full rounded-lg object-cover" />
              <div className="font-semibold">{x.name}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

