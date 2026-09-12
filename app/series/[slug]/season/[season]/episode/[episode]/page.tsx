import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, Clock, ExternalLink, Play, Star } from 'lucide-react';
import { tmdbDetails, tmdbImage, tmdbSeason } from '@/lib/tmdb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';
function parseId(value: string) { const match = value.match(/-(\d+)$/); return match ? Number(match[1]) : Number(value); }
function titleOf(item: any) { return item.name || item.original_name || item.title || 'Untitled'; }

async function getEpisode(slug: string, seasonParam: string, episodeParam: string) {
  const id = parseId(slug); const seasonNumber = Number(seasonParam); const episodeNumber = Number(episodeParam);
  if (!Number.isFinite(id) || !Number.isInteger(seasonNumber) || seasonNumber < 1 || !Number.isInteger(episodeNumber) || episodeNumber < 1) return null;
  try {
    const [show, season] = await Promise.all([tmdbDetails('tv', id), tmdbSeason(id, seasonNumber)]);
    const episode = (season.episodes || []).find((item: any) => item.episode_number === episodeNumber);
    if (!episode) return null;
    return { id, show, season, episode, seasonNumber, episodeNumber };
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; season: string; episode: string }> }): Promise<Metadata> {
  const { slug, season, episode: episodeParam } = await params;
  const data = await getEpisode(slug, season, episodeParam);
  if (!data) return { title: 'Episode not found', robots: { index: false } };
  const showTitle = titleOf(data.show); const episodeTitle = data.episode.name || `Episode ${data.episodeNumber}`;
  const canonical = `${SITE_URL}/series/${slug}/season/${data.seasonNumber}/episode/${data.episodeNumber}`;
  const description = data.episode.overview || `${episodeTitle} from ${showTitle}, Season ${data.seasonNumber}, Episode ${data.episodeNumber}.`;
  return {
    title: `${episodeTitle} – ${showTitle} S${data.seasonNumber}E${data.episodeNumber}`,
    description,
    alternates: { canonical },
    openGraph: { title: `${episodeTitle} | ${showTitle}`, description, url: canonical, siteName: 'Cinevero', type: 'video.episode', images: data.episode.still_path ? [tmdbImage(data.episode.still_path, 'w780')] : data.show.backdrop_path ? [tmdbImage(data.show.backdrop_path, 'w780')] : [] },
    twitter: { card: 'summary_large_image', title: `${episodeTitle} | ${showTitle}`, description, images: data.episode.still_path ? [tmdbImage(data.episode.still_path, 'w780')] : [] },
  };
}

