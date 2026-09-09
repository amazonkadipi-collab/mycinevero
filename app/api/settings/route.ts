import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PORTAL_SETTINGS, getPortalSettings, savePortalSettings, type PortalSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';
const ADMIN_COOKIE = 'video_portal_admin';
const ORDERS = new Set(['latest', 'longest', 'shortest', 'top-rated', 'most-popular', 'top-weekly', 'top-monthly']);
const THUMB_SIZES = new Set(['small', 'medium', 'big']);

function isAdmin(request: NextRequest) { return request.cookies.get(ADMIN_COOKIE)?.value === 'authenticated'; }

function validateSettings(input: Record<string, unknown>): PortalSettings {
  const query = String(input.query ?? DEFAULT_PORTAL_SETTINGS.query).trim() || 'all';
  const order = String(input.order ?? DEFAULT_PORTAL_SETTINGS.order);
  const per_page = Number(input.per_page ?? DEFAULT_PORTAL_SETTINGS.per_page);
  const thumbsize = String(input.thumbsize ?? DEFAULT_PORTAL_SETTINGS.thumbsize);
  const gay = Number(input.gay ?? DEFAULT_PORTAL_SETTINGS.gay);
  const lq = Number(input.lq ?? DEFAULT_PORTAL_SETTINGS.lq);
  if (!ORDERS.has(order)) throw new Error('Invalid order');
  if (!Number.isInteger(per_page) || per_page < 1 || per_page > 1000) throw new Error('per_page must be an integer from 1 to 1000');
  if (!THUMB_SIZES.has(thumbsize)) throw new Error('Invalid thumbsize');
  if (![0, 1, 2].includes(gay)) throw new Error('Invalid secondary category value');
  if (![0, 1, 2].includes(lq)) throw new Error('Invalid lq value');
  return { query, order, per_page, thumbsize, gay, lq, format: 'json' };
}

export async function GET() {
  return NextResponse.json({ success: true, settings: await getPortalSettings() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const settings = validateSettings(await request.json());
    await savePortalSettings(settings);
    return NextResponse.json({ success: true, message: 'Settings saved successfully!', settings });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid settings' }, { status: 400 });
  }
}
