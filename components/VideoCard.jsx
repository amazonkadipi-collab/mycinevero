"use client";

export default function VideoCard({ video, onSelect }) {
  const thumbnail = video?.default_thumb?.src || video?.thumbnail || video?.thumb || "";
  const title = video?.title || "Untitled Video";

  return (
    <button type="button" className="video-card" onClick={() => onSelect?.(video)}>
      <div className="video-thumb">
        {thumbnail ? <img src={thumbnail} alt={title} loading="lazy" /> : <span>No Image</span>}
      </div>
      <div className="video-info">
        <h2>{title}</h2>
        <div className="video-meta">
          {video?.rate != null && <span>★ {video.rate}</span>}
          {video?.views != null && <span>{video.views} views</span>}
          {video?.length_min != null && <span>{video.length_min} min</span>}
        </div>
      </div>
    </button>
  );
}
