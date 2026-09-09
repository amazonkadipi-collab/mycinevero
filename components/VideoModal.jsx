"use client";

import { useEffect } from "react";

export default function VideoModal({ video, onClose }) {
  useEffect(() => {
    if (!video) return;
    const handler = (event) => event.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [video, onClose]);

  if (!video) return null;

  const embed = video.embed || video.embedUrl || video.embed_url;
  if (!embed) return null;

  return (
    <div className="video-modal-backdrop" onClick={onClose} role="presentation">
      <div className="video-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-player">
          <iframe src={embed} title={video.title || "Video player"} allowFullScreen />
        </div>
      </div>
    </div>
  );
}
