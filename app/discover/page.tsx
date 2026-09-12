import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import CineveroDiscover from '@/components/CineveroDiscover';

export const metadata: Metadata = {
  title: 'Cinevero Discover — Decide What to Watch',
  description: 'Tell Cinevero your mood, time and viewing context. Get five explainable movie and series recommendations instead of endless scrolling.',
  alternates: { canonical: '/discover' },
};

export default function DiscoverPage() {
  return <div className="min-h-screen bg-zinc-50 text-zinc-950"><SiteHeader/><main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-12"><section className="rounded-3xl bg-zinc-950 px-6 py-9 text-white sm:px-10 sm:py-12"><p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">CINEVERO DISCOVER</p><h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">What should you watch right now?</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">Tell Cinevero what this moment feels like. It narrows candidates, enriches only the strongest ones, scores the context, and gives you five explainable picks.</p></section><CineveroDiscover/><section className="mt-12 border-t border-zinc-200 pt-8"><h2 className="text-lg font-bold">How Cinevero decides</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">Basic TMDB metadata is used to build a candidate pool. Cinevero selectively enriches the strongest candidates, applies context-aware scoring and diversity, then learns from feedback such as “too long” or “not for me”.</p><p className="mt-4 text-xs text-zinc-400">Recommendations use metadata supplied by TMDB. Cinevero does not host movie or TV files.</p></section></main></div>;
}
