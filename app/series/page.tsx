import type { Metadata } from 'next';
import Link from 'next/link';
import { Star, SlidersHorizontal } from 'lucide-react';
import { slugify, tmdbDiscover, tmdbImage } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const p = Number(pageParam);
  const page = Number.isFinite(p) && p > 1 ? Math.min(Math.floor(p), 500) : 1;
  return {
    title: page > 1 ? `Series – Page ${page}` : 'TV Series',
    description: 'Browse TV series and discover shows on Cinevero.',
    alternates: { canonical: page > 1 ? `${SITE_URL}/series?page=${page}` : `${SITE_URL}/series` },
  };
}

export default async function SeriesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const requested = Number(pageParam);
  const page = Number.isFinite(requested) && requested > 0 ? Math.min(Math.floor(requested), 500) : 1;
  const data = await tmdbDiscover('tv', page).catch(() => ({ results: [], total_pages: 0 }));
  const totalPages = Math.min(data.total_pages || 0, 500);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Cinevero catalogue</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">TV Series</h1>
            <p className="mt-2 text-zinc-500">Browse popular shows and discover series worth exploring.</p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">Page {page} of {Math.max(totalPages, 1)}</span>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <SlidersHorizontal size={16} className="text-zinc-500" aria-hidden="true" />
          <span className="text-xs font-semibold text-zinc-600">Sort: Popularity</span>
          <Link href="/movie" className="ml-auto rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold hover:border-red-400 hover:text-red-600">Browse movies</Link>
        </div>
        {data.results.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center text-sm text-zinc-500">No series are available right now. Please try again.</div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
            {data.results.map((item: any) => {
              const year = (item.first_air_date || '').slice(0, 4);
              const rating = typeof item.vote_average === 'number' && item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A';
              return (
                <Link key={item.id} href={`/series/${slugify(item.name || 'untitled')}-${item.id}`} className="group min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
                  <article>
                    <div className="aspect-[2/3] overflow-hidden rounded-xl bg-zinc-100">
                      {item.poster_path ? <img src={tmdbImage(item.poster_path, 'w342')} alt={`${item.name || 'Series'} poster`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-xs text-zinc-400">No poster</div>}
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-[11px] font-semibold"><span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-600">Series</span><span className="text-zinc-500">{year || '—'}</span></div>
                      <h2 className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold group-hover:text-red-600">{item.name || 'Untitled'}</h2>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500"><Star size={11} fill="currentColor" aria-hidden="true" />{rating === 'N/A' ? 'Not rated' : `${rating}/10`}</span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
        {totalPages > 1 && <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Series pagination"><Link href={page > 1 ? `/series?page=${page - 1}` : '/series'} aria-disabled={page <= 1} className={`rounded-lg border px-4 py-2 text-sm font-medium ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-red-500 hover:text-red-600'}`}>Previous</Link><span className="px-3 text-sm text-zinc-500">Page {page} of {totalPages}</span><Link href={page < totalPages ? `/series?page=${page + 1}` : `/series?page=${totalPages}`} aria-disabled={page >= totalPages} className={`rounded-lg border px-4 py-2 text-sm font-medium ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-red-500 hover:text-red-600'}`}>Next</Link></nav>}
      </div>
    </main>
  );
}
