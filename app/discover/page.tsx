import type { Metadata } from 'next';
import CineveroDiscover from '@/components/CineveroDiscover';

export const metadata: Metadata = {
  title: 'Cinevero Discover — Decide What to Watch',
  description: 'Tell Cinevero your mood, time and viewing context. Get five explainable movie and series recommendations instead of endless scrolling.',
  alternates: { canonical: '/discover' },
};

export default function DiscoverPage() {
  return (
    <main className="min-h-screen bg-[#f7fcff] pb-10 text-[#17324d]">
      <div className="mx-auto max-w-[1180px] px-4 pt-3 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-[11px] font-semibold text-[#6b879c]">
          <a href="/" className="hover:text-[#168aad]">Home</a>
          <span className="mx-2">›</span>
          <span className="text-[#8aa0b1]">Discover</span>
        </nav>
      </div>

      <section className="mx-auto mt-2 max-w-[1180px] overflow-hidden rounded-[22px] border border-[#d9edf4] bg-[#102d43] shadow-[0_12px_35px_rgba(22,138,173,0.12)]">
        <div className="relative px-5 py-7 sm:px-8 sm:py-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,74,.22),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(22,138,173,.18),transparent_42%)]" />
          <div className="relative">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#bfefff]">✦ CINEVERO DISCOVER</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">What should you watch right now?</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d4e7ef] sm:text-base">Tell Cinevero what this moment feels like. We narrow the options, rank the strongest matches and explain why each pick fits.</p>
          </div>
        </div>
      </section>

      <CineveroDiscover />

      <section className="mx-auto mt-10 max-w-[1180px] border-t border-[#d9edf4] px-4 pt-7 sm:px-6">
        <h2 className="text-lg font-black text-[#17324d]">How Cinevero decides</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b8496]">Basic TMDB metadata builds the candidate pool. Cinevero selectively enriches the strongest candidates, applies context-aware scoring and diversity, then learns from feedback such as “too long” or “not for me”.</p>
        <p className="mt-4 text-xs text-[#7891a3]">Recommendations use metadata supplied by TMDB. Cinevero does not host movie or TV files.</p>
      </section>
    </main>
  );
}
