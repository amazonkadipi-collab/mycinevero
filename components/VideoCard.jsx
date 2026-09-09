'use client';

export default function VideoCard({ video, onPlay }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-lg transition hover:border-red-700/70 hover:-translate-y-0.5">
      <button type="button" onClick={() => onPlay(video)} className="block w-full text-left">
        <div className="relative aspect-video overflow-hidden bg-zinc-900">
          <img
            src={video.thumbnail || video.default_thumb?.src}
            alt={video.title || 'Video'}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {video.length_min != null && (
            <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
              {video.length_min} min
            </span>
          )}
        </div>
        <div className="space-y-2 p-3">
          <h2 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-red-400">
            {video.title || 'Untitled video'}
          </h2>
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
            <span>★ {video.rate ?? '—'}</span>
            <span>👁 {video.views ?? '—'}</span>
          </div>
        </div>
      </button>
    </article>
  );
}
