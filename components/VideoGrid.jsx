'use client';

import VideoCard from './VideoCard';

export default function VideoGrid({ videos, onPlay }) {
  if (!videos?.length) {
    return <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">No videos found.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {videos.map((video, index) => (
        <VideoCard key={video.id ?? `${video.title}-${index}`} video={video} onPlay={onPlay} />
      ))}
    </div>
  );
}
