'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, Search, SlidersHorizontal, X } from 'lucide-react';
import type { VideoItem } from '@/lib/video-listing';

type Props = {
  initialPage: number;
  initialSearch: string;
  initialOrder: string;
  initialVideos: VideoItem[];
  initialTotalCount: number;
  initialTotalPages: number;
  initialError?: string;
  initialFilters?: { date: string; duration: string; quality: string; viewed: string };
};

const SORT_OPTIONS = [
  ['most-popular', 'Popular'],
  ['latest', 'Newest'],
  ['top-rated', 'Top rated'],
  ['longest', 'Longest'],
  ['top-monthly', 'Most viewed'],
  ['random', 'Random'],
] as const;

const FILTERS = [
  { key: 'date', label: 'Date', options: [['all', 'Any date'], ['3d', 'Last 3 days'], ['week', 'This week'], ['month', 'This month'], ['3m', 'Last 3 months']] },
  { key: 'duration', label: 'Duration', options: [['all', 'Any length'], ['short', 'Short'], ['medium', 'Medium'], ['long', 'Long']] },
  { key: 'quality', label: 'Quality', options: [['all', 'Any quality'], ['360p', '360p'], ['480p', '480p'], ['720p', '720p'], ['1080p', '1080p']] },
] as const;

function thumb(video: VideoItem) {
  return video.default_thumb?.src || video.thumbnail || video.thumbs?.[0]?.src || video.thumb || '';
}

function duration(video: VideoItem) {
  return video.length_min || video.duration || '';
}

function formatViews(value?: number) {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value));
}

