import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Movie & Series Genres',
  description: 'Browse movies and TV series by genre on Watch Movies 4.',
  alternates: { canonical: '/genres' },
};

const genres = [
  ['action', 'Action'], ['adventure', 'Adventure'], ['animation', 'Animation'], ['comedy', 'Comedy'],
  ['crime', 'Crime'], ['documentary', 'Documentary'], ['drama', 'Drama'], ['family', 'Family'],
  ['fantasy', 'Fantasy'], ['horror', 'Horror'], ['mystery', 'Mystery'], ['romance', 'Romance'],
  ['science-fiction', 'Science Fiction'], ['thriller', 'Thriller'], ['western', 'Western'],
];

export default function GenresPage() {
  return <main className="min-h-screen bg-white text-zinc-900"><header className="border-b border-zinc-200"><div className="mx-auto flex max-w-[1180px] items-center gap-6 px-4 py-5 sm:px-6"><Link href="/" className="text-xl font-black">WATCH <span className="text-red-600">MOVIES</span> 4</Link><Link href="/movie" className="ml-auto text-sm font-semibold text-zinc-600 hover:text-red-600">Movies</Link><Link href="/series" className="text-sm font-semibold text-zinc-600 hover:text-red-600">Series</Link></div></header><section className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6"><h1 className="text-4xl font-bold tracking-tight">Browse by genre</h1><p className="mt-3 max-w-2xl text-zinc-600">Explore popular movies and series grouped by genre, with dedicated pages that are easy to browse and share.</p><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{genres.map(([slug, name]) => <Link key={slug} href={`/genre/${slug}`} className="border border-zinc-200 p-5 font-semibold hover:border-red-500 hover:text-red-600">{name}</Link>)}</div></section></main>;
}
