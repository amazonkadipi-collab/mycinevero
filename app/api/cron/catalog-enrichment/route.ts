import { NextResponse } from 'next/server';
import { tmdbDetails } from '@/lib/tmdb';
import {
  finishSyncRun,
  getPendingCatalogTitles,
  markCatalogEnrichmentError,
  startSyncRun,
  updateCatalogAfterEnrichment,
} from '@/lib/catalog-registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
}

function parseBatch(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(Math.floor(parsed), 80)) : fallback;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) {
  const results: R[] = [];
  let cursor = 0;

  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

export async function GET(request: Request) {
  if (!authorized(request)) return new NextResponse('Unauthorized', { status: 401 });

  const batch = parseBatch(process.env.CATALOG_ENRICH_BATCH, 80);
  const titles = await getPendingCatalogTitles(batch);
  const runId = await startSyncRun('tmdb_catalog_enrichment', titles.length);

  let ready = 0;
  let indexable = 0;
  let removed = 0;
  let errors = 0;

  await mapWithConcurrency(titles, 8, async row => {
    try {
      const detail = await tmdbDetails(row.media_type, row.tmdb_id);
      const result = await updateCatalogAfterEnrichment(row, detail);
      ready += 1;
      if (result.quality.indexable) indexable += 1;
    } catch (error) {
      const result = await markCatalogEnrichmentError(row, error);
      if (result.state === 'removed') removed += 1;
      else errors += 1;
    }
  });

  await finishSyncRun(runId, {
    status: errors ? 'completed_with_errors' : 'completed',
    synced_count: ready,
    error: errors ? `${errors} title(s) failed enrichment; they were scheduled for retry` : null,
  });

  return NextResponse.json({
    ok: true,
    requested: titles.length,
    enriched: ready,
    indexable,
    removed,
    errors,
  });
}
