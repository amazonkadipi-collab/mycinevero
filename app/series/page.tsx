import type { Metadata } from 'next';
import Link from 'next/link';
import { tmdbDiscover, tmdbImage } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://watchmovies4.vercel.app';
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;

  return {
    title: page > 1 ? `Series – Page ${page}` : 'Series',
    description: 'Browse popular TV series and discover shows on Watch Movies 4.',
    alternates: {
      canonical:
        page > 1 ? `${SITE_URL}/series?page=${page}` : `${SITE_URL}/series`,
    },
  };
}

function slug(item: { name?: string; id: number }) {
  const normalized = (item.name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${normalized}-${item.id}`;
}

export default async function SeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requested = Number(pageParam);
  const page =
    Number.isFinite(requested) && requested > 0
      ? Math.min(Math.floor(requested), 500)
      : 1;

  const data = await tmdbDiscover('tv', page).catch(() => ({
    results: [],
    total_pages: 0,
  }));
  const totalPages = Math.min(data.total_pages || 0, 500);

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-[1180px] items-center gap-6 px-4 py-5 sm:px-6">
          <Link href="/" className="text-xl font-black">
            WATCH <span className="text-red-600">MOVIES</span> 4
          </Link>
          <Link
            href="/genres"
            className="ml-auto text-sm font-semibold text-zinc-600 hover:text-red-600"
          >
            Genres
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold">Series</h1>
        <p className="mt-2 text-zinc-500">
          Popular TV series, new discoveries and shows worth exploring.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {data.results.map((item: any) => (
            <Link
              key={item.id}
              href={`/series/${slug(item)}`}
              className="group"
            >
              <div className="aspect-[2/3] bg-zinc-100">
                {item.poster_path && (
                  <img
                    src={tmdbImage(item.poster_path, 'w342')}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <h2 className="mt-2 line-clamp-2 text-sm font-semibold group-hover:text-red-600">
                {item.name}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {(item.first_air_date || '').slice(0, 4)} ·{' '}
                {item.vote_average?.toFixed?.(1) || 'N/A'}/10
              </p>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-3"
            aria-label="Series pagination"
          >
            <Link
              aria-disabled={page <= 1}
              className={`border px-4 py-2 text-sm ${
                page <= 1
                  ? 'pointer-events-none opacity-40'
                  : 'hover:border-red-500 hover:text-red-600'
              }`}
              href={page > 1 ? `/series?page=${page - 1}` : '/series'}
            >
              Previous
            </Link>
            <span className="px-3 text-sm text-zinc-500">
              Page {page} of {totalPages}
            </span>
            <Link
              className={`border px-4 py-2 text-sm ${
                page >= totalPages
                  ? 'pointer-events-none opacity-40'
                  : 'hover:border-red-500 hover:text-red-600'
              }`}
              href={
                page < totalPages
                  ? `/series?page=${page + 1}`
                  : `/series?page=${page}`
              }
            >
              Next
            </Link>
          </nav>
        )}
      </div>
    </main>
  );
}

// Keep this route source formatted and parser-safe for production builds.
