import type { Metadata } from 'next';
import Link from 'next/link';
import { tmdbDiscover, tmdbImage, slugify } from '@/lib/tmdb';

export const metadata: Metadata = {
  title: 'Anime – Cinevero | Anime Movies & Series',
  description: 'Discover anime movies and series on Cinevero.',
  alternates: { canonical: 'https://cinevero.vercel.app/anime' },
};

function titleOf(item: any) { return item.title || item.name || item.original_title || item.original_name || 'Untitled'; }
function dateOf(item: any) { return item.release_date || item.first_air_date || ''; }

export default async function AnimePage() {
  const [movies, series] = await Promise.all([
    tmdbDiscover('movie', 1, { genreId: 16, sortBy: 'popularity.desc' }),
    tmdbDiscover('tv', 1, { genreId: 16, sortBy: 'popularity.desc' }),
  ]);

  const items = [...movies.results, ...series.results]
    .filter(item => item.original_language === 'ja' || item.original_language === 'zh' || item.original_language === 'ko')
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 30);

  return (
    <main className="min-h-screen bg-[#f5fbff] text-[#172033]">
      <section className="mx-auto max-w-[1180px] px-3 pb-4 pt-5 sm:px-5 sm:pt-7">
        <div className="rounded-[24px] border border-[#dcecf3] bg-gradient-to-br from-[#dff6ff] via-white to-[#fff0eb] px-5 py-6 shadow-[0_12px_35px_rgba(22,138,173,0.08)] sm:px-7">
          <div className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-black text-[#168aad]">🍥 Cinevero Anime</div>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Anime movies & series</h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-[#667085]">Discover popular animated stories and find your next anime to watch.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-3 pb-12 sm:px-5">
        <div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-lg font-black">Popular anime</h2><p className="text-xs font-semibold text-[#7a91a1]">Movies and series ranked by popularity</p></div></div>
        {items.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {items.map(item => {
            const isTv = !!item.name || !!item.first_air_date;
            const title = titleOf(item);
            const href = `/${isTv ? 'series' : 'movie'}/${slugify(title)}-${item.id}`;
            return <Link key={`${isTv ? 'tv' : 'movie'}-${item.id}`} href={href} className="group overflow-hidden rounded-2xl border border-[#dce7f2] bg-white shadow-[0_6px_20px_rgba(23,32,51,0.05)] hover:-translate-y-0.5 hover:border-[#ffb6a6] hover:shadow-[0_10px_25px_rgba(255,107,74,0.12)]">
              <div className="relative aspect-[2/3] overflow-hidden bg-[#e9faff]">{item.poster_path ? <img src={tmdbImage(item.poster_path, 'w342')} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" /> : <div className="flex h-full items-center justify-center p-3 text-center text-xs font-bold text-[#6b879c]">{title}</div>}
                {item.vote_average ? <span className="absolute right-1.5 top-1.5 rounded-full bg-[#102d43]/90 px-2 py-1 text-[10px] font-black text-white">★ {item.vote_average.toFixed(1)}</span> : null}
              </div>
              <div className="p-2.5"><h3 className="line-clamp-2 text-xs font-black leading-4">{title}</h3><p className="mt-1 text-[10px] font-bold text-[#7a91a1]">{dateOf(item)?.slice(0,4) || '—'} · {isTv ? 'Series' : 'Movie'}</p></div>
            </Link>;
          })}
        </div> : <div className="rounded-2xl border border-[#dce7f2] bg-white p-8 text-center text-sm font-bold text-[#667085]">No anime titles available right now.</div>}
      </section>
    </main>
  );
}
