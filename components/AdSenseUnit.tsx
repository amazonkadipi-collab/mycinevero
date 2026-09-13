'use client';

import { useEffect } from 'react';

const ADSENSE_ACCOUNT = 'ca-pub-2298621556332463';
const AD_SLOT = '9179461333';

export default function AdSenseUnit() {
  useEffect(() => {
    try {
      ((window as typeof window & { adsbygoogle?: unknown[] }).adsbygoogle ||= []).push({});
    } catch {
      // AdSense can be unavailable during development or blocked by an extension.
    }
  }, []);

  return (
    <section aria-label="Advertisement" className="my-7 w-full overflow-hidden px-0 sm:my-9">
      <div className="mx-auto min-h-[100px] w-full max-w-[980px] overflow-hidden rounded-xl bg-transparent">
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={ADSENSE_ACCOUNT}
          data-ad-slot={AD_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </section>
  );
}
