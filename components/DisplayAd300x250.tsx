'use client';

import { useEffect, useRef, useState } from 'react';

const ADSENSE_CLIENT = 'ca-pub-2298621556332463';
const ADSENSE_SLOT = '9179461333';

export default function DisplayAd300x250() {
  const ref = useRef<HTMLModElement>(null);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/ads-settings', { cache: 'no-store' })
      .then(response => response.json())
      .then((settings: { adsense: boolean; display300x250: boolean }) => {
        if (active) setEnabled(settings.adsense && settings.display300x250);
      })
      .catch(() => { if (active) setEnabled(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); } catch {}
  }, [enabled]);
  if (!enabled) return null;
  return <section aria-label="Advertisement" className="my-6 flex w-full justify-center sm:my-8"><div className="w-full max-w-[300px] overflow-hidden rounded-[16px] border border-[#d8edf3] bg-[#fffdf7] p-1.5 shadow-sm"><div className="mb-1 px-1 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-[#7891a3]">Advertisement</div><ins ref={ref} className="adsbygoogle" style={{display:'inline-block', width:'300px', height:'250px'}} data-ad-client={ADSENSE_CLIENT} data-ad-slot={ADSENSE_SLOT} /></div></section>;
}
