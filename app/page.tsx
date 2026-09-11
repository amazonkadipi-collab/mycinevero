'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Clock, ExternalLink, Eye, Play, Search, Settings, Star, X } from 'lucide-react';

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
  url?: string;
  embed?: string;
  embedUrl?: string;
  embed_url?: string;
}

interface Settings {
  query: string;
  order: string;
  per_page: number;
  thumbsize: string;
  gay: number;
  lq: number;
  format: string;
}

const DEFAULTS: Settings = { query: 'all', order: 'latest', per_page: 24, thumbsize: 'medium', gay: 0, lq: 1, format: 'json' };
const orders = [
  ['latest', 'Latest'], ['longest', 'Longest'], ['shortest', 'Shortest'],
  ['top-rated', 'Top Rated'], ['most-popular', 'Most Popular'],
  ['top-weekly', 'Top Weekly'], ['top-monthly', 'Top Monthly'],
];

export default function VideoPortalPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => { if (data?.success) setSettings({ ...DEFAULTS, ...data.settings }); })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      q: activeSearch.trim() || settings.query,
      page: String(page),
      per_page: String(settings.per_page),
      order: settings.order,
      thumbsize: settings.thumbsize,
      gay: String(settings.gay),
      lq: String(settings.lq),
      format: settings.format,
    });

    fetch(`/api/videos/search?${params.toString()}`, { cache: 'no-store', signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load content');
        return data;
      })
      .then((data) => {
        const list: VideoItem[] = Array.isArray(data) ? data : data.videos || data.results || data.data || [];
        const total = Number(data.total_count ?? data.total ?? data.count ?? list.length);
        const pages = Number(data.total_pages ?? data.totalPages) || Math.max(1, Math.ceil(total / settings.per_page));
        setVideos(list);
        setTotalCount(total);
        setTotalPages(pages);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setVideos([]); setTotalCount(0); setTotalPages(1);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [activeSearch, page, settings]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedVideo(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const submitSearch = (event: FormEvent) => { event.preventDefault(); setPage(1); setActiveSearch(searchQuery); };
  const update = (key: keyof Settings, value: string | number) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const thumb = (video: VideoItem) => video.default_thumb?.src || video.thumbnail || video.thumbs?.[0]?.src || video.thumb || '';
  const embed = selectedVideo?.embed || selectedVideo?.embedUrl || selectedVideo?.embed_url || '';

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-200 font-sans selection:bg-red-700 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-red-950/80 bg-red-800 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-zinc-950 border border-red-500/40"><Play className="h-4 w-4 fill-red-500 text-red-500" /></div>
            <div><div className="text-lg font-black">VIDEO<span className="ml-1 rounded bg-zinc-950 px-1.5 py-0.5 text-xs text-red-500">PORTAL</span></div><div className="text-[10px] uppercase tracking-wider text-red-200/80">Content Dashboard</div></div>
          </div>
          <form onSubmit={submitSearch} className="flex w-full max-w-xl overflow-hidden rounded border border-red-950 bg-zinc-950">
            <Search className="m-2 h-5 w-5 text-zinc-500" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search videos, tags, creators..." className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-500" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="px-2 text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button>}
            <button type="submit" className="bg-red-600 px-5 text-sm font-bold hover:bg-red-500">Search</button>
          </form>
          <a href="/admin" className="inline-flex items-center gap-2 text-sm text-red-100 hover:text-white"><Settings className="h-4 w-4" /> Admin</a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-3 py-6 sm:px-4">
        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h1 className="text-xl font-bold text-white">Media Feed</h1><p className="text-sm text-zinc-500">Search and filter the configured video API</p></div><div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400">Total: <strong className="text-red-500">{totalCount.toLocaleString()}</strong></div></div>
          <div className="grid grid-cols-1 gap-3 border-t border-zinc-800 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-zinc-400">Order<select value={settings.order} onChange={(e) => update('order', e.target.value)} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white outline-none focus:border-red-500">{orders.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-xs text-zinc-400">Per Page<select value={settings.per_page} onChange={(e) => update('per_page', Number(e.target.value))} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white outline-none focus:border-red-500"><option value={12}>12</option><option value={24}>24</option><option value={48}>48</option><option value={96}>96</option></select></label>
            <label className="text-xs text-zinc-400">Thumb Size<select value={settings.thumbsize} onChange={(e) => update('thumbsize', e.target.value)} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white outline-none focus:border-red-500"><option value="small">Small</option><option value="medium">Medium</option><option value="big">Big</option></select></label>
            <label className="text-xs text-zinc-400">Low Quality<select value={settings.lq} onChange={(e) => update('lq', Number(e.target.value))} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white outline-none focus:border-red-500"><option value={0}>Exclude</option><option value={1}>Include</option><option value={2}>Only</option></select></label>
            <label className="text-xs text-zinc-400">Secondary Category<select value={settings.gay} onChange={(e) => update('gay', Number(e.target.value))} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white outline-none focus:border-red-500"><option value={0}>Exclude</option><option value={1}>Include</option><option value={2}>Only</option></select></label>
            <label className="text-xs text-zinc-400">Format<select value={settings.format} onChange={(e) => update('format', e.target.value)} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white outline-none focus:border-red-500"><option value="json">JSON</option><option value="xml">XML</option></select></label>
          </div>
        </section>

        {error && <div className="flex items-center gap-3 rounded-xl border border-red-900/70 bg-red-950/30 p-4 text-sm text-red-300"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}

        {loading ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: Math.min(settings.per_page, 12) }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-xl border border-zinc-800 bg-zinc-950" />)}</div> : videos.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{videos.map((video, index) => <article key={video.id ?? index} className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 transition hover:border-red-700/60">
          <Link href={`/videos/${video.id}`} aria-label={`Watch ${video.title || 'video'}`}><div className="relative aspect-video overflow-hidden bg-black">{thumb(video) && <img src={thumb(video)} alt={video.title || 'Video'} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />}<span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100"><span className="rounded-full bg-red-600 p-4 shadow-xl"><Play className="h-6 w-6 fill-white text-white" /></span></span>{(video.length_min || video.duration) && <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/75 px-2 py-1 text-xs"><Clock className="h-3 w-3" />{video.length_min || video.duration}</span>}</div>
          <div className="space-y-3 p-4"><h2 className="line-clamp-2 text-sm font-semibold text-white">{video.title || 'Untitled video'}</h2>{video.keywords && <p className="line-clamp-1 text-xs text-zinc-500">{video.keywords}</p>}<div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500"><span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{typeof video.views === 'number' ? video.views.toLocaleString() : '—'}</span><span className="flex items-center gap-1 text-amber-400"><Star className="h-3.5 w-3.5 fill-current" />{video.rate ?? '—'}</span></div></div></Link>
        </article>)}</div> : <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950 p-12 text-center text-zinc-500">No content available from the configured API.</div>}

        {totalPages > 1 && <footer className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm"><button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg bg-zinc-800 px-4 py-2 hover:bg-zinc-700 disabled:opacity-40">Previous</button><span className="text-zinc-400">Page <strong className="text-white">{page}</strong> / <strong className="text-white">{totalPages}</strong></span><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg bg-zinc-800 px-4 py-2 hover:bg-zinc-700 disabled:opacity-40">Next</button></footer>}
      </main>

      {selectedVideo && embed && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setSelectedVideo(null)}><div className="w-full max-w-5xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between border-b border-zinc-800 p-4"><h3 className="truncate text-sm font-semibold text-white">{selectedVideo.title || 'Video'}</h3><button onClick={() => setSelectedVideo(null)} className="text-zinc-500 hover:text-white" aria-label="Close"><X /></button></div><div className="aspect-video bg-black"><iframe src={embed} className="h-full w-full border-0" allowFullScreen title={selectedVideo.title || 'Video player'} /></div></div></div>}
    </div>
  );
}
