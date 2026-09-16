'use client';

import { useMemo, useState } from 'react';

type Provider = {
  provider_id: number;
  provider_name: string;
  logo_path?: string;
};

type RegionData = {
  link?: string;
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
};

const REGION_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia',
  FR: 'France', DE: 'Germany', ES: 'Spain', IT: 'Italy', NL: 'Netherlands',
  BE: 'Belgium', CH: 'Switzerland', AT: 'Austria', PT: 'Portugal',
  IE: 'Ireland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  PL: 'Poland', IN: 'India', JP: 'Japan', KR: 'South Korea', BR: 'Brazil',
  MX: 'Mexico', AR: 'Argentina', CL: 'Chile', CO: 'Colombia', ZA: 'South Africa',
  NZ: 'New Zealand', SG: 'Singapore', MY: 'Malaysia', PH: 'Philippines',
  ID: 'Indonesia', AE: 'United Arab Emirates', SA: 'Saudi Arabia', MA: 'Morocco',
};

const LOGO_BASE = 'https://image.tmdb.org/t/p/w92';

function uniqueProviders(items: Provider[] = []) {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.provider_id)) return false;
    seen.add(item.provider_id);
    return true;
  });
}

function ProviderRow({ title, providers }: { title: string; providers?: Provider[] }) {
  const items = uniqueProviders(providers);
  if (!items.length) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#607b8e]">{title}</h3>
      <div className="flex flex-wrap gap-2.5">
        {items.map((provider) => (
          <div key={provider.provider_id} className="flex items-center gap-2 rounded-xl border border-[#d8edf3] bg-white px-2.5 py-2 shadow-sm">
            {provider.logo_path ? (
              <img src={`${LOGO_BASE}${provider.logo_path}`} alt="" width={28} height={28} className="h-7 w-7 rounded-lg object-cover" loading="lazy" />
            ) : <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e9f8fc] text-[9px] font-black text-[#168aad]">TV</span>}
            <span className="text-xs font-bold text-[#27465b]">{provider.provider_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WatchProviders({ results, defaultRegion = 'US' }: { results?: Record<string, RegionData>; defaultRegion?: string }) {
  const regions = useMemo(() => {
    const available = Object.keys(results || {});
    return available.sort((a, b) => (REGION_NAMES[a] || a).localeCompare(REGION_NAMES[b] || b));
  }, [results]);
  const initial = regions.includes(defaultRegion) ? defaultRegion : regions[0];
  const [region, setRegion] = useState(initial || defaultRegion);
  const data = results?.[region];

  if (!regions.length || !data) return null;
  const hasProviders = Boolean(data.flatrate?.length || data.rent?.length || data.buy?.length);
  if (!hasProviders) return null;

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6" aria-labelledby="watch-providers-title">
      <div className="overflow-hidden rounded-[22px] border border-[#d8edf3] bg-[#f8fdff] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8edf3] px-4 py-4 sm:px-5">
          <div>
            <h2 id="watch-providers-title" className="text-lg font-black text-[#17324d]">Where to Watch</h2>
            <p className="mt-0.5 text-[11px] text-[#7891a3]">Streaming, rent and buy options for this title.</p>
          </div>
          <label className="flex items-center gap-2 text-[11px] font-bold text-[#607b8e]">
            <span className="sr-only">Country</span>
            <select value={region} onChange={(event) => setRegion(event.target.value)} className="rounded-xl border border-[#cfe5ec] bg-white px-3 py-2 text-xs font-bold text-[#27465b] outline-none focus:border-[#168aad]">
              {regions.map((code) => <option key={code} value={code}>{REGION_NAMES[code] || code}</option>)}
            </select>
          </label>
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          <ProviderRow title="Streaming" providers={data.flatrate} />
          <ProviderRow title="Rent" providers={data.rent} />
          <ProviderRow title="Buy" providers={data.buy} />
          {data.link && <a href={data.link} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-[#168aad] px-4 py-2 text-xs font-black text-white hover:bg-[#12758f]">View watch options</a>}
          <p className="text-[10px] text-[#8aa0ae]">Streaming data provided by <a href="https://www.justwatch.com" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#607b8e]">JustWatch</a>.</p>
        </div>
      </div>
    </section>
  );
}
