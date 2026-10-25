'use client';

import { useEffect, useRef, useState } from 'react';

type Settings = { adsense: boolean; display300x250: boolean; inPagePush: boolean };
const ADSENSE_ACCOUNT = 'ca-pub-2298621556332463';
const NATIVE_SRC = 'https://pl31325870.profitableratecpmnetwork.com/03019123fc56ad60d24677c8faf7c4a1/invoke.js';
const NATIVE_CONTAINER_ID = 'container-03019123fc56ad60d24677c8faf7c4a1';

export default function AdSenseUnit() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/ads-settings', { cache: 'no-store' })
      .then(response => response.json())
      .then((value: Settings) => { if (active) setSettings(value); })
      .catch(() => { if (active) setSettings({ adsense: false, display300x250: false, inPagePush: false }); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!settings) return;
    const scripts: HTMLScriptElement[] = [];
    if (settings.adsense && !document.querySelector('script[data-cinevero-adsense="true"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.dataset.cineveroAdsense = 'true';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ACCOUNT}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
      scripts.push(script);
    }
    const widget = widgetRef.current;
    const parent = widget?.parentElement;
    if (settings.inPagePush && widget && parent && !parent.querySelector('script[data-cinevero-inpage="true"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.dataset.cineveroInpage = 'true';
      script.src = NATIVE_SRC;
      parent.appendChild(script);
      scripts.push(script);
    }
    return () => { scripts.forEach(script => script.remove()); };
  }, [settings]);

  if (!settings?.inPagePush) return null;
  return (
    <section aria-label="Advertisement" className="cinevero-native-ad">
      <div className="cinevero-native-ad__label">Advertisement</div>
      <div ref={widgetRef} id={NATIVE_CONTAINER_ID} className="cinevero-native-ad__widget" />
    </section>
  );
}
