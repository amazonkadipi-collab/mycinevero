'use client';

import { useState } from 'react';
import { Eye, Flag, Heart, Share2 } from 'lucide-react';

export default function VideoActions({ title, videoId, views }: { title: string; videoId: string; views?: number }) {
  const storageKey = `elovex:liked:${videoId}`;
  const countKey = `elovex:likes:${videoId}`;
  const [liked, setLiked] = useState(() => typeof window !== 'undefined' && localStorage.getItem(storageKey) === '1');
  const [likes, setLikes] = useState(() => typeof window !== 'undefined' ? Number(localStorage.getItem(countKey) || 0) : 0);
  const [shared, setShared] = useState(false);

  const toggleLike = () => {
    const nextLiked = !liked;
    const nextLikes = Math.max(0, likes + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setLikes(nextLikes);
    try {
      localStorage.setItem(storageKey, nextLiked ? '1' : '0');
      localStorage.setItem(countKey, String(nextLikes));
    } catch {}
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {}
  };

  return <div className="flex items-center gap-4 border-y border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 sm:gap-7"><span className="flex items-center gap-1.5"><Eye className="h-5 w-5" />{views?.toLocaleString() || '—'}</span><button type="button" onClick={toggleLike} aria-pressed={liked} className={`flex items-center gap-1.5 font-semibold transition ${liked ? 'text-red-600' : 'text-zinc-500 hover:text-red-600'}`}><Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />{likes.toLocaleString()} Like</button><button type="button" onClick={share} className="flex items-center gap-1.5 hover:text-zinc-950"><Share2 className="h-5 w-5" />{shared ? 'Copied' : 'Share'}</button><a href="/contact" className="ml-auto flex items-center gap-1.5 hover:text-red-600"><Flag className="h-5 w-5" />Report</a></div>;
}
