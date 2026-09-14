import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Clock, ExternalLink, Sparkles, Heart } from 'lucide-react';
import { slugify, tmdbDetails, tmdbImage, tmdbSeason } from '@/lib/tmdb';
import CineveroCommunity from '@/components/CineveroCommunity';
import DisplayAd300x250 from '@/components/DisplayAd300x250';
import { evaluateQualityGate } from '@/lib/quality-gate';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
const EPISODES_PER_PAGE = 20;

function parseId(slug: string) {
  const match = slug.match(/-(\d+)$/);
  return match ? Number(match[1]) : Number(slug);
}

function titleOf(item: any) {
  return item.name || item.original_name || item.title || 'Untitled';
}

function trailerOf(show: any) {
  const videos = show.videos?.results || [];
  return videos.find((video: any) => video.site === 'YouTube' && video.type === 'Trailer' && video.official !== false)
    || videos.find((video: any) => video.site === 'YouTube' && video.type === 'Trailer');
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const id = parseId(slug);
  if (!Number.isFinite(id)) return { title: 'Series not found', robots: { index: false, follow: true } };

  try {
    const show = await tmdbDetails('tv', id);
    const title = titleOf(show);
    const year = (show.first_air_date || '').slice(0, 4);
    const trailer = trailerOf(show);
    const recommendations = (show.recommendations?.results || []).filter((item: any) => item.poster_path);
    const gate = evaluateQualityGate({
      title,
      overview: show.overview,
      posterPath: show.poster_path,
      genres: show.genres,
      castCount: show.credits?.cast?.length,
      seasonCount: show.number_of_seasons,
      episodeCount: show.number_of_episodes,
      trailerAvailable: Boolean(trailer),
      recommendationCount: recommendations.length,
    });
    const description = show.overview?.trim() || `Explore ${title}${year ? ` (${year})` : ''}: seasons, episodes, cast, genres, rating, trailer and related titles on Cinevero.`;
    const canonical = `${SITE_URL}/series/${slug}`;

    return {
      title: `${title}${year ? ` (${year})` : ''} – Cast, Seasons, Episodes & Details`,
      description,
      robots: gate.indexable ? { index: true, follow: true } : { index: false, follow: true },
      alternates: { canonical },
      openGraph: {
        title: `${title} | Cinevero`,
        description,
        url: canonical,
        siteName: 'Cinevero',
        type: 'video.tv_show',
        images: show.poster_path ? [tmdbImage(show.poster_path, 'w780')] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | Cinevero`,
        description,
        images: show.poster_path ? [tmdbImage(show.poster_path, 'w780')] : [],
      },
    };
  } catch {
    return { title: 'Series not found', robots: { index: false, follow: true } };
  }
}

export default async function SeriesPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ season?: string; page?: string }> }) {
  const { slug } = await params;
  const { season: seasonParam, page: pageParam } = await searchParams;
  const id = parseId(slug);
  if (!Number.isFinite(id)) notFound();

  let show: any;
  try { show = await tmdbDetails('tv', id); } catch { notFound(); }

  const title = titleOf(show);
  const year = (show.first_air_date || '').slice(0, 4);
  const genres = (show.genres || []).map((genre: any) => genre.name);
  const seasons = (show.seasons || []).filter((season: any) => season.season_number > 0);
  const requestedSeason = Number(seasonParam);
  const selectedSeason = Number.isFinite(requestedSeason) && requestedSeason > 0 ? requestedSeason : seasons[0]?.season_number;
  const requestedPage = Number(pageParam);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const seasonData = selectedSeason ? await tmdbSeason(id, selectedSeason).catch(() => null) : null;
  const allEpisodes = seasonData?.episodes || [];
  const totalPages = Math.max(1, Math.ceil(allEpisodes.length / EPISODES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * EPISODES_PER_PAGE;
  const episodes = allEpisodes.slice(start, start + EPISODES_PER_PAGE);
  const trailer = trailerOf(show);
  const recommendations = (show.recommendations?.results || []).filter((item: any) => item.poster_path).slice(0, 12);
  const canonicalUrl = `${SITE_URL}/series/${slug}`;

  const containsSeason = seasons.map((season: any) => ({
    '@type': 'TVSeason',
    name: season.name || `Season ${season.season_number}`,
    seasonNumber: season.season_number,
    numberOfEpisodes: season.episode_count || undefined,
    url: `${canonicalUrl}?season=${season.season_number}`,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: title,
    description: show.overview || undefined,
    image: show.poster_path ? [tmdbImage(show.poster_path, 'w780')] : undefined,
    startDate: show.first_air_date || undefined,
    numberOfSeasons: show.number_of_seasons || undefined,
    numberOfEpisodes: show.number_of_episodes || undefined,
    containsSeason,
    aggregateRating: show.vote_count > 0 ? { '@type': 'AggregateRating', ratingValue: show.vote_average, ratingCount: show.vote_count, bestRating: 10, worstRating: 0 } : undefined,
    genre: genres,
    url: canonicalUrl,
  };

  const seasonUrl = (seasonNumber: number, pageNumber = 1) => `/series/${slug}?season=${seasonNumber}${pageNumber > 1 ? `&page=${pageNumber}` : ''}`;

  return (
    <main className="min-h-screen bg-[#f7fcff] text-[#17324d]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-[1180px] px-4 pt-3 sm:px-6"><nav aria-label="Breadcrumb" className="text-[11px] font-semibold text-[#6b879c]"><Link href="/">Home</Link><span className="mx-2">›</span><Link href="/series">Series</Link><span className="mx-2">›</span><span>{title}</span></nav></div>
      <section className="relative mx-auto mt-2 max-w-[1180px] overflow-hidden rounded-[22px] border border-[#d9edf4] bg-[#102d43]"><div className="absolute inset-0 opacity-30">{show.backdrop_path && <img src={tmdbImage(show.backdrop_path, 'original')} alt="" className="h-full w-full object-cover" fetchPriority="high" />}</div><div className="absolute inset-0 bg-gradient-to-r from-[#102d43] via-[#102d43]/90 to-[#102d43]/55" /><div className="relative grid gap-5 px-4 py-5 sm:grid-cols-[190px_1fr] sm:px-6 sm:py-7"><div>{show.poster_path ? <img src={tmdbImage(show.poster_path, 'w500')} alt={`${title} poster`} className="w-full max-w-[190px] rounded-[18px] border border-white/20 shadow-2xl" loading="eager" /> : <div className="aspect-[2/3] max-w-[190px] rounded-[18px] bg-white/10" />}</div><div className="self-center text-white"><div className="mb-2 flex flex-wrap gap-2 text-[11px] font-bold text-[#bfefff]"><span className="rounded-full bg-white/10 px-2.5 py-1">{year || 'Series'}</span><span className="rounded-full bg-white/10 px-2.5 py-1">{show.number_of_seasons || 0} seasons</span><span className="inline-flex items-center gap-1 rounded-full bg-[#ff6b4a]/90 px-2.5 py-1 text-white"><Star size={12} fill="currentColor" />{show.vote_average?.toFixed?.(1) || 'N/A'}/10</span></div><h1 className="text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>{show.tagline && <p className="mt-2 text-sm font-medium text-[#cde8f2]">“{show.tagline}”</p>}<p className="mt-3 max-w-3xl text-sm leading-6 text-[#d4e7ef]">{show.overview || 'No overview available.'}</p><div className="mt-3 flex flex-wrap gap-1.5">{genres.map((name: string, index: number) => <Link key={`${name}-${index}`} href={`/genre/${slugify(name)}`} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#d9eef5]">{name}</Link>)}</div>{show.homepage && <div className="mt-4"><a href={show.homepage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#ff6b4a] px-4 py-2.5 text-xs font-black text-white"><ExternalLink size={13} /> Official site</a></div>}</div></div></section>
      <CineveroCommunity tmdbId={id} mediaType="tv" title={title} />
      {trailer && <section className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6"><div className="mb-2 flex items-center gap-2"><Sparkles size={14} className="text-[#ff6b4a]" /><h2 className="text-lg font-black">Official trailer</h2></div><div className="aspect-video overflow-hidden rounded-[18px] border border-[#d8edf3] bg-[#102d43]"><iframe className="h-full w-full" src={`https://www.youtube.com/embed/${trailer.key}`} title={`${title} official trailer`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div></section>}
      <DisplayAd300x250 />
      <section className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Sparkles size={14} className="text-[#168aad]" /><h2 className="text-lg font-black">Seasons & episodes</h2></div><div className="flex flex-wrap gap-1.5">{seasons.map((season: any) => <Link key={season.id} href={seasonUrl(season.season_number)} className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${season.season_number === selectedSeason ? 'border-[#ff6b4a] bg-[#ff6b4a] text-white' : 'border-[#cfe5ed] bg-white text-[#5f7c90]'}`}>Season {season.season_number}</Link>)}</div></div>{seasonData && allEpisodes.length > 0 && <><div className="mb-3 flex items-center justify-between text-[11px] font-bold text-[#7891a3]"><span>Episodes {start + 1}–{Math.min(start + EPISODES_PER_PAGE, allEpisodes.length)} of {allEpisodes.length}</span><span>Page {safePage} of {totalPages}</span></div><div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{episodes.map((episode: any) => { const image = episode.still_path ? tmdbImage(episode.still_path, 'w780') : show.backdrop_path ? tmdbImage(show.backdrop_path, 'w780') : show.poster_path ? tmdbImage(show.poster_path, 'w500') : ''; return <Link key={episode.id} href={`/series/${slug}/season/${selectedSeason}/episode/${episode.episode_number}`} className="group block overflow-hidden rounded-[15px] border border-[#d8edf3] bg-white shadow-sm"><div className="relative aspect-video overflow-hidden bg-[#eaf8fb]">{image ? <img src={image} alt={episode.name} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center text-xs font-bold text-[#7891a3]">Episode {episode.episode_number}</div>}<span className="absolute left-2 top-2 rounded-full bg-[#102d43]/85 px-2 py-1 text-[9px] font-black text-white">EP {episode.episode_number}</span></div><div className="p-2.5"><div className="flex items-center justify-between gap-3 text-[10px] font-bold text-[#7891a3]"><span>Episode {episode.episode_number}</span>{episode.runtime && <span className="inline-flex items-center gap-1"><Clock size={11} />{episode.runtime} min</span>}</div><h3 className="mt-1.5 text-xs font-bold group-hover:text-[#168aad]">{episode.name}</h3>{episode.air_date && <p className="mt-1 text-[10px] text-[#8da3b2]">{episode.air_date}</p>}{episode.overview && <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#6b8496]">{episode.overview}</p>}</div></Link>; })}</div>{totalPages > 1 && <nav aria-label="Episode pagination" className="mt-5 flex flex-wrap items-center justify-center gap-1.5">{safePage > 1 && <Link href={seasonUrl(selectedSeason, safePage - 1)} className="rounded-full border border-[#cfe5ed] bg-white px-3 py-1.5 text-[11px] font-bold text-[#5f7c90]">Previous</Link>}{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <Link key={pageNumber} href={seasonUrl(selectedSeason, pageNumber)} aria-current={pageNumber === safePage ? 'page' : undefined} className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${pageNumber === safePage ? 'border-[#ff6b4a] bg-[#ff6b4a] text-white' : 'border-[#cfe5ed] bg-white text-[#5f7c90]'}`}>{pageNumber}</Link>)}{safePage < totalPages && <Link href={seasonUrl(selectedSeason, safePage + 1)} className="rounded-full border border-[#cfe5ed] bg-white px-3 py-1.5 text-[11px] font-bold text-[#5f7c90]">Next</Link>}</nav>}</>}</section>
      <section className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6"><div className="mb-3 flex items-center gap-2"><Sparkles size={14} className="text-[#168aad]" /><h2 className="text-lg font-black">Cast</h2></div><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">{(show.credits?.cast || []).slice(0, 12).map((person: any) => <div key={`${person.id}-${person.character}`} className="overflow-hidden rounded-[14px] border border-[#d8edf3] bg-white shadow-sm"><div className="aspect-[2/3] bg-[#eaf8fb]">{person.profile_path && <img src={tmdbImage(person.profile_path, 'w342')} alt={person.name} className="h-full w-full object-cover" loading="lazy" />}</div><div className="p-2"><p className="line-clamp-1 text-xs font-bold">{person.name}</p><p className="line-clamp-1 text-[10px] text-[#7891a3]">{person.character}</p></div></div>)}</div></section>
      {recommendations.length > 0 && <section className="mx-auto max-w-[1180px] px-4 pb-8 sm:px-6"><div className="mb-3 flex items-center gap-2"><Heart size={14} className="text-[#ff6b4a]" /><h2 className="text-lg font-black">You may also like</h2></div><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">{recommendations.map((item: any) => <Link key={item.id} href={`/series/${slugify(titleOf(item))}-${item.id}`} className="group overflow-hidden rounded-[14px] border border-[#d8edf3] bg-white shadow-sm"><div className="aspect-[2/3] overflow-hidden bg-[#eaf8fb]"><img src={tmdbImage(item.poster_path, 'w342')} alt={titleOf(item)} className="h-full w-full object-cover" loading="lazy" /></div><div className="p-2"><h3 className="line-clamp-2 text-xs font-bold group-hover:text-[#168aad]">{titleOf(item)}</h3><p className="mt-1 text-[10px] font-semibold text-[#7891a3]">{(item.first_air_date || '').slice(0, 4)}</p></div></Link>)}</div></section>}
    </main>
  );
}
