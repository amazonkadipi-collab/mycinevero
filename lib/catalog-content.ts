import { cache } from 'react';
import { getCatalogTitle } from './catalog-registry';
import { tmdbDetails, type TmdbMediaType, type TmdbTitle } from './tmdb';

export const getCatalogDetail = cache(async (mediaType: TmdbMediaType, tmdbId: number): Promise<TmdbTitle> => {
  try {
    const row = await getCatalogTitle(mediaType, tmdbId);
    if (row?.raw && typeof row.raw === 'object') return row.raw;
  } catch {
    // The catalog is an optimization; TMDB remains the authoritative fallback.
  }
  return tmdbDetails(mediaType, tmdbId);
});
