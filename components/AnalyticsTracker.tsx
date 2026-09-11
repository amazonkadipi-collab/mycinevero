'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    const controller = new AbortController();
    fetch('/api/analytics/track', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ path: pathname, referrer: document.referrer || '' }),
      keepalive: true,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [pathname]);
  return null;
}
