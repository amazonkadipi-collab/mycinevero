'use client';

import { useEffect, useRef } from 'react';

const NATIVE_SRC = 'https://pl31325870.profitableratecpmnetwork.com/03019123fc56ad60d24677c8faf7c4a1/invoke.js';
const NATIVE_CONTAINER_ID = 'container-03019123fc56ad60d24677c8faf7c4a1';

export default function AdSenseUnit() {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const container = document.getElementById(NATIVE_CONTAINER_ID);
    if (!container) return;

    const existing = document.querySelector(`script[src="${NATIVE_SRC}"]`);
    if (existing) return;

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = NATIVE_SRC;
    container.parentElement?.insertBefore(script, container);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <section
      aria-label="Advertisement"
      className="cinevero-native-ad my-6 w-full overflow-hidden px-0 sm:my-8"
    >
      <div className="cinevero-native-ad__label">Advertisement</div>
      <div
        id={NATIVE_CONTAINER_ID}
        className="cinevero-native-ad__widget"
      />
    </section>
  );
}