export default function VideoPortalClient(props: Props) {
  const [query, setQuery] = useState(props.initialSearch || '');
  const [draft, setDraft] = useState(props.initialSearch || '');
  const [order, setOrder] = useState(props.initialOrder || 'latest');
  const [page, setPage] = useState(Math.max(1, props.initialPage));
  const [videos, setVideos] = useState(props.initialVideos);
  const [totalPages, setTotalPages] = useState(Math.max(1, props.initialTotalPages));
  const [totalCount, setTotalCount] = useState(props.initialTotalCount);
  const [error, setError] = useState(props.initialError || '');
  const [filters, setFilters] = useState<Record<string, string>>(props.initialFilters || { date: 'all', duration: 'all', quality: 'all', viewed: 'all' });
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(Boolean(props.initialSearch));
  const searchInputRef = useRef<HTMLInputElement>(null);

  const paramsFor = useMemo(() => {
    const params = new URLSearchParams({ query: query || 'all', page: String(page), per_page: '50', order, format: 'json' });
    for (const [key, value] of Object.entries(filters)) if (value && value !== 'all') params.set(key, value);
    return params;
  }, [query, page, order, filters]);

  useEffect(() => {
    if (page === 1 && query === props.initialSearch && order === props.initialOrder && !props.initialError) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(`/api/videos/search?${paramsFor.toString()}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || `Video API returned HTTP ${response.status}`);
        return data;
      })
      .then((data) => {
        const list = Array.isArray(data?.videos) ? data.videos : [];
        setVideos(list);
        setTotalCount(Number(data?.total_count || list.length));
        setTotalPages(Math.max(1, Number(data?.total_pages || (list.length ? Math.ceil(Number(data?.total_count || list.length) / 50) : 1))));
      })
      .catch((err) => { if (err?.name !== 'AbortError') { setVideos([]); setTotalCount(0); setTotalPages(1); setError(err instanceof Error ? err.message : 'Unable to load videos'); } })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [paramsFor, page, query, order, filters, props.initialError, props.initialOrder, props.initialSearch]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = draft.trim();
    setQuery(value);
    setPage(1);
    setSearchOpen(true);
    const url = value ? `/?k=${encodeURIComponent(value)}` : '/';
    window.history.pushState({}, '', url);
  };

  const openSearch = () => {
    setMenuOpen(false);
    setSearchOpen(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const changeOrder = (value: string) => {
    setOrder(value);
    setPage(1);
  };

  const changeFilter = (key: string, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return;
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageNumbers = useMemo(() => {
    const numbers = new Set<number>([1, totalPages, page]);
    for (let i = -2; i <= 2; i += 1) {
      const n = page + i;
      if (n >= 1 && n <= totalPages) numbers.add(n);
    }
    return [...numbers].sort((a, b) => a - b);
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="relative mx-auto flex h-16 max-w-[1400px] items-center px-4 lg:px-6">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <button
              type="button"
              aria-label="Search videos"
              onClick={openSearch}
              className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          <Link href="/" aria-label="Elovex home" className="absolute left-1/2 -translate-x-1/2 text-xl font-black tracking-tight">
            <span className="text-zinc-950">ELO</span><span className="text-red-600">VEX</span>
          </Link>
        </div>

        {menuOpen && (
          <div className="border-t border-zinc-200 bg-white shadow-sm">
            <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 text-sm lg:px-6">
              <Link href="/" onClick={() => setMenuOpen(false)} className="font-medium text-zinc-900 hover:text-red-600">Home</Link>
              <button type="button" onClick={openSearch} className="font-medium text-zinc-600 hover:text-red-600">Search</button>
            </div>
          </div>
        )}

        {searchOpen && (
          <div className="border-t border-zinc-200 bg-white">
            <form onSubmit={submitSearch} className="mx-auto flex max-w-[900px] items-center gap-2 px-4 py-3">
              <div className="flex min-w-0 flex-1 items-center rounded-md border border-zinc-300 bg-white px-3">
                <Search className="h-4 w-4 shrink-0 text-zinc-400" />
                <input ref={searchInputRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search videos" aria-label="Search videos" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" />
              </div>
              <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Search</button>
              {!query && <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100"><X className="h-5 w-5" /></button>}
            </form>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-5 lg:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{query ? `Videos for “${query}”` : 'Discover videos'}</h1>
            <p className="mt-1 text-sm text-zinc-500">{totalCount.toLocaleString()} results</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-zinc-500"><SlidersHorizontal className="h-4 w-4" /> Sort</div>
            <select value={order} onChange={(event) => changeOrder(event.target.value)} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm">
              {SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {FILTERS.map((filter) => (
              <select key={filter.key} value={filters[filter.key] || 'all'} onChange={(event) => changeFilter(filter.key, event.target.value)} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm">
                {filter.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            ))}
          </div>
        </div>

        {loading && <div className="py-16 text-center text-sm text-zinc-500">Loading videos…</div>}
        {!loading && error && <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>}
        {!loading && !error && videos.length === 0 && <div className="rounded-lg border border-zinc-200 p-12 text-center text-zinc-500">No videos found.</div>}

        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {videos.map((video) => {
              const id = String(video.id || '');
              if (!id) return null;
              const image = thumb(video);
              return (
                <Link key={id} href={`/videos/${encodeURIComponent(id)}`} className="group min-w-0">
                  <div className="aspect-video overflow-hidden rounded-md bg-zinc-100">
                    {image ? <img src={image} alt={video.title || 'Video thumbnail'} loading="lazy" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-sm text-zinc-400">No preview</div>}
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 group-hover:text-red-600">{video.title || 'Untitled video'}</h2>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    {video.uploader && <span className="truncate">{video.uploader}</span>}
                    {duration(video) && <span>{duration(video)}</span>}
                    {video.views !== undefined && <span>{formatViews(video.views)} views</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex flex-wrap justify-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="rounded-md border px-3 py-2 text-sm disabled:opacity-40">Previous</button>
            {pageNumbers.map((number) => <button key={number} type="button" onClick={() => goToPage(number)} className={`rounded-md border px-3 py-2 text-sm ${number === page ? 'border-red-600 bg-red-600 text-white' : 'bg-white'}`}>{number}</button>)}
            <button type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)} className="rounded-md border px-3 py-2 text-sm disabled:opacity-40">Next</button>
          </nav>
        )}
      </main>
    </div>
  );
}
