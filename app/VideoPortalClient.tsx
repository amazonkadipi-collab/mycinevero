'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';

type Props = {
  initialSearch?: string;
  initialPage?: number;
  initialOrder?: string;
  initialVideos?: unknown[];
  initialTotalPages?: number;
  initialError?: string;
};

const genres = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Romance',
  'Science Fiction',
  'Thriller',
];

const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'];

export default function VideoPortalClient({ initialSearch = '' }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState(initialSearch);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = search.trim();
    window.location.href = value ? `/?k=${encodeURIComponent(value)}` : '/';
  };

  return (
    <div className="min-h-screen bg-white text-[#292a2d]">
      <header className="sticky top-0 z-40 border-b border-[#e5e5e7] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1180px] items-center px-4 sm:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded p-2 text-[#55565a] transition hover:bg-[#f3f3f4] md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/" aria-label="Elovex home" className="shrink-0 text-[23px] font-black tracking-[-0.08em]">
            <span className="text-[#17181a]">ELO</span>
            <span className="text-[#e52b43]">VEX</span>
          </Link>

          <form onSubmit={submitSearch} className="ml-10 hidden min-w-0 flex-1 md:flex md:max-w-[450px]">
            <div className="flex w-full border border-[#d8d8da] bg-white focus-within:border-[#e52b43]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search movies and series"
                aria-label="Search movies and series"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
              />
              <button type="submit" aria-label="Search" className="flex items-center gap-2 bg-[#e52b43] px-4 text-sm font-semibold text-white transition hover:bg-[#d9233a]">
                <Search size={15} />
                Search
              </button>
            </div>
          </form>

          <nav className="ml-auto hidden items-center gap-7 text-sm md:flex">
            <Link href="/" className="font-semibold text-[#292a2d]">Home</Link>
            <Link href="/movies" className="text-[#6d6e73] transition hover:text-[#e52b43]">Movies</Link>
            <Link href="/series" className="text-[#6d6e73] transition hover:text-[#e52b43]">Series</Link>
          </nav>

          <button
            type="button"
            aria-label="Open search"
            onClick={() => setSearchOpen((value) => !value)}
            className="ml-auto rounded p-2 text-[#55565a] transition hover:bg-[#f3f3f4] md:hidden"
          >
            <Search size={20} />
          </button>
        </div>

        {menuOpen && (
          <nav className="border-t border-[#e5e5e7] bg-white px-5 py-4 md:hidden">
            <div className="mx-auto flex max-w-[1180px] flex-col gap-4 text-sm font-medium">
              <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link href="/movies" onClick={() => setMenuOpen(false)}>Movies</Link>
              <Link href="/series" onClick={() => setMenuOpen(false)}>Series</Link>
            </div>
          </nav>
        )}

        {searchOpen && (
          <form onSubmit={submitSearch} className="border-t border-[#e5e5e7] bg-white p-3 md:hidden">
            <div className="mx-auto flex max-w-[1180px] border border-[#d8d8da] focus-within:border-[#e52b43]">
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search movies and series"
                className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none"
              />
              <button type="submit" className="bg-[#e52b43] px-4 text-sm font-semibold text-white">Search</button>
            </div>
          </form>
        )}
      </header>

      <main className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <section className="min-h-[330px] border-b border-[#e7e7e8] py-8 sm:min-h-[390px]">
          <div className="flex h-full min-h-[270px] items-end">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#e52b43]">ELOVEX</p>
              <h1 className="max-w-[680px] text-[30px] font-bold leading-tight tracking-[-0.035em] sm:text-[42px]">
                Movies and series, simply discovered.
              </h1>
              <p className="mt-3 max-w-[620px] text-sm leading-6 text-[#77797e] sm:text-[15px]">
                A clean catalogue for discovering movies, series, genres and new releases.
              </p>
            </div>
          </div>
        </section>

        <section className="min-h-[430px] py-9 sm:min-h-[520px]">
          <div className="flex items-center justify-between border-b border-[#e7e7e8] pb-4">
            <h2 className="text-lg font-bold tracking-[-0.02em]">Featured</h2>
            <span className="text-xs text-[#999a9e]">Coming soon</span>
          </div>
          <div className="min-h-[360px]" />
        </section>

        <section className="min-h-[430px] border-t border-[#e7e7e8] py-9 sm:min-h-[520px]">
          <div className="flex items-center justify-between border-b border-[#e7e7e8] pb-4">
            <h2 className="text-lg font-bold tracking-[-0.02em]">Latest Movies</h2>
            <Link href="/movies" className="text-xs font-semibold text-[#e52b43] hover:underline">View all</Link>
          </div>
          <div className="min-h-[360px]" />
        </section>

        <section className="min-h-[430px] border-t border-[#e7e7e8] py-9 sm:min-h-[520px]">
          <div className="flex items-center justify-between border-b border-[#e7e7e8] pb-4">
            <h2 className="text-lg font-bold tracking-[-0.02em]">Latest Series</h2>
            <Link href="/series" className="text-xs font-semibold text-[#e52b43] hover:underline">View all</Link>
          </div>
          <div className="min-h-[360px]" />
        </section>

        <section className="border-t border-[#e7e7e8] py-9">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-[-0.02em]">Browse by Genre</h2>
          </div>
          <div className="flex flex-wrap gap-2 pb-3">
            {genres.map((genre) => (
              <Link key={genre} href={`/genre/${genre.toLowerCase().replace(/ /g, '-')}`} className="border border-[#dedee0] px-3 py-2 text-xs text-[#66676c] transition hover:border-[#e52b43] hover:text-[#e52b43]">
                {genre}
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-[#e7e7e8] py-9">
          <h2 className="mb-5 text-lg font-bold tracking-[-0.02em]">Browse by Year</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {years.map((year) => (
              <Link key={year} href={`/year/${year}`} className="text-sm text-[#77797e] transition hover:text-[#e52b43]">{year}</Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-4 border-t border-[#e5e5e7] bg-[#fafafa]">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-9 text-xs text-[#77797e] sm:px-6 md:grid-cols-4">
          <div>
            <Link href="/" className="text-[20px] font-black tracking-[-0.08em] text-[#17181a]">ELO<span className="text-[#e52b43]">VEX</span></Link>
            <p className="mt-3 max-w-[240px] leading-5">A clean destination for discovering movies and series.</p>
          </div>
          <div>
            <h3 className="mb-3 font-bold uppercase tracking-wider text-[#45464a]">Explore</h3>
            <div className="space-y-2"><Link className="block hover:text-[#e52b43]" href="/">Home</Link><Link className="block hover:text-[#e52b43]" href="/movies">Movies</Link><Link className="block hover:text-[#e52b43]" href="/series">Series</Link></div>
          </div>
          <div>
            <h3 className="mb-3 font-bold uppercase tracking-wider text-[#45464a]">Popular genres</h3>
            <div className="grid grid-cols-2 gap-y-2">{genres.slice(0, 8).map((genre) => <span key={genre}>{genre}</span>)}</div>
          </div>
          <div>
            <h3 className="mb-3 font-bold uppercase tracking-wider text-[#45464a]">Information</h3>
            <div className="space-y-2"><Link className="block hover:text-[#e52b43]" href="/privacy">Privacy</Link><Link className="block hover:text-[#e52b43]" href="/contact">Contact</Link></div>
          </div>
        </div>
        <div className="border-t border-[#e5e5e7] px-4 py-5 text-center text-xs text-[#999a9e]">© {new Date().getFullYear()} Elovex</div>
      </footer>
    </div>
  );
}
