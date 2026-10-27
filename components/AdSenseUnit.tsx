'use client';

import { useEffect, useRef, useState } from 'react';

type Settings = { adsense: boolean; display300x250: boolean; adsterraNativeBanner: boolean };
const NATIVE_SRC = 'https://bancadeltempoidea.org/21/03019123fc56ad60d24677c8faf7c4a1';
const NATIVE_CONTAINER_ID = 'container-03019123fc56ad60d24677c8faf7c4a1';

export default function AdSenseUnit() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/ads-settings', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error(`Ad settings request failed: HTTP ${response.status}`);
        return response.json() as Promise<Settings>;
      })
      .then(value => { if (active) setSettings(value); })
      .catch(error => {
        console.error('[adsterra-native] Settings request failed', error instanceof Error ? error.message : String(error));
        if (active) setSettings({ adsense: false, display300x250: false, adsterraNativeBanner: false });
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!settings?.adsterraNativeBanner) return;
    const widget = widgetRef.current;
    const parent = widget?.parentElement;
    if (!widget || !parent || parent.querySelector('script[data-cinevero-adsterra-native="true"]')) return;

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.dataset.cineveroAdsterraNative = 'true';
    script.src = NATIVE_SRC;
    // Match Adsterra's generated Native Banner order: script before container.
    parent.insertBefore(script, widget);

    return () => {
      script.remove();
      widget.replaceChildren();
    };
  }, [settings]);

  if (!settings?.adsterraNativeBanner) return null;
  return (
    <section aria-label="Advertisement" className="cinevero-native-ad">
      <div className="cinevero-native-ad__label">Advertisement</div>
      <div ref={widgetRef} id={NATIVE_CONTAINER_ID} className="cinevero-native-ad__widget" />
    </section>
  );
}