export default async function EpisodePage({ params }: { params: Promise<{ slug: string; season: string; episode: string }> }) {
  const { slug, season, episode: episodeParam } = await params;
  const data = await getEpisode(slug, season, episodeParam);
  if (!data) notFound();
  const { id, show, season: seasonData, episode, seasonNumber, episodeNumber } = data;
  const showTitle = titleOf(show); const episodeTitle = episode.name || `Episode ${episodeNumber}`;
  const episodeImage = episode.still_path ? tmdbImage(episode.still_path, 'w780') : show.backdrop_path ? tmdbImage(show.backdrop_path, 'w780') : show.poster_path ? tmdbImage(show.poster_path, 'w500') : '';
  const previousEpisode = (seasonData.episodes || []).find((item: any) => item.episode_number === episodeNumber - 1);
  const nextEpisode = (seasonData.episodes || []).find((item: any) => item.episode_number === episodeNumber + 1);
  const seriesHref = `/series/${slug}?season=${seasonNumber}`;
  const canonical = `${SITE_URL}/series/${slug}/season/${seasonNumber}/episode/${episodeNumber}`;
  const tmdbHref = `https://www.themoviedb.org/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}`;
  const episodeLd = { '@context': 'https://schema.org', '@type': 'TVEpisode', name: episodeTitle, episodeNumber, image: episodeImage || undefined, description: episode.overview || undefined, datePublished: episode.air_date || undefined, timeRequired: episode.runtime ? `PT${episode.runtime}M` : undefined, partOfSeason: { '@type': 'TVSeason', seasonNumber, partOfSeries: { '@type': 'TVSeries', name: showTitle, url: `${SITE_URL}/series/${slug}` } }, url: canonical };
  const breadcrumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL }, { '@type': 'ListItem', position: 2, name: 'Series', item: `${SITE_URL}/series` }, { '@type': 'ListItem', position: 3, name: showTitle, item: `${SITE_URL}/series/${slug}` }, { '@type': 'ListItem', position: 4, name: episodeTitle, item: canonical }] };

  return <main className="min-h-screen bg-[#f7fcff] text-[#17324d]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(episodeLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    <div className="mx-auto max-w-[1180px] px-4 pt-3 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-[11px] font-semibold text-[#6b879c]"><Link href="/" className="hover:text-[#168aad]">Home</Link><span className="mx-2">›</span><Link href="/series" className="hover:text-[#168aad]">Series</Link><span className="mx-2">›</span><Link href={seriesHref} className="hover:text-[#168aad]">{showTitle}</Link><span className="mx-2">›</span><span>S{seasonNumber} E{episodeNumber}</span></nav>
    </div>
    <section className="mx-auto mt-3 max-w-[1180px] overflow-hidden rounded-[22px] border border-[#d9edf4] bg-[#102d43] shadow-[0_12px_35px_rgba(22,138,173,0.12)]">
      <div className="relative aspect-video max-h-[620px] overflow-hidden bg-[#102d43]">
        {episodeImage ? <img src={episodeImage} alt={`${episodeTitle} - ${showTitle}`} className="h-full w-full object-cover" fetchPriority="high" /> : <div className="flex h-full items-center justify-center text-white">Episode {episodeNumber}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-[#102d43] via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3 sm:bottom-6 sm:left-6 sm:right-6">
          <div><span className="inline-flex rounded-full bg-[#ff6b4a] px-2.5 py-1 text-[10px] font-black text-white">S{seasonNumber} · E{episodeNumber}</span><h1 className="mt-2 text-2xl font-black text-white sm:text-4xl">{episodeTitle}</h1><p className="mt-1 text-sm font-semibold text-[#d7edf5]">{showTitle}</p></div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#102d43]/85 px-3 py-2 text-xs font-bold text-white"><Star size={13} fill="currentColor" />{episode.vote_average?.toFixed?.(1) || 'N/A'}</span>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-2 text-[11px] font-bold text-[#607d91]"><span className="inline-flex items-center gap-1 rounded-full bg-[#e9faff] px-2.5 py-1.5"><CalendarDays size={12} />{episode.air_date || 'Air date unavailable'}</span>{episode.runtime ? <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0eb] px-2.5 py-1.5"><Clock size={12} />{episode.runtime} min</span> : null}</div>
        {episode.overview && <p className="mt-4 max-w-4xl text-sm leading-7 text-[#5e788c]">{episode.overview}</p>}
        <div className="mt-5 flex flex-wrap gap-2"><Link href={seriesHref} className="rounded-full bg-[#168aad] px-4 py-2.5 text-xs font-black text-white hover:bg-[#117793]">Back to season</Link><a href={tmdbHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#cfe5ed] bg-white px-4 py-2.5 text-xs font-black text-[#547388] hover:border-[#168aad] hover:text-[#168aad]"><ExternalLink size={13} /> View on TMDB</a></div>
      </div>
    </section>
    <section className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-5 sm:px-6">
      {previousEpisode ? <Link href={`/series/${slug}/season/${seasonNumber}/episode/${previousEpisode.episode_number}`} className="rounded-full border border-[#d8edf3] bg-white px-4 py-2.5 text-xs font-black hover:border-[#168aad]">← Episode {previousEpisode.episode_number}</Link> : <span />}
      {nextEpisode ? <Link href={`/series/${slug}/season/${seasonNumber}/episode/${nextEpisode.episode_number}`} className="rounded-full bg-[#ff6b4a] px-4 py-2.5 text-xs font-black text-white hover:bg-[#e9553e]">Episode {nextEpisode.episode_number} →</Link> : <span />}
    </section>
    <section className="mx-auto max-w-[1180px] px-4 pb-10 sm:px-6"><div className="rounded-[18px] border border-[#d8edf3] bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><span className="rounded-full bg-[#e9faff] p-1.5 text-[#168aad]"><Play size={13} /></span><h2 className="text-sm font-black">About this episode</h2></div><p className="mt-2 text-xs leading-6 text-[#6b8496]">Cinevero organizes episode information so you can explore a series without leaving the site. Episode data and artwork are provided by TMDB.</p></div></section>
  </main>;
}
