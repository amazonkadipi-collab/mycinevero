import type { TmdbTitle, TmdbMediaType } from './tmdb';

export type DiscoverContext = {
  mood?: string;
  time?: number;
  genre?: number;
  who?: 'solo' | 'couple' | 'family' | 'friends';
  language?: string;
  minRating?: number;
  pace?: 'slow' | 'balanced' | 'fast';
};

export type FeedbackReason = 'too-long' | 'too-slow' | 'already-seen' | 'not-for-me';
export type FeedbackEvent = { action: 'click' | 'save' | 'trailer' | 'skip' | 'feedback'; reason?: FeedbackReason; titleId: number; mediaType: TmdbMediaType; timestamp: number };

const MOOD_GENRES: Record<string, number[]> = {
  feelgood: [35, 10749, 10751], adrenaline: [28, 53, 12], dark: [27, 53, 9648], mindbending: [878, 9648, 53], emotional: [18, 10749], funny: [35], scary: [27, 53], relaxing: [16, 35, 10751], inspiring: [18, 36, 12],
};

const FAMILY_GENRES = new Set([16, 10751, 35, 12]);
const FAST_GENRES = new Set([28, 53, 12, 80]);
const SLOW_GENRES = new Set([18, 36, 99]);

function genresOf(item: TmdbTitle) { return item.genres?.map(g => g.id) ?? item.genre_ids ?? []; }
function runtimeOf(item: TmdbTitle) { return item.runtime ?? (item.episode_run_time?.[0] ?? 0); }
function baseQuality(item: TmdbTitle) {
  const rating = Math.min(10, Math.max(0, item.vote_average ?? 0));
  const votesConfidence = Math.min(1, Math.log10((item.vote_count ?? 0) + 1) / 5);
  const popularity = Math.min(1, Math.log10((item.popularity ?? 0) + 1) / 4);
  return (rating / 10) * 18 + votesConfidence * 5 + popularity * 7;
}

export function prefilterCandidates(items: TmdbTitle[], context: DiscoverContext) {
  const now = new Date().getFullYear();
  return items.filter(item => {
    const rating = item.vote_average ?? 0;
    const year = Number((item.release_date || item.first_air_date || '').slice(0, 4));
    if (item.adult) return false;
    if (rating > 0 && rating < Math.max(4.5, (context.minRating ?? 0) - 0.5)) return false;
    // Do not hard-reject low-vote titles: new and niche releases can still be excellent matches.
    if (year && year > now + 1) return false;
    return true;
  });
}

export function scoreCandidate(item: TmdbTitle, context: DiscoverContext, feedback: FeedbackEvent[] = []) {
  const genres = new Set(genresOf(item));
  const rating = item.vote_average ?? 0;
  const runtime = runtimeOf(item);
  const directFeedback = feedback.filter(e => e.titleId === item.id);
  if (directFeedback.some(e => e.reason === 'already-seen' || e.reason === 'not-for-me')) {
    return { ...item, cineveroScore: -100, cineveroReasons: [] as string[] };
  }

  let score = baseQuality(item);
  const reasons: string[] = [];

  const moodGenres = context.mood ? MOOD_GENRES[context.mood] ?? [] : [];
  const moodHits = moodGenres.filter(id => genres.has(id)).length;
  if (moodHits) {
    score += Math.min(23, 18 + moodHits * 3);
    reasons.push(context.mood === 'feelgood' ? 'feel-good' : context.mood === 'adrenaline' ? 'high-energy' : context.mood === 'dark' ? 'dark and atmospheric' : context.mood === 'mindbending' ? 'thought-provoking' : context.mood === 'emotional' ? 'emotional' : 'fits your mood');
  }
  if (context.genre && genres.has(context.genre)) { score += 20; reasons.push('your chosen genre'); }

  if (context.time && runtime) {
    const delta = runtime - context.time;
    if (delta <= 0) { score += 20; reasons.push(`${runtime} min fits your time`); }
    else if (delta <= 20) score -= 8;
    else score -= Math.min(25, 10 + delta / 2);
  }
  if (context.who === 'family') { if ([...genres].some(g => FAMILY_GENRES.has(g))) { score += 12; reasons.push('family-friendly style'); } else if (genres.has(27)) score -= 30; }
  if (context.who === 'friends' && [...genres].some(g => FAST_GENRES.has(g) || g === 35)) { score += 10; reasons.push('good for a group watch'); }
  if (context.who === 'couple' && [...genres].some(g => [10749, 18, 53].includes(g))) { score += 10; reasons.push('works well for two'); }
  if (context.pace === 'fast' && [...genres].some(g => FAST_GENRES.has(g))) { score += 10; reasons.push('fast-paced'); }
  if (context.pace === 'slow' && [...genres].some(g => SLOW_GENRES.has(g))) { score += 10; reasons.push('slower, atmospheric pace'); }
  if (context.minRating && rating >= context.minRating) { score += 5; reasons.push(`${rating.toFixed(1)}/10 rating`); }
  if (context.language && item.original_language === context.language) { score += 5; reasons.push('matches your language'); }

  for (const event of feedback.filter(e => e.titleId !== item.id)) {
    if (event.reason === 'too-long' && runtime && context.time && runtime > context.time) score -= 5;
    if (event.reason === 'too-slow' && [...genres].some(g => SLOW_GENRES.has(g))) score -= 4;
  }

  return { ...item, cineveroScore: Math.max(0, Math.min(100, Math.round(score * 10) / 10)), cineveroReasons: reasons.slice(0, 3) };
}

export function diversify<T extends { id: number; cineveroScore: number }>(items: T[], limit = 5) {
  const selected: T[] = [];
  const genreSeen = new Set<number>();
  for (const item of [...items].sort((a, b) => b.cineveroScore - a.cineveroScore)) {
    if (item.cineveroScore < 0) continue;
    const genres = (item as TmdbTitle).genres?.map(g => g.id) ?? (item as TmdbTitle).genre_ids ?? [];
    const overlap = genres.some(g => genreSeen.has(g));
    if (selected.length < 2 || !overlap || selected.length >= limit - 1) {
      selected.push(item); genres.slice(0, 2).forEach(g => genreSeen.add(g));
    }
    if (selected.length >= limit) break;
  }
  return selected;
}
