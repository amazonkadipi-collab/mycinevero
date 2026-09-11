'use client';

import { useState } from 'react';

export default function VideoActions({ title }: { title: string }) {
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {}
  };

  return <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 px-4 py-3 text-xs text-zinc-400"><button type="button" onClick={() => setSaved((value) => !value)} className="rounded-md bg-zinc-800 px-3 py-2 hover:bg-zinc-700">{saved ? 'Saved' : 'Save'}</button><button type="button" onClick={share} className="rounded-md bg-zinc-800 px-3 py-2 hover:bg-zinc-700">{shared ? 'Copied' : 'Share'}</button><a href="/contact" className="rounded-md bg-zinc-800 px-3 py-2 hover:bg-zinc-700">Report</a></div>;
}
