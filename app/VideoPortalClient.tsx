'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Clock, Eye, Menu, Play, Search, Star, X } from 'lucide-react';
import type { VideoItem } from '@/lib/video-listing';

const CATEGORIES = [
  ['amateur', 'Amateur'], ['anal', 'Anal'], ['asian', 'Asian'], ['bbw', 'BBW'], ['big tits', 'Big Tits'],
  ['blonde', 'Blonde'], ['brunette', 'Brunette'], ['cosplay', 'Cosplay'], ['couples', 'Couples'], ['gay', 'Gay'],
  ['lesbian', 'Lesbian'], ['mature', 'Mature'], ['milf', 'MILF'], ['public', 'Public'], ['redhead', 'Redhead'],
  ['solo', 'Solo'], ['threesome', 'Threesome'], ['vintage', 'Vintage'], ['webcam', 'Webcam'],
] as const;

type Props = {
  initialPage: number;
  initialSearch: string;
  initialOrder: string;
  initialVideos: VideoItem[];
  initialTotalCount: number;
  initialTotalPages: number;
  initialError?: string;
};

type Settings = { query: string; order: string; gay: number; lq: number };
const DEFAULTS: Settings = { query: 'all', order: 'latest', gay: 0, lq: 1 };
const CACHE_PREFIX = 'elovex:videos:v11:';
const CACHE_TTL = 5 * 60 * 1000;

function parseResponse(text: string): any {
  const clean = text.replace(/^\uFEFF/, '').trim();
  if (!clean) throw new Error('Video API returned an empty response');
  try { return JSON.parse(clean); } catch { throw new Error('Video API returned invalid JSON'); }
}

function listFrom(data: any): VideoItem[] {
  if (Array.isArray(data?.videos)) return data.videos;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.videos)) return data.data.videos;
  return Array.isArray(data) ? data : [];
}

function countFrom(data: any, length: number) {
  const values = [data?.total_count, data?.total, data?.totalCount, data?.pagination?.total, data?.pagination?.total_count];
  const n = values.map(Number).find((value) => Number.isFinite(value) && value >= 0);
  return n ?? length;
}

function pagesFrom(data: any, total: number) {
  const values = [data?.total_pages, data?.totalPages, data?.pages, data?.pagination?.total_pages];
  const n = values.map(Number).find((value) => Number.isFinite(value) && value >= 1);
  return n ? Math.floor(n) : Math.max(1, Math.ceil(total / 50));
}

function cacheRead(key: string) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const value = JSON.parse(raw);
    return Array.isArray(value?.videos) && Date.now() - Number(value.savedAt) < CACHE_TTL ? value : null;
  } catch { return null; }
}

function cacheWrite(key: string, value: any) {
  try { sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ...value, savedAt: Date.now() })); } catch {}
}

