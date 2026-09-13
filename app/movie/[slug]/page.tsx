import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Clock, ExternalLink, Play, Heart, Sparkles } from 'lucide-react';
import { slugify, tmdbDetails, tmdbImage } from '@/lib/tmdb';
import CineveroInsight from '@/components/CineveroInsight';
import DisplayAd300x250 from '@/components/DisplayAd300x250';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
function parseId(slug: string) { const match = slug.match(/-(\d+)$/); return match ? Number(match[1]) : Number(slug); }
function titleOf(item: any) { return item.title || item.name || item.original_title || item.original_name || 'Untitled'; }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const id = parseId(slug);
  if (!Number.isFinite(id)) return { title: 'Movie not found', robots: { index: false } };
  try {
    const movie = await tmdbDetails('movie', id); const title = titleOf(movie); const year = (movie.release_date || '').slice(0, 4);
    const description = `Explore ${title}${year ? ` (${year})` : ''}: story, cast, genres, rating, trailer and Cinevero viewing guide.`; const canonical = `${SITE_URL}/movie/${slug}`;
    return { title: `${title}${year ? ` (${year})` : ''} – Cast, Story, Rating & Details`, description, alternates: { canonical }, openGraph: { title: `${title}${year ? ` (${year})` : ''} | Cinevero`, description, url: canonical, siteName: 'Cinevero', type: 'video.movie', images: movie.poster_path ? [tmdbImage(movie.poster_path, 'w780')] : [] }, twitter: { card: 'summary_large_image', title: `${title} | Cinevero`, description, images: movie.poster_path ? [tmdbImage(movie.poster_path, 'w780')] : [] } };
  } catch { return { title: 'Movie not found', robots: { index: false } }; }
}

