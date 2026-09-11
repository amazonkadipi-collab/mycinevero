'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Clock, Eye, Menu, Play, Star, X } from 'lucide-react';

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

const DEFAULTS: PortalSettings = { query: 'all', order: 'latest', per_page: 50, thumbsize: 'small', gay: 0, lq: 1 };
const CATEGORY_NAV = [
  ['amateur', 'Amateur'], ['anal', 'Anal'], ['asian', 'Asian'], ['bbw', 'BBW'], ['big tits', 'Big Tits'],
  ['blonde', 'Blonde'], ['brunette', 'Brunette'], ['cosplay', 'Cosplay'], ['couples', 'Couples'], ['gay', 'Gay'],
  ['lesbian', 'Lesbian'], ['mature', 'Mature'], ['milf', 'MILF'], ['public', 'Public'], ['redhead', 'Redhead'],
  ['solo', 'Solo'], ['threesome', 'Threesome'], ['vintage', 'Vintage'], ['webcam', 'Webcam'],
];
const CACHE_PREFIX = 'elovex:videos:v9:';
const CACHE_TTL = 5 * 60 * 1000;

function readVideoCache(key: string): VideoCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const cached = JSON.parse(raw) as VideoCache;
    if (!Array.isArray(cached?.videos) || Date.now() - cached.savedAt > CACHE_TTL) return null;
    return cached;
  } catch { return null; }
}

function writeVideoCache(key: string, value: Omit<VideoCache, 'savedAt'>) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ...value, savedAt: Date.now() })); } catch {}
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
  const candidates = [data?.total_count, data?.total, data?.totalCount, data?.pagination?.total, data?.pagination?.total_count, data?.data?.total_count, data?.data?.total];
  const value = candidates.map(Number).find((n) => Number.isFinite(n) && n >= 0);
  return value ?? listLength;
}

function getTotalPages(data: any, totalCount: number, perPage: number): number {
  const candidates = [data?.total_pages, data?.totalPages, data?.pages, data?.pagination?.total_pages, data?.pagination?.pages, data?.data?.total_pages, data?.data?.totalPages];
  const value = candidates.map(Number).find((n) => Number.isFinite(n) && n >= 1);
  return value ? Math.floor(value) : Math.max(1, Math.ceil(totalCount / Math.max(1, perPage)));
}

