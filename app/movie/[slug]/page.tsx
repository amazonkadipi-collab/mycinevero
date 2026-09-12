import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Clock, ExternalLink, Play } from 'lucide-react';
import { slugify, tmdbDetails, tmdbImage } from '@/lib/tmdb';
import SiteHeader from '@/components/SiteHeader';
import CineveroInsight from '@/components/CineveroInsight';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinevero.vercel.app';

function parseId(slug: string) {
  const match = slug.match(/-(\d+)$/);
  return match ? Number(match[1]) : Number(slug);
}

function titleOf(item: any) {
  return item.title || item.name || item.original_title || item.original_name || 'Untitled';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const id = parseId(slug);

  if (!Number.isFinite(id)) {
    return { title: 'Movie not found', robots: { index: false } };
  }

  try {
    const movie = await tmdbDetails('movie', id);
    const title = titleOf(movie);
    const year = (movie.release_date || '').slice(0, 4);
    const description = `Explore ${title}${year ? ` (${year})` : ''}: story, cast, genres, rating, trailer and Cinevero viewing guide.`;
    const canonical = `${SITE_URL}/movie/${slug}`;

    return {
      title: `${title}${year ? ` (${year})` : ''} – Cast, Story, Rating & Details`,
      description,
      alternates: { canonical },
      openGraph: {
        title: `${title}${year ? ` (${year})` : ''} | Cinevero`,
        description,
        url: canonical,
        siteName: 'Cinevero',
        type: 'video.movie',
        images: movie.poster_path ? [tmdbImage(movie.poster_path, 'w780')] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | Cinevero`,
        description,
        images: movie.poster_path ? [tmdbImage(movie.poster_path, 'w780')] : [],
      },
    };
  } catch {
    return { title: 'Movie not found', robots: { index: false } };
  }
}

export default async function MoviePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = parseId(slug);

  if (!Number.isFinite(id)) notFound();

  let movie: any;
  try {
    movie = await tmdbDetails('movie', id);
  } catch {
    notFound();
  }

  const title = titleOf(movie);
  const year = (movie.release_date || '').slice(0, 4);
  const rating =
    typeof movie.vote_average === 'number' && movie.vote_average > 0
      ? movie.vote_average.toFixed(1)
      : 'N/A';
  const trailer =
    (movie.videos?.results || []).find(
      (video: any) =>
        video.site === 'YouTube' &&
        video.type === 'Trailer' &&
        video.official !== false,
    ) ||
    (movie.videos?.results || []).find(
      (video: any) => video.site === 'YouTube' && video.type === 'Trailer',
    );
  const recommendations = (movie.recommendations?.results || [])
    .filter((item: any) => item.poster_path)
    .slice(0, 12);
  const canonicalUrl = `${SITE_URL}/movie/${slug}`;
  const genres = (movie.genres || []).map((genre: any) => genre.name);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: title,
    description: movie.overview || undefined,
    image: movie.poster_path ? [tmdbImage(movie.poster_path, 'w780')] : undefined,
    datePublished: movie.release_date || undefined,
    aggregateRating:
      movie.vote_count > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: movie.vote_average,
            ratingCount: movie.vote_count,
            bestRating: 10,
            worstRating: 0,
          }
        : undefined,
    genre: genres,
    url: canonicalUrl,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Movies', item: `${SITE_URL}/movie` },
      { '@type': 'ListItem', position: 3, name: title, item: canonicalUrl },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <SiteHeader dark />

      <div className="mx-auto max-w-[1180px] px-4 pt-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/movie" className="hover:text-white">Movies</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">{title}</span>
        </nav>
      </div>

      <section className="relative mt-2 overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          {movie.backdrop_path && (
            <img
              src={tmdbImage(movie.backdrop_path, 'original')}
              alt=""
              className="h-full w-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/55" />
        <div className="relative mx-auto grid max-w-[1180px] gap-8 px-4 py-8 sm:grid-cols-[240px_1fr] sm:px-6 sm:py-12">
          <div>
            {movie.poster_path ? (
              <img
                src={tmdbImage(movie.poster_path, 'w500')}
                alt={`${title} poster`}
                className="w-full max-w-[240px] rounded-xl border border-white/10 shadow-2xl"
                fetchPriority="high"
                decoding="async"
              />
            ) : (
              <div className="aspect-[2/3] max-w-[240px] rounded-xl bg-zinc-900" />
            )}
          </div>
          <div className="self-center">
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-zinc-300">
              {year && <span>{year}</span>}
              {movie.runtime && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} aria-hidden="true" />
                  {movie.runtime} min
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Star size={13} fill="currentColor" aria-hidden="true" />
                {rating === 'N/A' ? 'Not rated' : `${rating}/10`}
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            {movie.tagline && <p className="mt-3 text-lg text-zinc-300">{movie.tagline}</p>}
            <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
              {movie.overview || 'No overview available.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {genres.map((name: string, index: number) => (
                <Link
                  key={`${name}-${index}`}
                  href={`/genre/${slugify(name)}`}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:border-red-500 hover:text-red-400"
                >
                  {name}
                </Link>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              {trailer && (
                <a
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
                >
                  <Play size={15} fill="currentColor" aria-hidden="true" />
                  Watch trailer
                </a>
              )}
              {movie.homepage && (
                <a
                  href={movie.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white hover:border-white/30"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                  Official site
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <CineveroInsight
        title={title}
        genres={genres}
        runtime={movie.runtime}
        overview={movie.overview}
        type="movie"
      />

      {trailer && (
        <section className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6">
          <h2 className="text-xl font-bold">Official trailer</h2>
          <div className="mt-5 aspect-video overflow-hidden rounded-xl bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title={`${title} official trailer`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6">
        <h2 className="text-xl font-bold">Cast</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {(movie.credits?.cast || []).slice(0, 12).map((person: any) => (
            <div key={`${person.id}-${person.character}`}>
              <div className="aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900">
                {person.profile_path ? (
                  <img
                    src={tmdbImage(person.profile_path, 'w342')}
                    alt={person.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                    No photo
                  </div>
                )}
              </div>
              <p className="mt-2 line-clamp-1 text-sm font-semibold">{person.name}</p>
              <p className="line-clamp-1 text-xs text-zinc-500">{person.character}</p>
            </div>
          ))}
        </div>
      </section>

      {recommendations.length > 0 && (
        <section className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-6">
          <h2 className="text-xl font-bold">You may also like</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {recommendations.map((item: any) => (
              <Link
                key={item.id}
                href={`/movie/${slugify(titleOf(item))}-${item.id}`}
                className="group min-w-0"
              >
                <div className="aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900">
                  <img
                    src={tmdbImage(item.poster_path, 'w342')}
                    alt={`${titleOf(item)} poster`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3 className="mt-2 line-clamp-2 text-sm font-semibold group-hover:text-red-400">
                  {titleOf(item)}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {(item.release_date || '').slice(0, 4)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
