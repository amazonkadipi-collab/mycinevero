'use client';

import { useEffect, useRef } from 'react';

const NATIVE_SRC = 'https://pl31325870.profitableratecpmnetwork.com/03019123fc56ad60d24677c8faf7c4a1/invoke.js';
const NATIVE_CONTAINER_ID = 'container-03019123fc56ad60d24677c8faf7c4a1';

export default function AdSenseUnit() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const widget = widgetRef.current;
    const parent = widget?.parentElement;
    if (!widget || !parent || loadedRef.current) return;

    loadedRef.current = true;

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = NATIVE_SRC;

    // Keep the Adsterra code structure intact: the container exists before
    // the async script is inserted, and the script is a sibling of the container.
    parent.appendChild(script);

    return () => {
      script.remove();
      widget.innerHTML = '';
      loadedRef.current = false;
    };
  }, []);

  return (
    <section aria-label="Advertisement" className="cinevero-native-ad">
      <div className="cinevero-native-ad__label">Advertisement</div>
      <div
        ref={widgetRef}
        id={NATIVE_CONTAINER_ID}
        className="cinevero-native-ad__widget"
      />
    </section>
  );
}
