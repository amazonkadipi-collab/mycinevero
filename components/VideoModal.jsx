'use client';

export default function VideoModal({ video, onClose }) {
  if (!video) return null;

  const embed = video.embedUrl || video.embed;
  if (!embed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="truncate pr-4 font-semibold text-white">{video.title || 'Video'}</h2>
          <button type="button" onClick={onClose} className="rounded px-3 py-1 text-zinc-300 hover:bg-zinc-800 hover:text-white" aria-label="Close">✕</button>
        </div>
        <div className="aspect-video bg-black">
          <iframe className="h-full w-full" src={embed} title={video.title || 'Video player'} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        </div>
      </div>
    </div>
  );
}
