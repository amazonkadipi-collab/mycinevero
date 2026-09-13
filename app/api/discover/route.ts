import { NextResponse } from 'next/server';
import { tmdbDiscover, tmdbDetails, type TmdbMediaType, type TmdbTitle } from '@/lib/tmdb';
import { prefilterCandidates, scoreCandidate, diversify, type DiscoverContext, type FeedbackEvent } from '@/lib/cinevero-engine';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(request: Request) {
  const now = Date.now();
  const key = getClientKey(request);
  const current = rateLimit.get(key);

  if (!current || current.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 60 };
  }

  if (current.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { allowed: true, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}

const parseContext = (body: Record<string, unknown>): DiscoverContext => ({
  mood: typeof body.mood === 'string' ? body.mood : undefined,
  time: typeof body.time === 'number' ? body.time : undefined,
  genre: typeof body.genre === 'number' ? body.genre : undefined,
  who: ['solo','couple','family','friends'].includes(String(body.who)) ? body.who as DiscoverContext['who'] : undefined,
  language: typeof body.language === 'string' ? body.language : undefined,
  minRating: typeof body.minRating === 'number' ? body.minRating : undefined,
  pace: ['slow','balanced','fast'].includes(String(body.pace)) ? body.pace as DiscoverContext['pace'] : undefined,
});

async function candidates(type: TmdbMediaType, context: DiscoverContext) {
  const results = await Promise.all([1, 2].map(page => tmdbDiscover(type, page, {
    genreId: context.genre,
    runtimeMax: context.time,
    voteAverageMin: context.minRating,
    sortBy: 'popularity.desc',
  }).catch(() => ({ results: [] as TmdbTitle[], total_pages: 0 }))));
  return prefilterCandidates(results.flatMap(x => x.results), context);
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request);
  if (!limit.allowed) {
    return NextResponse.json(
      { picks: [], error: 'Too many Discover requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const context = parseContext(body);
    const feedback = Array.isArray(body.feedback) ? body.feedback as FeedbackEvent[] : [];
    const [movies, series] = await Promise.all([candidates('movie', context), candidates('tv', context)]);
    const pool = [...movies.map(x => ({ ...x, media_type: 'movie' as const })), ...series.map(x => ({ ...x, media_type: 'tv' as const }))]
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, 24);

    // Selective enrichment: only the best basic-metadata candidates get expensive details.
    const enriched = (await Promise.all(pool.slice(0, 12).map(async item => {
      try { return await tmdbDetails(item.media_type!, item.id); }
      catch { return item; }
    }))).map((item, i) => ({ ...pool[i], ...item, media_type: pool[i].media_type }));

    const ranked = enriched.map(item => scoreCandidate(item, context, feedback));
    const picks = diversify(ranked, 5).map(item => ({
      id: item.id,
      media_type: item.media_type,
      title: item.title || item.name || item.original_title || item.original_name || 'Untitled',
      year: (item.release_date || item.first_air_date || '').slice(0, 4),
      poster_path: item.poster_path ?? null,
      backdrop_path: item.backdrop_path ?? null,
      overview: item.overview ?? '',
      runtime: item.runtime ?? item.episode_run_time?.[0] ?? null,
      vote_average: item.vote_average ?? 0,
      vote_count: item.vote_count ?? 0,
      original_language: item.original_language ?? '',
      genres: item.genres ?? [],
      cineveroScore: item.cineveroScore,
      cineveroReasons: item.cineveroReasons,
      trailerKey: item.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer' && (v.official ?? true))?.key ?? null,
      providers: item.watch_providers?.results?.US?.flatrate?.slice(0, 4).map(p => p.provider_name) ?? [],
    }));

    return NextResponse.json({ picks, candidateCount: pool.length, enrichedCount: enriched.length, engineVersion: 'v1-context-rules' });
  } catch (error) {
    console.error('Cinevero Discover error', error);
    return NextResponse.json({ picks: [], error: 'Unable to build recommendations right now.' }, { status: 500 });
  }
}
