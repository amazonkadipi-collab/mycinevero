'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Menu, Search, X, Star } from 'lucide-react';
import type { TmdbTitle } from '@/lib/tmdb';
import { tmdbImage } from '@/lib/tmdb';

type Props = { trending: TmdbTitle[]; popularMovies: TmdbTitle[]; popularSeries: TmdbTitle[]; latestMovies: TmdbTitle[]; upcoming: TmdbTitle[] };

function titleOf(item: TmdbTitle) { return item.title || item.name || item.original_title || item.original_name || 'Untitled'; }
function yearOf(item: TmdbTitle) { const value = item.release_date || item.first_air_date || ''; return value.slice(0, 4); }

function Card({ item }: { item: TmdbTitle }) {
  const type = item.media_type === 'tv' || item.name ? 'series' : 'movie';
  const slug = `${titleOf(item).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${item.id}`;
  return <Link href={`/${type}/${slug}`} className="group block min-w-0">
    <div className="overflow-hidden border border-zinc-200 bg-white">
      <div className="aspect-[2/3] bg-zinc-100">
        {item.poster_path ? <img src={tmdbImage(item.poster_path, 'w342')} alt={titleOf(item)} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-xs text-zinc-400">No poster</div>}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 group-hover:text-red-600">{titleOf(item)}</h3>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-zinc-500"><span>{yearOf(item) || '—'}</span><span className="inline-flex items-center gap-1"><Star size={12} fill="currentColor" />{item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span></div>
      </div>
    </div>
  </Link>;
}

function Section({ title, items, href }: { title: string; items: TmdbTitle[]; href?: string }) {
  return <section className="border-t border-zinc-200 py-9">
    <div className="mb-5 flex items-end justify-between gap-4"><h2 className="text-xl font-bold tracking-tight">{title}</h2>{href && <Link href={href} className="text-xs font-semibold text-zinc-500 hover:text-red-600">View all</Link>}</div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{items.slice(0, 12).map((item) => <Card key={`${item.media_type || (item.name ? 'tv' : 'movie')}-${item.id}`} item={item} />)}</div>
  </section>;
}

export default function CatalogHome({ trending, popularMovies, popularSeries, latestMovies, upcoming }: Props) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState('');
  const submit = (e: FormEvent) => { e.preventDefault(); const q = search.trim(); if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`; };
  return <div className="min-h-screen bg-white text-zinc-900">
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-4 px-4 sm:px-6">
        <button onClick={() => setMenu(!menu)} aria-label="Menu" className="rounded p-2 hover:bg-zinc-100 md:hidden">{menu ? <X size={20} /> : <Menu size={20} />}</button>
        <Link href="/" className="shrink-0 text-[23px] font-black tracking-[-0.08em]"><span>WATCH</span><span className="text-red-600"> MOVIES</span><span> 4</span></Link>
        <form onSubmit={submit} className="ml-6 hidden max-w-[430px] flex-1 md:flex"><div className="flex w-full border border-zinc-300"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movies and series" className="min-w-0 flex-1 px-3 py-2 text-sm outline-none" /><button className="bg-red-600 px-4 text-white"><Search size={16} /></button></div></form>
        <nav className="ml-auto hidden gap-6 text-sm font-medium md:flex"><Link href="/" className="hover:text-red-600">Home</Link><Link href="/movie" className="hover:text-red-600">Movies</Link><Link href="/series" className="hover:text-red-600">Series</Link></nav>
        <Link href="/search" className="ml-auto rounded p-2 hover:bg-zinc-100 md:hidden"><Search size={20} /></Link>
      </div>
      {menu && <div className="border-t border-zinc-200 px-5 py-4 md:hidden"><nav className="flex flex-col gap-4 text-sm font-medium"><Link href="/">Home</Link><Link href="/movie">Movies</Link><Link href="/series">Series</Link><Link href="/search">Search</Link></nav></div>}
    </header>
    <main className="mx-auto max-w-[1180px] px-4 sm:px-6">
      <section className="py-14 sm:py-20"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-red-600">WATCH MOVIES 4</p><h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Find your next movie or series.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-zinc-500">Discover trending titles, popular movies, TV series, new releases and upcoming films in one clean catalogue.</p></section>
      <Section title="Trending now" items={trending} />
      <Section title="Popular movies" items={popularMovies} href="/movie" />
      <Section title="Popular series" items={popularSeries} href="/series" />
      <Section title="Latest movies" items={latestMovies} href="/movie" />
      <Section title="Coming soon" items={upcoming} href="/movie" />
    </main>
  </div>;
}
