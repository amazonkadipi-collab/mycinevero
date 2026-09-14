export type QualityGateInput = {
  title?: string | null;
  overview?: string | null;
  posterPath?: string | null;
  genres?: unknown[] | null;
  castCount?: number | null;
  seasonCount?: number | null;
  episodeCount?: number | null;
  trailerAvailable?: boolean | null;
  recommendationCount?: number | null;
};

export type QualityGateResult = {
  indexable: boolean;
  score: number;
  core: {
    title: boolean;
    overview: boolean;
    poster: boolean;
  };
  value: {
    genres: boolean;
    cast: boolean;
    seasonsOrEpisodes: boolean;
    trailerOrRecommendations: boolean;
  };
  reasons: string[];
};

/**
 * Centralized SEO quality gate for detail pages.
 * It measures real catalog signals only; it never generates filler content.
 *
 * Core requirements: title + meaningful overview + poster.
 * Value signals: genres, cast, seasons/episodes, trailer/recommendations.
 * A missing trailer alone must never make an otherwise useful page noindex.
 */
export function evaluateQualityGate(input: QualityGateInput): QualityGateResult {
  const title = Boolean(input.title?.trim());
  const overview = Boolean(input.overview?.trim() && input.overview.trim().length >= 50);
  const poster = Boolean(input.posterPath);
  const genres = Array.isArray(input.genres) && input.genres.length > 0;
  const cast = Number(input.castCount ?? 0) > 0;
  const seasonsOrEpisodes = Number(input.seasonCount ?? 0) > 0 || Number(input.episodeCount ?? 0) > 0;
  const trailerOrRecommendations = Boolean(input.trailerAvailable) || Number(input.recommendationCount ?? 0) > 0;

  const corePassed = [title, overview, poster].filter(Boolean).length === 3;
  const valueScore = [genres, cast, seasonsOrEpisodes, trailerOrRecommendations].filter(Boolean).length;
  const score = (corePassed ? 60 : [title, overview, poster].filter(Boolean).length * 20) + valueScore * 10;

  const reasons: string[] = [];
  if (!title) reasons.push('Missing title');
  if (!overview) reasons.push('Overview is missing or too short');
  if (!poster) reasons.push('Missing poster');
  if (!genres) reasons.push('No genres');
  if (!cast) reasons.push('No cast data');
  if (!seasonsOrEpisodes) reasons.push('No season/episode data');
  if (!trailerOrRecommendations) reasons.push('No trailer or recommendations');

  // Index only pages with all core catalog data plus at least two independent value signals.
  const indexable = corePassed && valueScore >= 2;

  return {
    indexable,
    score,
    core: { title, overview, poster },
    value: { genres, cast, seasonsOrEpisodes, trailerOrRecommendations },
    reasons,
  };
}
