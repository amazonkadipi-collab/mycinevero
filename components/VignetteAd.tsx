'use client';

import { useEffect } from 'react';

const SCRIPT_SRC = 'https://n6wxm.com/vignette.min.js';
const ZONE = '11821377';

export default function VignetteAd() {
  useEffect(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;

    const script = document.createElement('script');
    script.dataset.zone = ZONE;
    script.src = SCRIPT_SRC;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
