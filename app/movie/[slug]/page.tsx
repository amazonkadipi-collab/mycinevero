import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Clock } from 'lucide-react';
import { tmdbDetails, tmdbImage } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://watchmovies4.vercel.app';
function parseId(slug: string) { const match = slug.match(/-(\d+)$/); return match ? Number(match[1]) : Number(slug); }
function titleOf(item: any) { return item.title || item.name || item.original_title || item.original_name || 'Untitled'; }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const id = parseId(slug); if (!Number.isFinite(id)) return { title: 'Movie not found' };
  try { const movie = await tmdbDetails('movie', id); const title = titleOf(movie); return { title, description: movie.overview || `Movie details for ${title}.`, alternates: { canonical: `${SITE_URL}/movie/${slug}` }, openGraph: { title: `${title} | Watch Movies 4`, description: movie.overview || '', images: movie.poster_path ? [tmdbImage(movie.poster_path, 'w500')] : [] } }; } catch { return { title: 'Movie not found', robots: { index: false } }; }
}

export default async function MoviePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const id = parseId(slug); if (!Number.isFinite(id)) notFound();
  let movie: any; try { movie = await tmdbDetails('movie', id); } catch { notFound(); }
  const title = titleOf(movie); const year = (movie.release_date || '').slice(0, 4);
  return <main className="min-h-screen bg-zinc-950 text-white"><header className="border-b border-white/10"><div className="mx-auto flex max-w-[1180px] items-center px-4 py-4 sm:px-6"><Link href="/" className="text-xl font-black">WATCH <span className="text-red-500">MOVIES</span> 4</Link><Link href="/movie" className="ml-auto text-sm text-zinc-400 hover:text-white">Movies</Link></div></header><section className="relative overflow-hidden"><div className="absolute inset-0 opacity-25">{movie.backdrop_path && <img src={tmdbImage(movie.backdrop_path, 'w780')} alt="" className="h-full w-full object-cover" />}</div><div className="relative mx-auto grid max-w-[1180px] gap-8 px-4 py-10 sm:grid-cols-[280px_1fr] sm:px-6 sm:py-16"><div>{movie.poster_path && <img src={tmdbImage(movie.poster_path, 'w500')} alt={title} className="w-full max-w-[280px] border border-white/10" />}</div><div className="self-end"><div className="mb-3 flex flex-wrap gap-3 text-xs text-zinc-300">{year && <span>{year}</span>}{movie.runtime && <span className="inline-flex items-center gap-1"><Clock size={13} />{movie.runtime} min</span>}<span className="inline-flex items-center gap-1"><Star size={13} fill="currentColor" />{movie.vote_average?.toFixed?.(1) || 'N/A'}</span></div><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>{movie.tagline && <p className="mt-3 text-zinc-300">{movie.tagline}</p>}<p className="mt-6 max-w-3xl leading-7 text-zinc-300">{movie.overview || 'No overview available.'}</p><div className="mt-6 flex flex-wrap gap-2">{(movie.genres || []).map((g: any) => <span key={g.id} className="border border-white/15 px-3 py-1 text-xs text-zinc-300">{g.name}</span>)}</div></div></div></section><section className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6"><h2 className="text-xl font-bold">Cast</h2><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">{(movie.credits?.cast || []).slice(0, 12).map((person: any) => <div key={`${person.id}-${person.character}`}><div className="aspect-[2/3] bg-zinc-900">{person.profile_path && <img src={tmdbImage(person.profile_path, 'w342')} alt={person.name} className="h-full w-full object-cover" />}</div><p className="mt-2 text-sm font-semibold">{person.name}</p><p className="text-xs text-zinc-500">{person.character}</p></div>)}</div></section></main>;
}
