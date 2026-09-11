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
const CACHE_PREFIX = 'elovex:videos:v4:';
const CACHE_TTL = 2 * 60 * 1000;

function readVideoCache(key: string): VideoCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const cached = JSON.parse(raw) as VideoCache;
    if (!Array.isArray(cached?.videos) || Date.now() - cached.savedAt > CACHE_TTL) return null;
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

function getVideoList(data: any): VideoItem[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.videos)) return data.videos;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.videos)) return data.data.videos;
  if (Array.isArray(data?.response?.videos)) return data.response.videos;
  return [];
}

function getTotalCount(data: any, listLength: number): number {
  const candidates = [
    data?.total_count,
    data?.total,
    data?.totalCount,
    data?.pagination?.total,
    data?.pagination?.total_count,
    data?.data?.total_count,
    data?.data?.total,
  ];
  const value = candidates.map(Number).find((n) => Number.isFinite(n) && n >= 0);
  return value ?? listLength;
}

function getTotalPages(data: any, totalCount: number, perPage: number): number {
  const candidates = [
    data?.total_pages,
    data?.totalPages,
    data?.pages,
    data?.pagination?.total_pages,
    data?.pagination?.pages,
    data?.data?.total_pages,
    data?.data?.totalPages,
  ];
  const value = candidates.map(Number).find((n) => Number.isFinite(n) && n >= 1);
  return value ? Math.floor(value) : Math.max(1, Math.ceil(totalCount / Math.max(1, perPage)));
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
    fetch('/api/settings/public', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (data?.success && data?.settings) {
          setSettings((current) => ({ ...current, ...data.settings }));
        }
      })
      .catch(() => undefined);
  }, []);

  const effectiveQuery = activeSearch.trim() || settings.query || 'all';
  const perPage = Math.max(1, Number(settings.per_page) || 24);

  const requestKey = useMemo(() => JSON.stringify({
    q: effectiveQuery,
    page,
    per_page: perPage,
    order,
    thumbsize: settings.thumbsize || 'medium',
    gay: settings.gay ?? 0,
    lq: settings.lq ?? 1,
  }), [effectiveQuery, page, perPage, order, settings.thumbsize, settings.gay, settings.lq]);

  useEffect(() => {
    const cached = readVideoCache(requestKey);
    let active = true;
    const controller = new AbortController();

    setError('');
    if (cached) {
      setVideos(cached.videos);
      setTotalCount(cached.totalCount);
      setTotalPages(Math.max(1, cached.totalPages));
      setLoading(false);
    } else {
      setVideos([]);
      setLoading(true);
    }

    const params = new URLSearchParams({
      q: effectiveQuery,
      page: String(page),
      per_page: String(perPage),
      order,
      thumbsize: settings.thumbsize || 'medium',
      gay: String(settings.gay ?? 0),
      lq: String(settings.lq ?? 1),
      format: 'json',
    });

    fetch(`/api/videos/search?${params.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'Unable to load videos');
        return data;
      })
      .then((data) => {
        if (!active) return;
        const list = getVideoList(data);
        const total = getTotalCount(data, list.length);
        const pages = getTotalPages(data, total, perPage);
        setVideos(list);
        setTotalCount(total);
        setTotalPages(pages);
        writeVideoCache(requestKey, { videos: list, totalCount: total, totalPages: pages });
      })
      .catch((err) => {
        if (!active || err?.name === 'AbortError') return;
        if (!cached) {
          setVideos([]);
          setTotalCount(0);
          setTotalPages(1);
        }
        setError(err instanceof Error ? err.message : 'Unable to load videos');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [requestKey, effectiveQuery, page, perPage, order, settings.thumbsize, settings.gay, settings.lq]);

  useEffect(() => {
    if (page > totalPages && totalPages >= 1) setPage(totalPages);
  }, [page, totalPages]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setActiveSearch(searchQuery.trim());
  };

  const changeOrder = (nextOrder: string) => {
    if (nextOrder === order) return;
    setOrder(nextOrder);
    setPage(1);
  };

  const goToPage = (nextPage: number) => {
    if (loading || nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageNumbers = useMemo(() => {
    const pages = new Set<number>([1, totalPages, page]);
    for (let offset = -2; offset <= 2; offset += 1) {
      const value = page + offset;
      if (value >= 1 && value <= totalPages) pages.add(value);
    }
    return [...pages].sort((a, b) => a - b);
  }, [page, totalPages]);

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
          {NAV.map(([value, label]) => <button key={value} onClick={() => changeOrder(value)} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${order === value ? 'bg-zinc-900 font-medium text-white' : 'text-zinc-500'}`}>{label}</button>)}
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-5 lg:px-6">
        <section className="mb-5 flex items-end justify-between gap-4"><div><p className="mb-1 text-xs font-medium text-red-600">ELOVEX</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{activeSearch ? `Results for “${activeSearch}”` : 'Discover trending videos'}</h1><p className="mt-1 text-sm text-zinc-500">Fresh videos and popular content.</p></div><div className="hidden text-right sm:block"><p className="text-[10px] uppercase tracking-wide text-zinc-400">Available</p><p className="text-lg font-semibold">{totalCount.toLocaleString()}</p></div></section>
        {error && <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

        <div className="relative min-h-[240px]">
          {videos.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {videos.map((video, index) => {
              const image = thumbnail(video);
              return <Link key={video.id ?? `${page}-${index}`} href={`/videos/${video.id}`} className="group overflow-hidden rounded-lg border border-zinc-200 bg-white">
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

        {totalPages > 1 && <footer className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-zinc-200 pt-4">
          <button disabled={loading || page <= 1} onClick={() => goToPage(page - 1)} className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-30">Previous</button>
          {pageNumbers.map((number, index) => {
            const previous = pageNumbers[index - 1];
            const showGap = previous !== undefined && number - previous > 1;
            return <span key={number} className="flex items-center gap-2">{showGap && <span className="px-1 text-zinc-400">…</span>}<button disabled={loading} onClick={() => goToPage(number)} aria-current={number === page ? 'page' : undefined} className={`min-w-9 rounded-md border px-3 py-1.5 text-sm ${number === page ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'} disabled:cursor-wait disabled:opacity-60`}>{number}</button></span>;
          })}
          <button disabled={loading || page >= totalPages} onClick={() => goToPage(page + 1)} className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-30">Next</button>
        </footer>}
        {totalPages > 1 && <p className="mt-2 text-center text-xs text-zinc-400">Page {page} of {totalPages}</p>}
      </main>
    </div>
  );
}
