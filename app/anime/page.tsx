import type { Metadata } from 'next';
import Link from 'next/link';
import { Star, SlidersHorizontal } from 'lucide-react';
import { slugify, tmdbDiscover, tmdbImage } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const requested = Number(pageParam);
  const page = Number.isFinite(requested) && requested > 1 ? Math.min(Math.floor(requested), 500) : 1;

  return {
    title: page > 1 ? `Anime – Page ${page}` : 'Anime',
    description: 'Browse anime movies and series on Cinevero.',
    alternates: { canonical: page > 1 ? `${SITE_URL}/anime?page=${page}` : `${SITE_URL}/anime` },
  };
}

function titleOf(item: any) {
  return item.title || item.name || item.original_title || item.original_name || 'Untitled';
}

function dateOf(item: any) {
  return item.release_date || item.first_air_date || '';
}

function isAnime(item: any) {
  return item.original_language === 'ja' || item.original_language === 'zh' || item.original_language === 'ko';
}

export default async function AnimePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const requested = Number(pageParam);
  const page = Number.isFinite(requested) && requested > 0 ? Math.min(Math.floor(requested), 500) : 1;
  const nextSourcePage = Math.min(page + 1, 500);

  // Fetch two TMDB pages per type so the language filter cannot leave the grid with only 8–10 cards.
  const [moviePage1, moviePage2, seriesPage1, seriesPage2] = await Promise.all([
    tmdbDiscover('movie', page, { genreId: 16, sortBy: 'popularity.desc' }).catch(() => ({ results: [], total_pages: 0 })),
    tmdbDiscover('movie', nextSourcePage, { genreId: 16, sortBy: 'popularity.desc' }).catch(() => ({ results: [], total_pages: 0 })),
    tmdbDiscover('tv', page, { genreId: 16, sortBy: 'popularity.desc' }).catch(() => ({ results: [], total_pages: 0 })),
    tmdbDiscover('tv', nextSourcePage, { genreId: 16, sortBy: 'popularity.desc' }).catch(() => ({ results: [], total_pages: 0 })),
  ]);

  const items = [...moviePage1.results, ...moviePage2.results, ...seriesPage1.results, ...seriesPage2.results]
    .filter(isAnime)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .filter((item, index, all) => all.findIndex(other => other.id === item.id && (!!other.name === !!item.name)) === index)
    .slice(0, 12);

  const totalPages = Math.min(Math.max(moviePage1.total_pages || 0, seriesPage1.total_pages || 0), 500);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Cinevero catalogue</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Anime</h1>
            <p className="mt-2 text-zinc-500">Browse anime movies and series and discover your next story.</p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
            Page {page} of {Math.max(totalPages, 1)}
          </span>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <SlidersHorizontal size={16} className="text-zinc-500" aria-hidden="true" />
          <span className="text-xs font-semibold text-zinc-600">Sort: Popularity</span>
          <Link href="/movie" className="ml-auto rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold hover:border-red-400 hover:text-red-600">Browse movies</Link>
          <Link href="/series" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold hover:border-red-400 hover:text-red-600">Browse series</Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center text-sm text-zinc-500">
            No anime titles are available on this page. Please try another page.
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
            {items.map((item: any) => {
              const isTv = !!item.name || !!item.first_air_date;
              const title = titleOf(item);
              const year = dateOf(item).slice(0, 4);
              const rating = typeof item.vote_average === 'number' && item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A';
              const href = `/${isTv ? 'series' : 'movie'}/${slugify(title)}-${item.id}`;

              return (
                <Link key={`${isTv ? 'tv' : 'movie'}-${item.id}`} href={href} className="group min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
                  <article>
                    <div className="aspect-[2/3] overflow-hidden rounded-xl bg-zinc-100">
                      {item.poster_path ? (
                        <img
                          src={tmdbImage(item.poster_path, 'w342')}
                          alt={`${title} poster`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-400">No poster</div>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-[11px] font-semibold">
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-600">{isTv ? 'Series' : 'Movie'}</span>
                        <span className="text-zinc-500">{year || '—'}</span>
                      </div>
                      <h2 className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold group-hover:text-red-600">{title}</h2>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500">
                        <Star size={11} fill="currentColor" aria-hidden="true" />
                        {rating === 'N/A' ? 'Not rated' : `${rating}/10`}
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Anime pagination">
            <Link
              href={page > 1 ? `/anime?page=${page - 1}` : '/anime'}
              aria-disabled={page <= 1}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-red-500 hover:text-red-600'}`}
            >
              Previous
            </Link>
            <span className="px-3 text-sm text-zinc-500">Page {page} of {totalPages}</span>
            <Link
              href={page < totalPages ? `/anime?page=${page + 1}` : `/anime?page=${totalPages}`}
              aria-disabled={page >= totalPages}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-red-500 hover:text-red-600'}`}
            >
              Next
            </Link>
          </nav>
        )}
      </div>
    </main>
  );
}
