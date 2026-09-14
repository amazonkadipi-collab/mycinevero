const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

export type CommunityMediaType = 'movie' | 'tv';

function assertConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Community storage is not configured');
}

async function supabase(path: string, init: RequestInit = {}) {
  assertConfig();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Community storage error: ${response.status}`);
  return response;
}

export function hasDisallowedLink(text: string) {
  const value = text.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (/<[^>]*>|javascript\s*:|data\s*:/i.test(value)) return true;
  const compact = value.toLowerCase().replace(/[\s\u00a0]+/g, '');
  if (/(https?:\/\/|ftp:\/\/|www\.)/i.test(compact)) return true;
  const normalized = value.toLowerCase().replace(/[\[\(]\s*\.\s*[\]\)]/g, '.').replace(/\s*\(\s*dot\s*\)\s*/gi, '.').replace(/\s*\[\s*dot\s*\]\s*/gi, '.').replace(/\s+dot\s+/gi, '.').replace(/\s*\.\s*/g, '.');
  return /(?:^|[^a-z0-9])(?:https?:\/\/|www\.)?[a-z0-9][a-z0-9.-]*\.(?:com|net|org|io|co|me|tv|ly|gg|dev|app|site|online|xyz|info|biz|store|shop|link|live|cc|to|ru|uk|us|ca|fr|de|es|it|ma)(?:$|[^a-z0-9])/i.test(normalized);
}

export function cleanName(value: unknown) { return String(value ?? '').normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 40); }
export function cleanComment(value: unknown) { return String(value ?? '').normalize('NFKC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, 1000); }

export async function getCommunity(mediaType: CommunityMediaType, tmdbId: number, fingerprint?: string) {
  const [commentsResponse, ratingsResponse] = await Promise.all([
    supabase(`cinevero_community_comments?tmdb_id=eq.${tmdbId}&media_type=eq.${mediaType}&status=eq.published&select=id,display_name,comment,is_spoiler,like_count,dislike_count,report_count,created_at&order=created_at.desc&limit=100`),
    supabase(`cinevero_community_ratings?tmdb_id=eq.${tmdbId}&media_type=eq.${mediaType}&select=rating,recommend,watched`),
  ]);
  const comments = await commentsResponse.json(); const ratings = await ratingsResponse.json(); const count = ratings.length;
  const average = count ? Math.round((ratings.reduce((sum: number, row: any) => sum + Number(row.rating), 0) / count) * 10) / 10 : null;
  let mine = { rating: 0, recommend: false, watched: false };
  if (fingerprint) {
    const mineResponse = await supabase(`cinevero_community_ratings?tmdb_id=eq.${tmdbId}&media_type=eq.${mediaType}&guest_fingerprint=eq.${encodeURIComponent(fingerprint)}&select=rating,recommend,watched&limit=1`);
    const own = (await mineResponse.json())?.[0];
    if (own) mine = { rating: Number(own.rating) || 0, recommend: Boolean(own.recommend), watched: Boolean(own.watched) };
  }
  return { comments, rating: { average, count, recommendations: ratings.filter((r: any) => r.recommend).length, watched: ratings.filter((r: any) => r.watched).length }, mine };
}

export async function recentCommentCount(fingerprint: string, minutes = 10) {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const response = await supabase(`cinevero_community_comments?guest_fingerprint=eq.${encodeURIComponent(fingerprint)}&created_at=gte.${encodeURIComponent(since)}&select=id`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows.length : 0;
}

export async function insertComment(input: { tmdbId: number; mediaType: CommunityMediaType; displayName: string; comment: string; isSpoiler: boolean; fingerprint: string }) {
  const response = await supabase('cinevero_community_comments', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ tmdb_id: input.tmdbId, media_type: input.mediaType, display_name: input.displayName, comment: input.comment, is_spoiler: input.isSpoiler, guest_fingerprint: input.fingerprint }) });
  const rows = await response.json(); return rows[0];
}

export async function upsertRating(input: { tmdbId: number; mediaType: CommunityMediaType; rating: number; recommend: boolean; watched: boolean; fingerprint: string }) {
  const existing = await supabase(`cinevero_community_ratings?tmdb_id=eq.${input.tmdbId}&media_type=eq.${input.mediaType}&guest_fingerprint=eq.${input.fingerprint}&select=id&limit=1`).then(r => r.json());
  if (existing[0]?.id) {
    const response = await supabase(`cinevero_community_ratings?id=eq.${existing[0].id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ rating: input.rating, recommend: input.recommend, watched: input.watched, updated_at: new Date().toISOString() }) });
    const rows = await response.json(); return rows[0];
  }
  const response = await supabase('cinevero_community_ratings', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ tmdb_id: input.tmdbId, media_type: input.mediaType, rating: input.rating, recommend: input.recommend, watched: input.watched, guest_fingerprint: input.fingerprint }) });
  const rows = await response.json(); return rows[0];
}

export async function reactToComment(input: { commentId: string; reaction: 'like' | 'dislike' | 'report'; fingerprint: string }) {
  assertConfig();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/cinevero_react_to_comment`, {
    method: 'POST',
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_comment_id: input.commentId, p_reaction: input.reaction, p_guest_fingerprint: input.fingerprint }),
    cache: 'no-store',
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Community reaction error: ${response.status}`);
  }
  return { ok: true };
}
