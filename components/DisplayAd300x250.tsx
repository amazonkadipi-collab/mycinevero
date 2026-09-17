'use client';

import { useEffect, useRef } from 'react';
import InPagePushAd from '@/components/InPagePushAd';

const SCRIPT_SRC = 'https://www.highrevenueformat.com/1c9647571ea15716528e3adf689f165a/invoke.js';
const SLOT_KEY = '1c9647571ea15716528e3adf689f165a';

export default function DisplayAd300x250() {
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || slot.dataset.loaded === 'true') return;

    const previous = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (previous) return;

    const config = document.createElement('script');
    config.text = `atOptions = { key: '${SLOT_KEY}', format: 'iframe', height: 250, width: 300, params: {} };`;
    slot.appendChild(config);

    const script = document.createElement('script');
    script.async = true;
    script.src = SCRIPT_SRC;
    slot.appendChild(script);
    slot.dataset.loaded = 'true';

    return () => {
      config.remove();
      script.remove();
    };
  }, []);

  return (
    <>
      <section aria-label="Advertisement" className="my-6 flex w-full justify-center sm:my-8">
        <div className="w-full max-w-[300px] overflow-hidden rounded-[16px] border border-[#d8edf3] bg-[#fffdf7] p-1.5 shadow-sm">
          <div className="mb-1 px-1 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-[#7891a3]">Advertisement</div>
          <div ref={slotRef} className="flex min-h-[250px] w-full max-w-[300px] items-center justify-center overflow-hidden" />
        </div>
      </section>
      <InPagePushAd />
    </>
  );
}