export default async function MoviePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const id = parseId(slug); if (!Number.isFinite(id)) notFound();
  let movie: any; try { movie = await tmdbDetails('movie', id); } catch { notFound(); }
  const title = titleOf(movie); const year = (movie.release_date || '').slice(0, 4);
  const rating = typeof movie.vote_average === 'number' && movie.vote_average > 0 ? movie.vote_average.toFixed(1) : 'N/A';
  const trailer = (movie.videos?.results || []).find((video: any) => video.site === 'YouTube' && video.type === 'Trailer' && video.official !== false) || (movie.videos?.results || []).find((video: any) => video.site === 'YouTube' && video.type === 'Trailer');
  const recommendations = (movie.recommendations?.results || []).filter((item: any) => item.poster_path).slice(0, 12);
  const canonicalUrl = `${SITE_URL}/movie/${slug}`; const genres = (movie.genres || []).map((genre: any) => genre.name);
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Movie', name: title, description: movie.overview || undefined, image: movie.poster_path ? [tmdbImage(movie.poster_path, 'w780')] : undefined, datePublished: movie.release_date || undefined, aggregateRating: movie.vote_count > 0 ? { '@type': 'AggregateRating', ratingValue: movie.vote_average, ratingCount: movie.vote_count, bestRating: 10, worstRating: 0 } : undefined, genre: genres, url: canonicalUrl };
  const breadcrumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL }, { '@type': 'ListItem', position: 2, name: 'Movies', item: `${SITE_URL}/movie` }, { '@type': 'ListItem', position: 3, name: title, item: canonicalUrl }] };

  return <main className="min-h-screen bg-[#f7fcff] text-[#17324d]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    <div className="mx-auto max-w-[1180px] px-4 pt-3 sm:px-6"><nav aria-label="Breadcrumb" className="text-[11px] font-semibold text-[#6b879c]"><Link href="/" className="hover:text-[#168aad]">Home</Link><span className="mx-2">›</span><Link href="/movie" className="hover:text-[#168aad]">Movies</Link><span className="mx-2">›</span><span className="text-[#8aa0b1]">{title}</span></nav></div>

    <section className="relative mx-auto mt-2 max-w-[1180px] overflow-hidden rounded-[22px] border border-[#d9edf4] bg-[#102d43] shadow-[0_12px_35px_rgba(22,138,173,0.12)]">
      <div className="absolute inset-0 opacity-30">{movie.backdrop_path && <img src={tmdbImage(movie.backdrop_path, 'original')} alt="" className="h-full w-full object-cover" fetchPriority="high" decoding="async" />}</div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#102d43] via-[#102d43]/90 to-[#102d43]/55" />
      <div className="relative grid gap-5 px-4 py-5 sm:grid-cols-[190px_1fr] sm:px-6 sm:py-7">
        <div>{movie.poster_path ? <img src={tmdbImage(movie.poster_path, 'w500')} alt={`${title} poster`} className="w-full max-w-[190px] rounded-[18px] border border-white/20 shadow-2xl" fetchPriority="high" decoding="async" /> : <div className="aspect-[2/3] max-w-[190px] rounded-[18px] bg-white/10" />}</div>
        <div className="self-center text-white">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#bfefff]">{year && <span className="rounded-full bg-white/10 px-2.5 py-1">{year}</span>}{movie.runtime && <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1"><Clock size={12} />{movie.runtime} min</span>}<span className="inline-flex items-center gap-1 rounded-full bg-[#ff6b4a]/90 px-2.5 py-1 text-white"><Star size={12} fill="currentColor" />{rating === 'N/A' ? 'Not rated' : `${rating}/10`}</span></div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
          {movie.tagline && <p className="mt-2 text-sm font-medium text-[#cde8f2]">“{movie.tagline}”</p>}
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#d4e7ef]">{movie.overview || 'No overview available.'}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{genres.map((name: string, index: number) => <Link key={`${name}-${index}`} href={`/genre/${slugify(name)}`} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#d9eef5] hover:border-[#ff8a78] hover:text-white">{name}</Link>)}</div>
          <div className="mt-4 flex flex-wrap gap-2">{trailer && <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer" aria-label={`Watch ${title} trailer`} className="group inline-flex items-center gap-2 rounded-full bg-[#ff6b4a] px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-[#ff6b4a]/20 transition hover:-translate-y-0.5 hover:bg-[#e9553e]"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#ff6b4a] shadow-sm transition group-hover:scale-105"><Play size={13} fill="currentColor" /></span><span>Watch trailer</span></a>}{movie.homepage && <a href={movie.homepage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/15"><ExternalLink size={13} /> Official site</a>}<span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-2.5 text-xs font-bold text-[#ffd8d2]"><Heart size={13} /> Cinevero pick</span></div>
        </div>
      </div>
    </section>

    <CineveroInsight title={title} genres={genres} runtime={movie.runtime} overview={movie.overview} type="movie" />

    {trailer && <section className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6"><div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded-full bg-[#fff0eb] p-1.5 text-[#ff6b4a]"><Play size={13} fill="currentColor" /></span><h2 className="text-lg font-black">Official trailer</h2></div><a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer" aria-label={`Open ${title} trailer on YouTube`} className="inline-flex items-center gap-2 rounded-full border border-[#ffd0c6] bg-[#fff7f4] px-3 py-1.5 text-[11px] font-black text-[#e9553e] transition hover:-translate-y-0.5 hover:bg-[#fff0eb]"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff6b4a] text-white shadow-sm"><Play size={11} fill="currentColor" /></span>Play</a></div><div className="relative aspect-video overflow-hidden rounded-[20px] border border-[#d8edf3] bg-[#102d43] shadow-sm"><iframe className="h-full w-full" src={`https://www.youtube.com/embed/${trailer.key}`} title={`${title} official trailer`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div></section>}

    <DisplayAd300x250 />

    <section className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6"><div className="mb-3 flex items-center gap-2"><span className="rounded-full bg-[#e9faff] p-1.5 text-[#168aad]"><Sparkles size={13} /></span><h2 className="text-lg font-black">Cast</h2></div><div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 lg:grid-cols-6">{(movie.credits?.cast || []).slice(0, 12).map((person: any) => <div key={`${person.id}-${person.character}`} className="group min-w-[112px] snap-start overflow-hidden rounded-[16px] border border-[#d8edf3] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:min-w-0"><div className="aspect-[3/4] bg-[#edf8fb]">{person.profile_path ? <img src={tmdbImage(person.profile_path, 'w342')} alt={person.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" decoding="async" /> : <div className="flex h-full items-center justify-center text-xs text-[#9ab0bf]">No photo</div>}</div><div className="p-2.5"><p className="line-clamp-1 text-xs font-bold">{person.name}</p><p className="mt-0.5 line-clamp-1 text-[10px] text-[#7891a3]">{person.character}</p></div></div>)}</div></section>

    {recommendations.length > 0 && <section className="mx-auto max-w-[1180px] px-4 pb-8 sm:px-6"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><span className="rounded-full bg-[#fff0eb] p-1.5 text-[#ff6b4a]"><Heart size={13} /></span><h2 className="text-lg font-black">You may also like</h2></div><span className="text-[11px] font-bold text-[#7891a3]">More little gems ✨</span></div><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">{recommendations.map((item: any) => <Link key={item.id} href={`/movie/${slugify(titleOf(item))}-${item.id}`} className="group min-w-0 overflow-hidden rounded-[14px] border border-[#d8edf3] bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md"><div className="aspect-[2/3] overflow-hidden bg-[#edf8fb]"><img src={tmdbImage(item.poster_path, 'w342')} alt={`${titleOf(item)} poster`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" loading="lazy" decoding="async" /></div><div className="p-2"><h3 className="line-clamp-2 text-xs font-bold group-hover:text-[#168aad]">{titleOf(item)}</h3><p className="mt-1 text-[10px] font-semibold text-[#7891a3]">{(item.release_date || '').slice(0, 4)}</p></div></Link>)}</div></section>}
  </main>;
}
