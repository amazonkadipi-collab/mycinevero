'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Clock, Eye, Play, Search, Star, X } from 'lucide-react';

interface VideoItem {
  id?: string | number;
  title?: string;
  default_thumb?: { src?: string };
  thumbs?: { src?: string }[];
  thumbnail?: string;
  thumb?: string;
  length_min?: string | number;
  duration?: string;
  views?: number;
  rate?: number | string;
  keywords?: string;
}

type PortalSettings = { query: string; order: string; per_page: number; thumbsize: string; gay: number; lq: number };
const DEFAULTS: PortalSettings = { query: 'all', order: 'latest', per_page: 24, thumbsize: 'medium', gay: 0, lq: 1 };
const NAV = [['latest', 'Latest'], ['most-popular', 'Most Popular'], ['top-weekly', 'Trending'], ['top-rated', 'Top Rated']];

export default function VideoPortalPage() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [order, setOrder] = useState('latest');
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' }).then((response) => response.json()).then((data) => {
      if (data?.success) setSettings((current) => ({ ...current, ...data.settings }));
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const params = new URLSearchParams({ q: activeSearch.trim() || settings.query || 'all', page: String(page), per_page: String(settings.per_page || 24), order, thumbsize: settings.thumbsize || 'medium', gay: String(settings.gay ?? 0), lq: String(settings.lq ?? 1), format: 'json' });
    fetch(`/api/videos/search?${params.toString()}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to load videos'); return data; })
      .then((data) => {
        const list: VideoItem[] = Array.isArray(data) ? data : data.videos || data.results || data.data || [];
        const total = Number(data.total_count ?? data.total ?? list.length);
        setVideos(list); setTotalCount(total); setTotalPages(Number(data.total_pages ?? data.totalPages) || Math.max(1, Math.ceil(total / (settings.per_page || 24))));
      })
      .catch((err) => { if (err?.name !== 'AbortError') { setVideos([]); setTotalCount(0); setTotalPages(1); setError(err instanceof Error ? err.message : 'Unable to load videos'); } })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [activeSearch, page, order, settings]);

  const submitSearch = (event: FormEvent) => { event.preventDefault(); setPage(1); setActiveSearch(searchQuery); };
  const thumbnail = (video: VideoItem) => video.default_thumb?.src || video.thumbnail || video.thumbs?.[0]?.src || video.thumb || '';

  return <div className="min-h-screen bg-[#0b0b0d] text-zinc-200 selection:bg-red-600 selection:text-white">
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0b0b0d]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center gap-5 px-4 py-3 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-950/30"><Play className="h-4 w-4 fill-white text-white" /></span><span className="hidden text-lg font-black tracking-tight text-white sm:block">VISTA<span className="text-red-500">PLAY</span></span></Link>
        <form onSubmit={submitSearch} className="mx-auto flex h-10 w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] focus-within:border-red-500/60"><Search className="my-2.5 ml-3 h-4 w-4 shrink-0 text-zinc-500" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search videos..." className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-500" />{searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="px-2 text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button>}<button className="bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500">Search</button></form>
        <Link href="/admin" className="hidden rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white sm:block">Admin</Link>
      </div>
      <nav className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-4 pb-3 lg:px-8">{NAV.map(([value, label]) => <button key={value} onClick={() => { setOrder(value); setPage(1); }} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm transition ${order === value ? 'bg-red-600 font-semibold text-white' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'}`}>{label}</button>)}</nav>
    </header>

    <main className="mx-auto max-w-[1500px] px-4 py-7 lg:px-8">
      <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-red-500">Discover something new</p><h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{activeSearch ? `Results for “${activeSearch}”` : 'Fresh videos, every day'}</h1><p className="mt-2 text-sm text-zinc-500">Browse the latest collection and find your next favorite.</p></div><div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-right"><p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Available videos</p><p className="mt-0.5 text-xl font-bold text-white">{totalCount.toLocaleString()}</p></div></section>
      {error && <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
      {loading ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{Array.from({ length: 15 }).map((_, index) => <div key={index} className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]"><div className="aspect-video animate-pulse bg-white/[0.06]" /><div className="space-y-3 p-3"><div className="h-4 animate-pulse rounded bg-white/[0.06]" /><div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" /></div></div>)}</div> : videos.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{videos.map((video, index) => <Link key={video.id ?? index} href={`/videos/${video.id}`} className="group overflow-hidden rounded-xl border border-white/[0.08] bg-[#131316] transition duration-200 hover:-translate-y-1 hover:border-red-500/50 hover:shadow-xl hover:shadow-black/30"><div className="relative aspect-video overflow-hidden bg-black">{thumbnail(video) && <img src={thumbnail(video)} alt={video.title || 'Video'} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}<span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100"><span className="rounded-full bg-red-600 p-3 shadow-xl"><Play className="h-5 w-5 fill-white text-white" /></span></span>{(video.length_min || video.duration) && <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/80 px-2 py-1 text-[11px] font-medium"><Clock className="h-3 w-3" />{video.length_min || video.duration}</span>}</div><div className="p-3"><h2 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-white group-hover:text-red-300">{video.title || 'Untitled video'}</h2><div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500"><span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{typeof video.views === 'number' ? video.views.toLocaleString() : '—'}</span><span className="flex items-center gap-1 text-amber-400"><Star className="h-3.5 w-3.5 fill-current" />{video.rate ?? '—'}</span></div></div></Link>)}</div> : <div className="rounded-2xl border border-dashed border-white/10 p-16 text-center"><p className="text-lg font-semibold text-white">Nothing here yet</p><p className="mt-2 text-sm text-zinc-500">Try another search or category.</p></div>}
      {!loading && totalPages > 1 && <footer className="mt-8 flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"><button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 disabled:opacity-30">Previous</button><span className="text-sm text-zinc-500">Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong></span><button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 disabled:opacity-30">Next</button></footer>}
    </main>
  </div>;
}
