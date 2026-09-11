'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Eye, Loader2, Star } from 'lucide-react';

type Video = {
  id?: string;
  title?: string;
  keywords?: string;
  views?: number;
  rate?: string | number;
  length_min?: string;
  length_sec?: number;
  default_thumb?: { src?: string };
  thumbs?: { src?: string }[];
};

function thumbnail(video: Video) {
  return video.default_thumb?.src || video.thumbs?.[0]?.src || '';
}

function RelatedCard({ video }: { video: Video }) {
  const image = thumbnail(video);
  return (
    <Link href={`/videos/${encodeURIComponent(video.id || '')}`} className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 transition hover:-translate-y-0.5 hover:border-red-500/70">
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
        {image && <img src={image} alt={video.title || 'Related video'} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />}
        {video.length_min && <span className="absolute bottom-2 left-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white">{video.length_min}</span>}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-100 group-hover:text-red-300">{video.title || 'Untitled video'}</h3>
        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
          <span>{typeof video.views === 'number' ? `${video.views.toLocaleString()} views` : 'Watch now'}</span>
          <span className="flex items-center gap-1 text-amber-400"><Star className="h-3 w-3 fill-current" />{video.rate || '—'}</span>
        </div>
      </div>
    </Link>
  );
}

export default function RelatedVideos({ initialVideos, query, currentId, initialHasMore }: { initialVideos: Video[]; query: string; currentId: string; initialHasMore: boolean }) {
  const [videos, setVideos] = useState(initialVideos);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({ query, page: String(nextPage), per_page: '20', thumbsize: 'small', order: 'most-popular' });
      const response = await fetch(`/api/videos/search?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load related videos');
      const data = await response.json() as { videos?: Video[]; total_pages?: number; total_count?: number };
      const existing = new Set(videos.map((video) => video.id).filter(Boolean));
      const nextVideos = (data.videos || []).filter((video) => video.id && video.id !== currentId && !existing.has(video.id));
      setVideos((current) => [...current, ...nextVideos]);
      setPage(nextPage);
      const totalPages = Number(data.total_pages || 0);
      setHasMore(totalPages > 0 ? nextPage < totalPages : nextVideos.length === 20);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  if (!videos.length) return null;

  return (
    <section className="mt-7" aria-labelledby="related-heading">
      <div className="mb-3 flex items-end justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">Keep watching</p><h2 id="related-heading" className="mt-1 text-xl font-bold text-white">Related videos</h2></div>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">Browse all</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {videos.map((item) => <RelatedCard key={item.id} video={item} />)}
      </div>
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button type="button" onClick={loadMore} disabled={loading} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-red-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</> : 'Load more'}
          </button>
        </div>
      )}
    </section>
  );
}