export default function VideoPortalClient(props: Props) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [activeSearch, setActiveSearch] = useState(props.initialSearch);
  const [page, setPage] = useState(Math.max(1, props.initialPage));
  const [videos, setVideos] = useState<VideoItem[]>(props.initialVideos);
  const [totalCount, setTotalCount] = useState(props.initialTotalCount);
  const [totalPages, setTotalPages] = useState(Math.max(1, props.initialTotalPages));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(props.initialError || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(props.initialSearch);
  const prefetching = useRef(new Set<string>());

  const effectiveQuery = activeSearch.trim() || settings.query || 'all';
  const requestKey = useMemo(() => JSON.stringify({ q: effectiveQuery, page, order: props.initialOrder, gay: effectiveQuery.toLowerCase() === 'gay' ? 2 : settings.gay, lq: settings.lq }), [effectiveQuery, page, settings.gay, settings.lq, props.initialOrder]);

  useEffect(() => {
    fetch('/api/settings/public', { cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(async (response) => {
        const data = parseResponse(await response.text());
        if (!response.ok) throw new Error(data?.error || `Settings API returned HTTP ${response.status}`);
        return data;
      })
      .then((data) => { if (data?.settings) setSettings((current) => ({ ...current, ...data.settings })); })
      .catch(() => undefined);
  }, []);

  const buildUrl = (targetPage: number) => {
    const params = new URLSearchParams({
      category: effectiveQuery,
      query: effectiveQuery,
      page: String(targetPage),
      per_page: '50',
      order: props.initialOrder || 'latest',
      thumbsize: 'small',
      gay: String(effectiveQuery.toLowerCase() === 'gay' ? 2 : settings.gay),
      lq: String(settings.lq ?? 1),
      format: 'json',
    });
    return `/api/videos/search?${params.toString()}`;
  };

  useEffect(() => {
    const cached = cacheRead(requestKey);
    if (cached) {
      queueMicrotask(() => {
        setVideos(cached.videos);
        setTotalCount(cached.totalCount);
        setTotalPages(Math.max(1, cached.totalPages));
        setError('');
      });
      return;
    }
    if (page === props.initialPage && activeSearch === props.initialSearch) return;

    const controller = new AbortController();
    // Loading state intentionally tracks the external fetch lifecycle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    fetch(buildUrl(page), { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(async (response) => {
        const data = parseResponse(await response.text());
        if (!response.ok) throw new Error(data?.error || `Video API returned HTTP ${response.status}`);
        return data;
      })
      .then((data) => {
        const list = listFrom(data);
        const total = countFrom(data, list.length);
        const pages = pagesFrom(data, total);
        setVideos(list); setTotalCount(total); setTotalPages(pages);
        cacheWrite(requestKey, { videos: list, totalCount: total, totalPages: pages });
      })
      .catch((err) => { if (err?.name !== 'AbortError') { setVideos([]); setTotalCount(0); setTotalPages(1); setError(err instanceof Error ? err.message : 'Unable to load videos'); } })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [requestKey, page, activeSearch, props.initialPage, props.initialSearch]);

  const changeCategory = (category: string) => {
    setMenuOpen(false); setSearchOpen(false); setActiveSearch(category); setPage(1); setError('');
    window.history.pushState({}, '', `/?category=${encodeURIComponent(category)}`);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchDraft.trim();
    setMenuOpen(false); setSearchOpen(false); setActiveSearch(query); setPage(1); setError('');
    window.history.pushState({}, '', query ? `/?category=${encodeURIComponent(query)}` : '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  useEffect(() => {
    const onPop = () => {
      const match = window.location.pathname.match(/^\/p\/(\d+)\/?$/);
      const params = new URLSearchParams(window.location.search);
      setPage(match ? Math.max(1, Number(match[1])) : 1);
      setActiveSearch(params.get('category') || '');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return;
    const href = `${next === 1 ? '/' : `/p/${next}`}${activeSearch ? `?category=${encodeURIComponent(activeSearch)}` : ''}`;
    window.location.assign(href);
  };

  const pageNumbers = useMemo(() => {
    const set = new Set<number>([1, totalPages, page]);
    for (let i = -2; i <= 2; i += 1) { const n = page + i; if (n >= 1 && n <= totalPages) set.add(n); }
    return [...set].sort((a, b) => a - b);
  }, [page, totalPages]);

  const thumb = (video: VideoItem) => video.default_thumb?.src || video.thumbnail || video.thumbs?.[0]?.src || video.thumb || '';

  return <div className="min-h-screen bg-white text-zinc-900">
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold"> <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600"><Play className="h-3.5 w-3.5 fill-white text-white" /></span>ELO<span className="text-red-600">VEX</span></Link>
        <form onSubmit={submitSearch} className="hidden min-w-0 max-w-xl flex-1 items-center gap-2 sm:flex"><div className="flex min-w-0 flex-1 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3"><Search className="h-4 w-4 shrink-0 text-zinc-400" /><input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search videos" aria-label="Search videos" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" /></div><button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">Search</button></form><div className="flex items-center gap-1"><Link href="/admin" className="hidden rounded-md px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 sm:block">Admin</Link><button type="button" aria-label={searchOpen ? 'Close search' : 'Open search'} aria-expanded={searchOpen} onClick={() => { setSearchOpen((v) => !v); setMenuOpen(false); }} className="rounded-md p-2 hover:bg-zinc-100 sm:hidden"><Search className="h-5 w-5" /></button><button type="button" aria-label={menuOpen ? 'Close categories menu' : 'Open categories menu'} aria-expanded={menuOpen} onClick={() => { setMenuOpen((v) => !v); setSearchOpen(false); }} className="rounded-md p-2 hover:bg-zinc-100 lg:hidden">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
      </div>
      <nav aria-label="Video categories" className="hidden mx-auto max-w-[1400px] gap-2 overflow-x-auto px-4 pb-3 lg:flex lg:px-6">
        <Link href="/" onClick={() => changeCategory('')} className="whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Best Videos</Link><Link href="/" className="whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 hover:border-red-300 hover:text-red-600">Fresh Uploads</Link><span className="mx-1 border-l border-zinc-200" aria-hidden="true" />
        {CATEGORIES.map(([value, label]) => <Link key={value} href={`/?category=${encodeURIComponent(value)}`} onClick={() => changeCategory(value)} className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${activeSearch.toLowerCase() === value ? 'border-red-600 bg-red-600 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-red-300 hover:text-red-600'}`}>{label}</Link>)}
      </nav>
      <div className="border-t border-zinc-100 px-4 py-3 sm:hidden"><form onSubmit={submitSearch} className="flex gap-2"><div className="flex min-w-0 flex-1 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3"><Search className="h-4 w-4 shrink-0 text-zinc-400" /><input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search videos" aria-label="Search videos" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" /></div><button type="submit" className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white">Search</button></form></div>
      {menuOpen && <div className="border-t border-zinc-100 px-4 py-3 lg:hidden"><nav aria-label="Mobile video categories" className="grid grid-cols-2 gap-2">{CATEGORIES.map(([value, label]) => <Link key={value} href={`/?category=${encodeURIComponent(value)}`} onClick={() => { setMenuOpen(false); setActiveSearch(value); }} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm">{label}</Link>)}</nav></div>}
    </header>

    <main className="mx-auto max-w-[1400px] px-4 py-5 lg:px-6">
      <section className="mb-5 flex items-end justify-between gap-4"><div><p className="mb-1 text-xs font-medium text-red-600">ELOVEX</p><h1 className="text-2xl font-bold tracking-tight capitalize sm:text-3xl">{activeSearch ? `${activeSearch} adult videos` : 'Free Adult Videos, Porn Videos & Trending Clips'}</h1><p className="mt-1 text-sm text-zinc-500">Browse free adult videos, trending clips, popular categories, and fresh uploads.</p></div><div className="hidden text-right sm:block"><p className="text-[10px] uppercase tracking-wide text-zinc-400">Available</p><p className="text-lg font-semibold">{totalCount.toLocaleString()}</p></div></section>
      {error && <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {loading && <div className="mb-4 text-sm text-zinc-500">Loading videos…</div>}
      <div className="relative min-h-[240px]">
        {videos.length > 0 ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{videos.slice(0, 50).map((video, index) => {
          const id = String(video.id || '').trim(); const image = thumb(video); const enriched = video as VideoItem & { uploader?: string; author?: string; quality?: string; has_subtitles?: boolean }; const card = <><div className="relative aspect-video overflow-hidden bg-zinc-100">{image && <img src={image} alt={video.title || 'Adult video'} loading={index < 8 ? 'eager' : 'lazy'} decoding="async" sizes="(max-width: 639px) 100vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw" className="h-full w-full object-cover" />}<div className="absolute bottom-2 left-2 flex gap-1"><span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white">{enriched.quality || 'HD'}</span>{enriched.has_subtitles && <span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white">CC</span>}<span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white">{video.length_min || video.duration || 'Watch'}</span></div></div><div className="p-2.5"><h2 className="line-clamp-2 min-h-10 text-sm font-medium leading-5">{video.title || 'Untitled video'}</h2><p className="mt-1 truncate text-xs text-zinc-500">{enriched.uploader || enriched.author || 'Eporner provider'}</p><div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400"><span className="flex items-center gap-1"><Eye className="h-3 w-3" />{typeof video.views === 'number' ? video.views.toLocaleString() : '—'}</span><span className="flex items-center gap-1"><Star className="h-3 w-3" />{video.rate ?? '—'}</span></div></div></>;
          return id ? <Link key={`${id}-${index}`} href={`/videos/${encodeURIComponent(id)}`} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">{card}</Link> : <div key={index} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">{card}</div>;
        })}</div> : !loading && <div className="rounded-xl border border-zinc-200 p-8 text-center text-sm text-zinc-500">No videos are available right now.</div>}
      </div>

      {totalPages > 1 && <nav aria-label="Video pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2"><button disabled={page <= 1} onClick={() => goToPage(page - 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Previous</button>{pageNumbers.map((n) => <button key={n} aria-current={n === page ? 'page' : undefined} onClick={() => goToPage(n)} className={`rounded-lg border px-3 py-2 text-sm ${n === page ? 'border-red-600 bg-red-600 text-white' : ''}`}>{n}</button>)}<button disabled={page >= totalPages} onClick={() => goToPage(page + 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Next</button></nav>}
    </main>
  </div>;
}
