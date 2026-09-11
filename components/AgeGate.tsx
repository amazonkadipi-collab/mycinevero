'use client';

import { useEffect, useState } from 'react';

const CONSENT_KEY = 'elovex:age-confirmed:v1';

export default function AgeGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // The browser-only preference is intentionally read after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(window.localStorage.getItem(CONSENT_KEY) !== 'yes');
  }, []);

  if (!visible) return null;

  const confirmAge = () => {
    window.localStorage.setItem(CONSENT_KEY, 'yes');
    setVisible(false);
  };

  const leaveSite = () => {
    window.location.href = 'https://www.google.com/';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby="age-gate-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-zinc-900 shadow-2xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Elovex</p>
        <h2 id="age-gate-title" className="mt-3 text-2xl font-bold">Are you 18 or older?</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">This website contains age-restricted adult content. You must be at least 18 years old, or the legal age in your location, to continue.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button type="button" onClick={confirmAge} className="rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700">Yes, enter</button>
          <button type="button" onClick={leaveSite} className="rounded-lg border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">No, leave</button>
        </div>
        <p className="mt-5 text-xs leading-5 text-zinc-500">By entering, you confirm that you meet the applicable age requirement. We only store this preference in your browser.</p>
      </div>
    </div>
  );
}
