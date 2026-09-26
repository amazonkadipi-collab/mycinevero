'use client';

import { useEffect, useRef } from 'react';

const NATIVE_SRC = 'https://pl31325870.profitableratecpmnetwork.com/03019123fc56ad60d24677c8faf7c4a1/invoke.js';
const NATIVE_CONTAINER_ID = 'container-03019123fc56ad60d24677c8faf7c4a1';

export default function AdSenseUnit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || loadedRef.current) return;

    loadedRef.current = true;
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = NATIVE_SRC;
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
      loadedRef.current = false;
    };
  }, []);

  return (
    <section aria-label="Advertisement" className="cinevero-native-ad">
      <div className="cinevero-native-ad__label">Advertisement</div>
      <div ref={containerRef} id={NATIVE_CONTAINER_ID} className="cinevero-native-ad__widget" />
    </section>
  );
}
