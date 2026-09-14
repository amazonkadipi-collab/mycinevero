import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import { getCommunity, hasDisallowedLink, cleanComment, cleanName, insertComment, upsertRating, reactToComment, type CommunityMediaType } from '@/lib/cinevero-community';

const COOKIE = 'cinevero_guest';

function media(value: string | null): CommunityMediaType | null { return value === 'movie' || value === 'tv' ? value : null; }
function tmdb(value: string | null) { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : null; }
function fingerprint(req: NextRequest, guest: string) { return createHash('sha256').update(`${guest}:${req.headers.get('user-agent') || ''}`).digest('hex'); }
function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }

async function guestId(req: NextRequest) {
  return req.cookies.get(COOKIE)?.value || randomUUID();
}

export async function GET(req: NextRequest) {
  const type = media(req.nextUrl.searchParams.get('type')); const id = tmdb(req.nextUrl.searchParams.get('tmdbId'));
  if (!type || !id) return json({ error: 'Invalid title' }, 400);
  try {
    const data = await getCommunity(type, id);
    const response = json(data);
    if (!req.cookies.get(COOKIE)) response.cookies.set(COOKIE, await guestId(req), { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 365 });
    return response;
  } catch { return json({ error: 'Community is temporarily unavailable' }, 503); }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const type = media(body?.mediaType); const id = tmdb(String(body?.tmdbId ?? ''));
  if (!type || !id) return json({ error: 'Invalid title' }, 400);
  const guest = await guestId(req); const fp = fingerprint(req, guest);
  try {
    if (body?.action === 'comment') {
      const name = cleanName(body.displayName); const comment = cleanComment(body.comment);
      if (name.length < 1 || comment.length < 1) return json({ error: 'Name and comment are required' }, 400);
      if (hasDisallowedLink(comment)) return json({ error: 'Links are not allowed in comments.' }, 400);
      const row = await insertComment({ tmdbId: id, mediaType: type, displayName: name, comment, isSpoiler: Boolean(body.isSpoiler), fingerprint: fp });
      const response = json({ ok: true, comment: row });
      if (!req.cookies.get(COOKIE)) response.cookies.set(COOKIE, guest, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 365 });
      return response;
    }
    if (body?.action === 'rating') {
      const rating = Number(body.rating); if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: 'Rating must be 1 to 5' }, 400);
      const row = await upsertRating({ tmdbId: id, mediaType: type, rating, recommend: Boolean(body.recommend), watched: Boolean(body.watched), fingerprint: fp });
      return json({ ok: true, rating: row });
    }
    if (body?.action === 'reaction') {
      if (!body.commentId || !['like', 'dislike', 'report'].includes(body.reaction)) return json({ error: 'Invalid reaction' }, 400);
      await reactToComment({ commentId: String(body.commentId), reaction: body.reaction, fingerprint: fp });
      return json({ ok: true });
    }
    return json({ error: 'Unknown action' }, 400);
  } catch (error: any) {
    const message = String(error?.message || 'Community is temporarily unavailable');
    if (message.includes('23505') || message.includes('duplicate')) return json({ error: 'You already sent this reaction.' }, 409);
    return json({ error: 'Community is temporarily unavailable' }, 503);
  }
}
