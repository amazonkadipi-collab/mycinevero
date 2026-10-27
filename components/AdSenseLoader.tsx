'use client';

import { useEffect } from 'react';

const ADSENSE_ACCOUNT = 'ca-pub-2298621556332463';

export default function AdSenseLoader() {
  useEffect(() => {
    let active = true;
    fetch('/api/ads-settings', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error(`Ad settings request failed: HTTP ${response.status}`);
        return response.json() as Promise<{ adsense: boolean }>;
      })
      .then(settings => {
        if (!active || !settings.adsense || document.querySelector('script[data-cinevero-adsense="true"]')) return;
        const script = document.createElement('script');
        script.async = true;
        script.dataset.cineveroAdsense = 'true';
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ACCOUNT}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      })
      .catch(error => console.error('[adsense] Loader settings failed', error instanceof Error ? error.message : String(error)));
    return () => { active = false; };
  }, []);

  return null;
}
