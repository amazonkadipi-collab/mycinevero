"use client";

import VideoCard from "./VideoCard";

export default function VideoGrid({ videos = [], onSelect }) {
  if (!videos.length) return null;

  return (
    <div className="video-grid">
      {videos.map((video, index) => (
        <VideoCard key={video.id || video.video_id || index} video={video} onSelect={onSelect} />
      ))}
    </div>
  );
}