export default function VideoPortalPage({ initialPage = 1, initialOrder = 'latest', initialSearch = '' }: { initialPage?: number; initialOrder?: string; initialSearch?: string }) {
  const safeInitialPage = Math.max(1, Number(initialPage) || 1);
  const [settings, setSettings] = useState(DEFAULTS);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const [order, setOrder] = useState(initialOrder);
  const [page, setPage] = useState(safeInitialPage);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const prefetching = useRef(new Set<string>());

  useEffect(() => {
    fetch('/api/settings/public', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => { if (data?.success && data?.settings) setSettings((current) => ({ ...current, ...data.settings })); })
      .catch(() => undefined);
  }, []);

  const effectiveQuery = activeSearch.trim() || settings.query || 'all';
  const perPage = 50;
  const thumbsize = 'small';
  const gayFilter = effectiveQuery.toLowerCase() === 'gay' ? 2 : settings.gay ?? 0;
  const requestKey = useMemo(() => JSON.stringify({ q: effectiveQuery, page, per_page: perPage, order, thumbsize, gay: gayFilter, lq: settings.lq ?? 1 }), [effectiveQuery, page, order, gayFilter, settings.lq]);

  const buildRequest = (targetPage: number) => {
    const params = new URLSearchParams({ category: effectiveQuery, page: String(targetPage), per_page: String(perPage), order, thumbsize, gay: String(gayFilter), lq: String(settings.lq ?? 1), format: 'json' });
    return `/api/videos/search?${params.toString()}`;
  };

  const prefetchPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === page) return;
    const key = JSON.stringify({ q: effectiveQuery, page: targetPage, per_page: perPage, order, thumbsize, gay: gayFilter, lq: settings.lq ?? 1 });
    if (readVideoCache(key) || prefetching.current.has(key)) return;
    prefetching.current.add(key);
    fetch(buildRequest(targetPage), { cache: 'force-cache', headers: { Accept: 'application/json' } })
      .then(async (response) => { if (!response.ok) return null; return response.json(); })
      .then((data) => {
        if (!data) return;
        const list = getVideoList(data); const total = getTotalCount(data, list.length); const pages = getTotalPages(data, total, perPage);
        writeVideoCache(key, { videos: list, totalCount: total, totalPages: pages });
      })
      .catch(() => undefined)
      .finally(() => { prefetching.current.delete(key); });
  };

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
      setLoading(true);
    }

    fetch(buildRequest(page), { signal: controller.signal, cache: 'force-cache', headers: { Accept: 'application/json' } })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data?.error || 'Unable to load videos'); return data; })
      .then((data) => {
        if (!active) return;
        const list = getVideoList(data); const total = getTotalCount(data, list.length); const pages = getTotalPages(data, total, perPage);
        setVideos(list); setTotalCount(total); setTotalPages(pages); writeVideoCache(requestKey, { videos: list, totalCount: total, totalPages: pages });
      })
      .catch((err) => {
        if (!active || err?.name === 'AbortError') return;
        if (!cached) { setVideos([]); setTotalCount(0); setTotalPages(1); }
        setError(err instanceof Error ? err.message : 'Unable to load videos');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [requestKey, effectiveQuery, page, order, settings.gay, settings.lq]);

  useEffect(() => {
    if (videos.length > 0 && totalPages > page) {
      const timer = window.setTimeout(() => prefetchPage(page + 1), 150);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [videos.length, totalPages, page, effectiveQuery, order, settings.gay, settings.lq]);

  useEffect(() => { if (!loading && page > totalPages && totalPages >= 1) setPage(totalPages); }, [loading, page, totalPages]);

  const syncListingUrl = (nextPage: number, nextSearch = activeSearch) => {
    const params = new URLSearchParams();
    if (nextSearch) params.set('category', nextSearch);
    const query = params.toString();
    const path = nextPage === 1 ? '/' : `/p/${nextPage}`;
    window.history.pushState({ page: nextPage, search: nextSearch }, '', `${path}${query ? `?${query}` : ''}`);
  };
  const changeCategory = (category: string) => {
    setMenuOpen(false);
    setActiveSearch(category);
    setPage(1);
    syncListingUrl(1, category);
    setSettings((current) => ({ ...current, gay: category === 'gay' ? 2 : 0 }));
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    const params = new URLSearchParams();
    if (activeSearch) params.set('category', activeSearch);
    const query = params.toString();
    window.location.assign(`${nextPage === 1 ? '/' : `/p/${nextPage}`}${query ? `?${query}` : ''}`);
  };

  useEffect(() => {
    const onPopState = () => {
      const match = window.location.pathname.match(/^\/p\/(\d+)\/?$/);
      const params = new URLSearchParams(window.location.search);
      setPage(match ? Math.max(1, Number(match[1])) : 1);
      setActiveSearch(params.get('category') || '');
      setOrder('latest');
    };
    onPopState();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const pageNumbers = useMemo(() => {
    const pages = new Set<number>([1, totalPages, page]);
    for (let offset = -2; offset <= 2; offset += 1) { const value = page + offset; if (value >= 1 && value <= totalPages) pages.add(value); }
    return [...pages].sort((a, b) => a - b);
  }, [page, totalPages]);

  const thumbnail = (video: VideoItem) => video.default_thumb?.src || video.thumbnail || video.thumbs?.[0]?.src || video.thumb || '';

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold text-zinc-900"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600"><Play className="h-3.5 w-3.5 fill-white text-white" /></span>ELO<span className="text-red-600">VEX</span></Link>
          <div className="flex items-center gap-2"><Link href="/admin" className="hidden rounded-md px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 sm:block">Admin</Link><button type="button" aria-label="Open categories menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100 lg:hidden">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
        </div>
        <nav aria-label="Video categories" className="hidden mx-auto max-w-[1400px] gap-2 overflow-x-auto px-4 pb-3 lg:flex lg:px-6">{CATEGORY_NAV.map(([value, label]) => <button key={value} onClick={() => changeCategory(value)} className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition ${activeSearch.toLowerCase() === value ? 'border-red-600 bg-red-600 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-red-300 hover:text-red-600'}`}>{label}</button>)}</nav>
        {menuOpen && <nav aria-label="Mobile video categories" className="grid grid-cols-2 gap-2 border-t border-zinc-100 px-4 py-3 lg:hidden">{CATEGORY_NAV.map(([value, label]) => <button key={value} onClick={() => changeCategory(value)} className={`rounded-lg border px-3 py-2.5 text-left text-sm ${activeSearch.toLowerCase() === value ? 'border-red-600 bg-red-600 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-700'}`}>{label}</button>)}</nav>}
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-5 lg:px-6">
        <section className="mb-5 flex items-end justify-between gap-4"><div><p className="mb-1 text-xs font-medium text-red-600">ELOVEX</p><h1 className="text-2xl font-bold tracking-tight capitalize sm:text-3xl">{activeSearch ? `${activeSearch} videos` : 'Choose a category'}</h1><p className="mt-1 text-sm text-zinc-500">Browse videos by category.</p></div><div className="hidden text-right sm:block"><p className="text-[10px] uppercase tracking-wide text-zinc-400">Available</p><p className="text-lg font-semibold">{totalCount.toLocaleString()}</p></div></section>
        {error && <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        <div className="relative min-h-[240px]">
          {videos.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{videos.slice(0, 50).map((video, index) => { const image = thumbnail(video); const videoId = video.id; const card = <><div className="relative aspect-video overflow-hidden bg-zinc-100">{image && <img src={image} alt={video.title || 'Video'} loading={index < 8 ? 'eager' : 'lazy'} fetchPriority={index < 8 ? 'high' : 'low'} decoding="async" className="h-full w-full object-cover" />}<span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white">{video.length_min || video.duration ? <><Clock className="h-3 w-3" />{video.length_min || video.duration}</> : 'Watch'}</span></div><div className="p-2.5"><h2 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-zinc-800">{video.title || 'Untitled video'}</h2><div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400"><span className="flex items-center gap-1"><Eye className="h-3 w-3" />{typeof video.views === 'number' ? video.views.toLocaleString() : '—'}</span><span className="flex items-center gap-1"><Star className="h-3 w-3 fill-current" />{video.rate ?? '—'}</span></div></div></>; return videoId ? <a key={videoId} href={`/videos/${encodeURIComponent(String(videoId))}`} className="group overflow-hidden rounded-lg border border-zinc-200 bg-white">{card}</a> : <div key={`${page}-${index}`} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">{card}</div>; })}</div>}
          {loading && videos.length === 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{Array.from({ length: 10 }).map((_, index) => <div key={index} className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"><div className="aspect-video bg-zinc-200" /><div className="p-3"><div className="h-4 w-full rounded bg-zinc-200" /><div className="mt-2 h-3 w-2/3 rounded bg-zinc-200" /></div></div>)}</div>}
          {loading && videos.length > 0 && <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs text-zinc-500 shadow-sm">Loading…</div>}
          {!loading && videos.length === 0 && !error && <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center"><p className="font-medium">Nothing here yet</p><p className="mt-1 text-sm text-zinc-500">Try another search or category.</p></div>}
        </div>
        {totalPages > 1 && <footer className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-zinc-200 pt-4"><button disabled={page <= 1} onClick={() => goToPage(page - 1)} className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-30">Previous</button>{pageNumbers.map((number, index) => { const previous = pageNumbers[index - 1]; const showGap = previous !== undefined && number - previous > 1; return <span key={number} className="flex items-center gap-2">{showGap && <span className="px-1 text-zinc-400">…</span>}<button disabled={number === page} onMouseEnter={() => prefetchPage(number)} onFocus={() => prefetchPage(number)} onClick={() => goToPage(number)} aria-current={number === page ? 'page' : undefined} className={`min-w-9 rounded-md border px-3 py-1.5 text-sm ${number === page ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>{number}</button></span>; })}<button disabled={page >= totalPages} onMouseEnter={() => prefetchPage(page + 1)} onFocus={() => prefetchPage(page + 1)} onClick={() => goToPage(page + 1)} className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-30">Next</button></footer>}
        {totalPages > 1 && <p className="mt-2 text-center text-xs text-zinc-400">Page {page} of {totalPages}</p>}
      </main>
    </div>
  );
}
