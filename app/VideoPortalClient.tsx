'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';
import VideoGrid from '@/components/VideoGrid';
import VideoModal from '@/components/VideoModal';

type Video = Record<string, any>;
type Props = {
  initialSearch?: string;
  initialPage?: number;
  initialOrder?: string;
  initialVideos?: unknown[];
  initialTotalPages?: number;
  initialError?: string;
};

const genres = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Romance', 'Science Fiction', 'Thriller'];
const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'];

function Listing({ videos, error, search, page, totalPages, onSelect }: { videos: Video[]; error?: string; search: string; page: number; totalPages: number; onSelect: (video: Video) => void }) {
  if (error) return <div className="empty-state"><strong>We could not load the catalogue.</strong><span>{error}</span></div>;
  if (!videos.length) return <div className="empty-state"><strong>{search ? 'No matching titles found.' : 'No titles are available yet.'}</strong><span>Try another search or check back soon.</span></div>;
  return <>
    <VideoGrid videos={videos as any} onSelect={onSelect} />
    {totalPages > 1 && <nav className="pagination" aria-label="Catalogue pages">
      {page > 1 && <Link href={`/p/${page - 1}${search ? `?category=${encodeURIComponent(search)}` : ''}`}>Previous</Link>}
      <span>Page {page} of {totalPages}</span>
      {page < totalPages && <Link href={`/p/${page + 1}${search ? `?category=${encodeURIComponent(search)}` : ''}`}>Next</Link>}
    </nav>}
  </>;
}

export default function VideoPortalClient({ initialSearch = '', initialPage = 1, initialOrder = 'latest', initialVideos = [], initialTotalPages = 0, initialError }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const videos = (initialVideos as Video[]) || [];
  const hasResults = videos.length > 0 || Boolean(initialError) || Boolean(initialSearch);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = search.trim();
    window.location.href = value ? `/search?q=${encodeURIComponent(value)}` : '/';
  };

  return <div className="elovex-shell min-h-screen bg-white text-[#292a2d]">
    <header className="sticky top-0 z-40 border-b border-[#e5e5e7] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center px-4 sm:px-6">
        <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((value) => !value)} className="rounded p-2 text-[#55565a] transition hover:bg-[#f3f3f4] md:hidden">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <Link href="/" aria-label="Elovex home" className="shrink-0 text-[23px] font-black tracking-[-0.08em]"><span className="text-[#17181a]">ELO</span><span className="text-[#e52b43]">VEX</span></Link>
        <form onSubmit={submitSearch} className="ml-10 hidden min-w-0 flex-1 md:flex md:max-w-[450px]">
          <div className="flex w-full border border-[#d8d8da] bg-white focus-within:border-[#e52b43]"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search movies and series" aria-label="Search movies and series" className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none" /><button type="submit" aria-label="Search" className="flex items-center gap-2 bg-[#e52b43] px-4 text-sm font-semibold text-white transition hover:bg-[#d9233a]"><Search size={15} />Search</button></div>
        </form>
        <nav className="ml-auto hidden items-center gap-7 text-sm md:flex"><Link href="/" className="font-semibold text-[#292a2d]">Home</Link><Link href="/p/1?order=latest" className="text-[#6d6e73] transition hover:text-[#e52b43]">Movies</Link><Link href="/p/1?order=most-popular" className="text-[#6d6e73] transition hover:text-[#e52b43]">Series</Link></nav>
        <button type="button" aria-label="Open search" onClick={() => setSearchOpen((value) => !value)} className="ml-auto rounded p-2 text-[#55565a] transition hover:bg-[#f3f3f4] md:hidden"><Search size={20} /></button>
      </div>
      {menuOpen && <nav className="border-t border-[#e5e5e7] bg-white px-5 py-4 md:hidden"><div className="mx-auto flex max-w-[1180px] flex-col gap-4 text-sm font-medium"><Link href="/" onClick={() => setMenuOpen(false)}>Home</Link><Link href="/p/1?order=latest" onClick={() => setMenuOpen(false)}>Movies</Link><Link href="/p/1?order=most-popular" onClick={() => setMenuOpen(false)}>Series</Link></div></nav>}
      {searchOpen && <form onSubmit={submitSearch} className="border-t border-[#e5e5e7] bg-white p-3 md:hidden"><div className="mx-auto flex max-w-[1180px] border border-[#d8d8da] focus-within:border-[#e52b43]"><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search movies and series" aria-label="Search movies and series" className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none" /><button type="submit" className="bg-[#e52b43] px-4 text-sm font-semibold text-white">Search</button></div></form>}
    </header>

    <main className="mx-auto max-w-[1180px] px-4 sm:px-6">
      <section className="border-b border-[#e7e7e8] py-12 sm:py-16"><p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#e52b43]">ELOVEX</p><h1 className="max-w-[680px] text-[30px] font-bold leading-tight tracking-[-0.035em] sm:text-[42px]">Movies and series, simply discovered.</h1><p className="mt-3 max-w-[620px] text-sm leading-6 text-[#77797e] sm:text-[15px]">A clean catalogue for discovering movies, series, genres, and new releases.</p></section>
      <section className="py-9"><div className="mb-5 flex items-center justify-between border-b border-[#e7e7e8] pb-4"><h2 className="text-lg font-bold tracking-[-0.02em]">{initialSearch ? `Search results for “${initialSearch}”` : 'Latest titles'}</h2><span className="text-xs text-[#999a9e]">{initialOrder === 'most-popular' ? 'Most popular' : 'Recently added'}</span></div><Listing videos={videos} error={initialError} search={initialSearch} page={initialPage} totalPages={initialTotalPages} onSelect={setSelectedVideo} /></section>
      {!hasResults && <><section className="border-t border-[#e7e7e8] py-9"><h2 className="mb-5 text-lg font-bold tracking-[-0.02em]">Browse by genre</h2><div className="flex flex-wrap gap-2 pb-3">{genres.map((genre) => <Link key={genre} href={`/p/1?category=${encodeURIComponent(genre)}`} className="border border-[#dedee0] px-3 py-2 text-xs text-[#66676c] transition hover:border-[#e52b43] hover:text-[#e52b43]">{genre}</Link>)}</div></section><section className="border-t border-[#e7e7e8] py-9"><h2 className="mb-5 text-lg font-bold tracking-[-0.02em]">Browse by year</h2><div className="flex flex-wrap gap-x-6 gap-y-3">{years.map((year) => <Link key={year} href={`/search?q=${year}`} className="text-sm text-[#77797e] transition hover:text-[#e52b43]">{year}</Link>)}</div></section></>}
    </main>
    {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
  </div>;
}
