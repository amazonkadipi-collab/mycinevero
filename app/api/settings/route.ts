import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PORTAL_SETTINGS, getPortalSettings, savePortalSettings, type PortalSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';
const ADMIN_COOKIE = 'elovex_admin';
const ORDERS = new Set(['latest', 'longest', 'shortest', 'top-rated', 'most-popular', 'top-weekly', 'top-monthly']);
const THUMB_SIZES = new Set(['small', 'medium', 'big']);

function isAdmin(request: NextRequest) { return request.cookies.get(ADMIN_COOKIE)?.value === 'authenticated'; }

function cleanPath(value: unknown, fallback: string) {
  const path = String(value ?? fallback).trim() || fallback;
  if (path.length > 300 || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) throw new Error('API path must be a relative path starting with /');
  return path;
}

function validateSettings(input: Record<string, unknown>): PortalSettings {
  const query = String(input.query ?? DEFAULT_PORTAL_SETTINGS.query).trim().slice(0, 200) || 'all';
  const order = String(input.order ?? DEFAULT_PORTAL_SETTINGS.order);
  const per_page = Number(input.per_page ?? DEFAULT_PORTAL_SETTINGS.per_page);
  const thumbsize = String(input.thumbsize ?? DEFAULT_PORTAL_SETTINGS.thumbsize);
  const gay = Number(input.gay ?? DEFAULT_PORTAL_SETTINGS.gay);
  const lq = Number(input.lq ?? DEFAULT_PORTAL_SETTINGS.lq);
  const api_base_url = String(input.api_base_url ?? DEFAULT_PORTAL_SETTINGS.api_base_url).trim().slice(0, 500) || DEFAULT_PORTAL_SETTINGS.api_base_url;
  const api_search_path = cleanPath(input.api_search_path, DEFAULT_PORTAL_SETTINGS.api_search_path);
  const api_details_path = cleanPath(input.api_details_path, DEFAULT_PORTAL_SETTINGS.api_details_path);
  const api_timeout_ms = Number(input.api_timeout_ms ?? DEFAULT_PORTAL_SETTINGS.api_timeout_ms);
  if (!ORDERS.has(order)) throw new Error('Invalid order');
  if (!Number.isInteger(per_page) || per_page < 1 || per_page > 1000) throw new Error('per_page must be an integer from 1 to 1000');
  if (!THUMB_SIZES.has(thumbsize)) throw new Error('Invalid thumbsize');
  if (![0, 1, 2].includes(gay)) throw new Error('Invalid secondary category value');
  if (![0, 1, 2].includes(lq)) throw new Error('Invalid lq value');
  if (!Number.isInteger(api_timeout_ms) || api_timeout_ms < 1000 || api_timeout_ms > 60000) throw new Error('API timeout must be between 1000 and 60000 ms');
  if (api_base_url !== DEFAULT_PORTAL_SETTINGS.api_base_url) {
    const parsed = new URL(api_base_url);
    if (parsed.protocol !== 'https:' && process.env.NODE_ENV === 'production') throw new Error('API base URL must use HTTPS in production');
    if (parsed.username || parsed.password) throw new Error('API base URL must not contain embedded credentials');
  }
  return { query, order, per_page, thumbsize, gay, lq, format: 'json', api_base_url, api_search_path, api_details_path, api_timeout_ms, api_format: 'json' };
}

export async function GET(request: NextRequest) {
  const settings = await getPortalSettings();
  if (!isAdmin(request)) {
    return NextResponse.json({
      success: true,
      settings: {
        query: settings.query,
        order: settings.order,
        per_page: settings.per_page,
        thumbsize: settings.thumbsize,
        gay: settings.gay,
        lq: settings.lq,
        format: settings.format,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json({ success: true, settings }, { headers: { 'Cache-Control': 'no-store' } });
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
