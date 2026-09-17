'use client';

import { useEffect, useRef } from 'react';

const SCRIPT_SRC = 'https://nap5k.com/tag.min.js';
const ZONE_ID = '11821364';

export default function InPagePushAd() {
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || slot.dataset.loaded === 'true') return;
    if (document.querySelector(`script[src="${SCRIPT_SRC}"][data-zone="${ZONE_ID}"]`)) return;

    const script = document.createElement('script');
    script.dataset.zone = ZONE_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    slot.appendChild(script);
    slot.dataset.loaded = 'true';

    return () => {
      script.remove();
      slot.dataset.loaded = 'false';
    };
  }, []);

  return (
    <section aria-label="Advertisement" className="my-5 flex w-full justify-center sm:my-6">
      <div ref={slotRef} className="w-full max-w-[728px] overflow-hidden" />
    </section>
  );
}
