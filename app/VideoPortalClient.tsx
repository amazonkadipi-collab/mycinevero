'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarDays, Clock3, Eye, Flag, Menu, Search, Settings, SlidersHorizontal, Star, UserRound, Video, X } from 'lucide-react';
import type { VideoItem } from '@/lib/video-listing';

const CATEGORIES = [
  ['amateur', 'Amateur'], ['anal', 'Anal'], ['asian', 'Asian'], ['bbw', 'BBW'], ['big tits', 'Big Tits'],
  ['blonde', 'Blonde'], ['brunette', 'Brunette'], ['cosplay', 'Cosplay'], ['couples', 'Couples'], ['gay', 'Gay'],
  ['lesbian', 'Lesbian'], ['mature', 'Mature'], ['milf', 'MILF'], ['public', 'Public'], ['redhead', 'Redhead'],
  ['solo', 'Solo'], ['threesome', 'Threesome'], ['vintage', 'Vintage'], ['webcam', 'Webcam'],
] as const;

const SORT_OPTIONS = [
  ['most-popular', 'Relevance'],
  ['latest', 'Newest'],
  ['top-rated', 'Rating'],
  ['longest', 'Length'],
  ['top-monthly', 'Views'],
  ['random', 'Random'],
] as const;

const RESULT_FILTERS = [
  { key: 'sort', label: 'Sort by', options: SORT_OPTIONS },
  { key: 'date', label: 'Date', options: [['all', 'Date'], ['3d', 'Last 3 days'], ['week', 'This week'], ['month', 'This month'], ['3m', 'Last 3 months'], ['6m', 'Last 6 months']] },
  { key: 'duration', label: 'Duration', options: [['all', 'Duration'], ['short', 'Short videos (1–3 min)'], ['medium', 'Medium videos (3–10 min)'], ['long', 'Long videos (10+ min)'], ['10-20', 'Long videos (10–20 min)'], ['20plus', 'Long videos (20+ min)']] },
  { key: 'quality', label: 'Video quality', options: [['all', 'Video quality'], ['360p', '360p'], ['480p', '480p'], ['720p', '720p'], ['1080p', '1080p']] },
  { key: 'viewed', label: 'Viewed videos', options: [['all', 'Viewed videos'], ['hide', 'Hide']] },
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
  const [sortOrder, setSortOrder] = useState(props.initialOrder || 'latest');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({ date: 'all', duration: 'all', quality: 'all', viewed: 'all' });
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(props.initialSearch);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const prefetching = useRef(new Set<string>());

  const effectiveQuery = activeSearch.trim() || settings.query || 'all';
  const searchSuggestions = useMemo(() => {
    const query = searchDraft.trim().toLowerCase();
    if (!query) return [];
    const sources = [...CATEGORIES.map(([, label]) => label), ...videos.map((video) => video.title || '')];
    const unique = new Set<string>();
    for (const source of sources) {
      const words = source.trim().split(/\s+/).filter(Boolean).slice(0, 12);
      for (let index = 0; index < words.length; index += 1) {
        for (let size = 1; size <= 2 && index + size <= words.length; size += 1) {
          const value = words.slice(index, index + size).join(' ');
          if (value.toLowerCase().includes(query)) unique.add(value);
        }
      }
    }
    return [...unique].slice(0, 6);
  }, [searchDraft, videos]);
  const requestKey = useMemo(() => JSON.stringify({ q: effectiveQuery, page, order: sortOrder, gay: effectiveQuery.toLowerCase() === 'gay' ? 2 : settings.gay, lq: settings.lq }), [effectiveQuery, page, settings.gay, settings.lq, sortOrder]);

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
      order: sortOrder || 'latest',
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
    if (page === props.initialPage && activeSearch === props.initialSearch && sortOrder === props.initialOrder) return;

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
  }, [requestKey, page, activeSearch, props.initialPage, props.initialSearch, sortOrder]);

  const changeSort = (order: string) => {
    setSortOrder(order); setPage(1); setError('');
    const params = new URLSearchParams(window.location.search);
    if (activeSearch) params.set('category', activeSearch);
    params.set('order', order);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const changeFilter = (key: string, value: string) => {
    if (key === 'sort') { setOpenFilter(null); changeSort(value); return; }
    setFilterValues((current) => ({ ...current, [key]: value }));
    const params = new URLSearchParams(window.location.search);
    if (activeSearch) params.set('category', activeSearch);
    params.set(key, value);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    setOpenFilter(null);
  };

  const changeCategory = (category: string) => {
    setMenuOpen(false); setSearchOpen(false); setActiveSearch(category); setPage(1); setError('');
    window.history.pushState({}, '', `/?category=${encodeURIComponent(category)}`);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchDraft.trim();
    setMenuOpen(false); setSearchOpen(false); setSuggestionsOpen(false); setActiveSearch(query); setPage(1); setError('');
    window.history.pushState({}, '', query ? `/?category=${encodeURIComponent(query)}` : '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  useEffect(() => {
    const onPop = () => {
      const match = window.location.pathname.match(/^\/p\/(\d+)\/?$/);
      const params = new URLSearchParams(window.location.search);
      setPage(match ? Math.max(1, Number(match[1])) : 1);
      setActiveSearch(params.get('category') || '');
      setSortOrder(params.get('order') || props.initialOrder || 'latest');
      setFilterValues({ date: params.get('date') || 'all', duration: params.get('duration') || 'all', quality: params.get('quality') || 'all', viewed: params.get('viewed') || 'all' });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return;
    const params = new URLSearchParams();
    if (activeSearch) params.set('category', activeSearch);
    if (sortOrder) params.set('order', sortOrder);
    const href = `${next === 1 ? '/' : `/p/${next}`}${params.toString() ? `?${params.toString()}` : ''}`;
    window.location.assign(href);
  };

  const pageNumbers = useMemo(() => {
    const set = new Set<number>([1, totalPages, page]);
    for (let i = -2; i <= 2; i += 1) { const n = page + i; if (n >= 1 && n <= totalPages) set.add(n); }
    return [...set].sort((a, b) => a - b);
  }, [page, totalPages]);

  const thumb = (video: VideoItem) => video.default_thumb?.src || video.thumbnail || video.thumbs?.[0]?.src || video.thumb || '';

  return <div className="min-h-screen bg-white text-zinc-900">
    <header data-search-open={searchOpen} className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 lg:px-6"><button type="button" aria-label={menuOpen ? 'Close categories menu' : 'Open categories menu'} aria-expanded={menuOpen} onClick={() => { setMenuOpen((v) => !v); setSearchOpen(false); }} className="order-1 rounded-md p-1.5 hover:bg-zinc-100"><Menu className="h-7 w-7" /></button><Link href="/" className="order-2 mx-auto flex items-center gap-1 text-2xl font-black tracking-tight sm:text-3xl"><span className="text-zinc-950">ELO</span><span className="text-red-600">VEX</span></Link><div className="order-3 flex items-center gap-1"><button type="button" aria-label="Account" className="rounded-md p-1.5 hover:bg-zinc-100"><UserRound className="h-6 w-6" /></button><button type="button" aria-label="Settings" className="rounded-md p-1.5 hover:bg-zinc-100"><Settings className="h-6 w-6" /></button></div></div>
      <div className="border-t border-zinc-100 px-4 py-3"><div className="relative mx-auto max-w-[900px]"><form onSubmit={submitSearch} className="flex gap-2"><div className="flex min-w-0 flex-1 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3"><Search className="h-5 w-5 shrink-0 text-zinc-700" /><input value={searchDraft} onFocus={() => setSuggestionsOpen(true)} onChange={(event) => { setSearchDraft(event.target.value.slice(0, 80)); setSuggestionsOpen(true); }} placeholder="Search videos" aria-label="Search videos" autoComplete="off" className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-base outline-none" /></div><button type="submit" aria-label="Search" className="rounded-lg bg-zinc-100 px-4 text-zinc-950 hover:bg-zinc-200"><Search className="h-6 w-6" /></button></form>{suggestionsOpen && searchSuggestions.length > 0 && <div className="absolute left-0 right-12 top-full z-50 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">{searchSuggestions.map((suggestion) => <button key={suggestion} type="button" onMouseDown={() => { setSearchDraft(suggestion); setSuggestionsOpen(false); }} className="block w-full px-4 py-2 text-left text-sm hover:bg-zinc-50">{suggestion}</button>)}</div>}</div></div>
      {menuOpen && <div className="border-t border-zinc-100 bg-white px-4 py-3 shadow-sm"><nav aria-label="Video categories" className="mx-auto grid max-w-[1400px] grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{CATEGORIES.map(([value, label]) => <Link key={value} href={`/?category=${encodeURIComponent(value)}`} onClick={() => { setMenuOpen(false); setActiveSearch(value); }} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm hover:border-red-300 hover:text-red-600">{label}</Link>)}</nav></div>}
    </header>

    <main className="mx-auto max-w-[1400px] px-4 py-5 lg:px-6">
      <section className="mb-5 flex items-end justify-between gap-4"><div><p className="mb-1 text-xs font-medium text-red-600">ELOVEX</p><h1 className="text-2xl font-bold tracking-tight capitalize sm:text-3xl">{activeSearch ? `${activeSearch} adult videos` : 'Free Adult Videos, Porn Videos & Trending Clips'}</h1><p className="mt-1 text-sm text-zinc-500">Browse free adult videos, trending clips, popular categories, and fresh uploads.</p></div><div className="hidden text-right sm:block"><p className="text-[10px] uppercase tracking-wide text-zinc-400">Available</p><p className="text-lg font-semibold">{totalCount.toLocaleString()}</p></div></section>
      {activeSearch.trim() && <section className="mb-5" aria-label="Search result filters"><div className="flex items-center gap-8 border-b border-zinc-300"><button type="button" className="border-b-2 border-zinc-700 px-2 py-3 text-base font-semibold text-zinc-900">Free <span className="font-normal text-zinc-500">{totalCount.toLocaleString()}</span></button><button type="button" className="px-2 py-3 text-base font-semibold text-zinc-500">RED <span className="font-normal text-zinc-500">0</span></button></div><div className="mt-4 flex items-center justify-between gap-3"><h2 className="flex min-w-0 items-center gap-2 text-2xl font-bold capitalize sm:text-3xl">{activeSearch} <span className="text-base font-normal text-zinc-500">({totalCount.toLocaleString()} results)</span></h2><button type="button" className="flex shrink-0 items-center gap-1 text-sm text-zinc-700 hover:text-red-600"><Flag className="h-4 w-4" />Report</button></div><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">{RESULT_FILTERS.map(({ key, label, options }, index) => { const Icon = [SlidersHorizontal, CalendarDays, Clock3, Video, Eye][index]; const value = key === 'sort' ? sortOrder : filterValues[key]; const selected = options.find(([optionValue]) => optionValue === value)?.[1] || label; const isOpen = openFilter === key; return <div key={key} className={`relative ${key === 'sort' ? 'sm:col-span-2' : ''}`}><button type="button" aria-expanded={isOpen} aria-label={label} onClick={() => setOpenFilter(isOpen ? null : key)} className="flex w-full items-center gap-3 rounded-md bg-zinc-100 px-4 py-3 text-left text-lg"><Icon className="h-6 w-6 shrink-0 text-zinc-950" /><span className={key === 'sort' ? 'italic' : ''}>{key === 'sort' ? `${label} : ${selected}` : selected}</span><span className="ml-auto text-2xl font-bold leading-none">⌄</span></button>{isOpen && <div className="absolute left-0 right-0 top-full z-50 max-h-72 overflow-y-auto bg-zinc-900 p-1 text-white shadow-2xl">{options.map(([optionValue, optionLabel]) => <button key={optionValue} type="button" onClick={() => changeFilter(key, optionValue)} className={`block w-full px-4 py-3 text-left text-base hover:bg-zinc-700 ${optionValue === value ? 'bg-zinc-700' : ''}`}>{optionLabel}</button>)}</div>}</div>; })}</div></section>}
      {error && <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {loading && <div className="mb-4 text-sm text-zinc-500">Loading videos…</div>}
      <div className="relative min-h-[240px]">
        {videos.length > 0 ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{videos.slice(0, 50).map((video, index) => {
          const id = String(video.id || '').trim(); const image = thumb(video); const enriched = video as VideoItem & { uploader?: string; author?: string; quality?: string; has_subtitles?: boolean }; const card = <><div className="relative aspect-video overflow-hidden bg-zinc-100">{image && <img src={image} alt={video.title || 'Adult video'} loading={index < 8 ? 'eager' : 'lazy'} decoding="async" sizes="(max-width: 639px) 100vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw" className="h-full w-full object-cover" />}<div className="absolute bottom-2 left-2 flex gap-1"><span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white">{enriched.quality || 'HD'}</span>{enriched.has_subtitles && <span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white">CC</span>}<span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white">{video.length_min || video.duration || 'Watch'}</span></div></div><div className="p-2.5"><h2 className="line-clamp-2 min-h-10 text-sm font-medium leading-5">{video.title || 'Untitled video'}</h2><p className="mt-1 truncate text-xs text-zinc-500">{enriched.uploader || enriched.author || 'Eporner provider'}</p><div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400"><span className="flex items-center gap-1"><Eye className="h-3 w-3" />{typeof video.views === 'number' ? video.views.toLocaleString() : '—'}</span><span className="flex items-center gap-1"><Star className="h-3 w-3" />{video.rate ?? '—'}</span></div></div></>;
          return id ? <Link key={`${id}-${index}`} href={`/videos/${encodeURIComponent(id)}`} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">{card}</Link> : <div key={index} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">{card}</div>;
        })}</div> : !loading && <div className="rounded-xl border border-zinc-200 p-8 text-center text-sm text-zinc-500">No videos are available right now.</div>}
      </div>

      {totalPages > 1 && <nav aria-label="Video pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2"><button disabled={page <= 1} onClick={() => goToPage(page - 1)} className="hidden rounded-md border border-zinc-200 px-4 py-3 text-sm disabled:opacity-40 sm:block">Previous</button>{pageNumbers.map((n) => <button key={n} aria-current={n === page ? 'page' : undefined} onClick={() => goToPage(n)} className={`min-w-12 rounded-md border px-3 py-3 text-base ${n === page ? 'border-zinc-600 bg-zinc-600 text-white' : 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100'}`}>{n}</button>)}<button disabled={page >= totalPages} onClick={() => goToPage(page + 1)} aria-label="Next page" className="rounded-md border border-transparent px-3 py-3 text-3xl leading-none disabled:opacity-40">›</button></nav>}
    </main>
  </div>;
}
