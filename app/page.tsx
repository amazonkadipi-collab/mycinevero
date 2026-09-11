'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
}

type PortalSettings = { query: string; order: string; per_page: number; thumbsize: string; gay: number; lq: number };
type VideoCache = { videos: VideoItem[]; totalCount: number; totalPages: number; savedAt: number };

const DEFAULTS: PortalSettings = { query: 'all', order: 'latest', per_page: 24, thumbsize: 'medium', gay: 0, lq: 1 };
const NAV = [['latest', 'Latest'], ['most-popular', 'Most Popular'], ['top-weekly', 'Trending'], ['top-rated', 'Top Rated']];
const CACHE_PREFIX = 'elovex:videos:v2:';
const CACHE_TTL = 5 * 60 * 1000;

function readVideoCache(key: string): VideoCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const cached = JSON.parse(raw) as VideoCache;
    if (!cached?.videos || Date.now() - cached.savedAt > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeVideoCache(key: string, value: Omit<VideoCache, 'savedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ...value, savedAt: Date.now() }));
  } catch {
    // Storage can be unavailable or full; network loading still works normally.
  }
}

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
    fetch('/api/settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => { if (data?.success) setSettings((current) => ({ ...current, ...data.settings })); })
      .catch(() => undefined);
  }, []);

  const requestKey = useMemo(() => JSON.stringify({
    q: activeSearch.trim() || settings.query || 'all',
    page,
    per_page: settings.per_page || 24,
    order,
    thumbsize: settings.thumbsize || 'medium',
    gay: settings.gay ?? 0,
    lq: settings.lq ?? 1,
  }), [activeSearch, page, order, settings.query, settings.per_page, settings.thumbsize, settings.gay, settings.lq]);

  useEffect(() => {
    const cached = readVideoCache(requestKey);
    if (cached) {
      setVideos(cached.videos);
      setTotalCount(cached.totalCount);
      setTotalPages(cached.totalPages);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const controller = new AbortController();
    setError('');
    const params = new URLSearchParams({
      q: activeSearch.trim() || settings.query || 'all',
      page: String(page),
      per_page: String(settings.per_page || 24),
      order,
      thumbsize: settings.thumbsize || 'medium',
      gay: String(settings.gay ?? 0),
      lq: String(settings.lq ?? 1),
      format: 'json',
    });

    fetch(`/api/videos/search?${params.toString()}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load videos');
        return data;
      })
      .then((data) => {
        const list: VideoItem[] = Array.isArray(data) ? data : data.videos || data.results || data.data || [];
        const total = Number(data.total_count ?? data.total ?? list.length);
        const pages = Number(data.total_pages ?? data.totalPages) || Math.max(1, Math.ceil(total / (settings.per_page || 24)));
        setVideos(list);
        setTotalCount(total);
        setTotalPages(pages);
        writeVideoCache(requestKey, { videos: list, totalCount: total, totalPages: pages });
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          // Keep cached/previous results visible instead of replacing useful data with an error state.
          if (!cached) {
            setVideos([]);
            setTotalCount(0);
            setTotalPages(1);
          }
          setError(err instanceof Error ? err.message : 'Unable to load videos');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [requestKey, activeSearch, page, order, settings.query, settings.per_page, settings.thumbsize, settings.gay, settings.lq]);

  const submitSearch = (event: FormEvent) => { event.preventDefault(); setPage(1); setActiveSearch(searchQuery); };
  const thumbnail = (video: VideoItem) => video.default_thumb?.src || video.thumbnail || video.thumbs?.[0]?.src || video.thumb || '';

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 lg:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold text-zinc-900"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600"><Play className="h-3.5 w-3.5 fill-white text-white" /></span><span className="hidden sm:block">ELO<span className="text-red-600">VEX</span></span></Link>
          <form onSubmit={submitSearch} className="mx-auto flex h-9 w-full max-w-xl overflow-hidden rounded-lg border border-zinc-300 bg-zinc-50">
            <Search className="my-2 ml-3 h-4 w-4 shrink-0 text-zinc-400" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search videos..." className="min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-zinc-400" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="px-2 text-zinc-400"><X className="h-4 w-4" /></button>}
            <button className="bg-red-600 px-4 text-sm font-medium text-white">Search</button>
          </form>
          <Link href="/admin" className="hidden px-2 py-1.5 text-xs text-zinc-500 sm:block">Admin</Link>
        </div>
        <nav className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 pb-2 lg:px-6">
          {NAV.map(([value, label]) => <button key={value} onClick={() => { setOrder(value); setPage(1); }} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${order === value ? 'bg-zinc-900 font-medium text-white' : 'text-zinc-500'}`}>{label}</button>)}
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-5 lg:px-6">
        <section className="mb-5 flex items-end justify-between gap-4"><div><p className="mb-1 text-xs font-medium text-red-600">ELOVEX</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{activeSearch ? `Results for “${activeSearch}”` : 'Discover trending videos'}</h1><p className="mt-1 text-sm text-zinc-500">Fresh videos and popular content.</p></div><div className="hidden text-right sm:block"><p className="text-[10px] uppercase tracking-wide text-zinc-400">Available</p><p className="text-lg font-semibold">{totalCount.toLocaleString()}</p></div></section>
        {error && <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

        <div className="relative min-h-[240px]">
          {videos.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {videos.map((video, index) => {
              const image = thumbnail(video);
              return <Link key={video.id ?? index} href={`/videos/${video.id}`} className="group overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <div className="relative aspect-video overflow-hidden bg-zinc-100">
                  {image && <img src={image} alt={video.title || 'Video'} loading={index < 6 ? 'eager' : 'lazy'} fetchPriority={index < 6 ? 'high' : 'low'} decoding="async" className="h-full w-full object-cover" />}
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white">{video.length_min || video.duration ? <><Clock className="h-3 w-3" />{video.length_min || video.duration}</> : 'Watch'}</span>
                </div>
                <div className="p-2.5"><h2 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-zinc-800">{video.title || 'Untitled video'}</h2><div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400"><span className="flex items-center gap-1"><Eye className="h-3 w-3" />{typeof video.views === 'number' ? video.views.toLocaleString() : '—'}</span><span className="flex items-center gap-1"><Star className="h-3 w-3 fill-current" />{video.rate ?? '—'}</span></div></div>
              </Link>;
            })}
          </div>}

          {loading && videos.length === 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"><div className="aspect-video bg-zinc-200" /><div className="p-3"><div className="h-4 w-full rounded bg-zinc-200" /><div className="mt-2 h-3 w-2/3 rounded bg-zinc-200" /></div></div>)}</div>}
          {!loading && videos.length === 0 && !error && <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center"><p className="font-medium">Nothing here yet</p><p className="mt-1 text-sm text-zinc-500">Try another search or category.</p></div>}
        </div>

        {!loading && totalPages > 1 && <footer className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-4"><button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-30">Previous</button><span className="text-sm text-zinc-500">Page <strong className="text-zinc-900">{page}</strong> of <strong className="text-zinc-900">{totalPages}</strong></span><button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-30">Next</button></footer>}
      </main>
    </div>
  );
}
