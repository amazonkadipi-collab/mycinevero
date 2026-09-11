import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PORTAL_SETTINGS, getPortalSettings, getSavedPortalSettings, savePortalSettings, type PortalSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';
const ADMIN_COOKIE = 'elovex_admin';
const ORDERS = new Set(['latest','longest','shortest','top-rated','most-popular','top-weekly','top-monthly']);
const THUMB_SIZES = new Set(['small','medium','big']);
const METHODS = new Set(['search','id','removed']);
const FORMATS = new Set(['json','xml']);
const SELECT_VALUES = new Set(['0','1','2']);
const PAGE_VALUES = new Set(['12','24','48','96']);
const CACHE_VALUES = new Set(['0','60','300','3600']);

function isAdmin(request: NextRequest) { return request.cookies.get(ADMIN_COOKIE)?.value === 'authenticated'; }
function cleanText(value: unknown, max = 500) { return String(value ?? '').trim().slice(0, max); }
function cleanPath(value: unknown, fallback: string) {
  const path = cleanText(value, 300) || fallback;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) throw new Error('API path must be a relative path starting with /');
  return path;
}
function optionalNumber(value: unknown, allowed: Set<string>, field: string) {
  if (value === '' || value === null || value === undefined) return '' as const;
  const stringValue = String(value);
  if (!allowed.has(stringValue)) throw new Error(`Invalid ${field}`);
  return Number(stringValue);
}

function validateSettings(input: Record<string, unknown>): PortalSettings {
  const query = cleanText(input.query, 200);
  const order = cleanText(input.order, 40);
  const thumbsize = cleanText(input.thumbsize, 20);
  const method = cleanText(input.method, 20);
  const video_id = cleanText(input.video_id, 200);
  const format = cleanText(input.format, 10) as PortalSettings['format'];
  const api_base_url = cleanText(input.api_base_url, 500);
  const api_search_path = cleanPath(input.api_search_path, '/search');
  const api_details_path = cleanPath(input.api_details_path, '/details');
  const api_format = cleanText(input.api_format, 10) as PortalSettings['api_format'];
  const per_page = optionalNumber(input.per_page, PAGE_VALUES, 'per_page');
  const gay = optionalNumber(input.gay, SELECT_VALUES, 'filter option A');
  const lq = optionalNumber(input.lq, SELECT_VALUES, 'filter option B');
  const items_per_page = optionalNumber(input.items_per_page, PAGE_VALUES, 'items per page');
  const cache_duration = optionalNumber(input.cache_duration, CACHE_VALUES, 'cache duration');
  const api_timeout_ms = input.api_timeout_ms === '' || input.api_timeout_ms == null ? '' : Number(input.api_timeout_ms);

  if (order && !ORDERS.has(order)) throw new Error('Invalid order');
  if (thumbsize && !THUMB_SIZES.has(thumbsize)) throw new Error('Invalid thumbsize');
  if (method && !METHODS.has(method)) throw new Error('Invalid API method');
  if (format && !FORMATS.has(format)) throw new Error('Invalid response format');
  if (api_format && !FORMATS.has(api_format)) throw new Error('Invalid API response format');
  if (api_timeout_ms !== '' && (!Number.isInteger(api_timeout_ms) || api_timeout_ms < 1000 || api_timeout_ms > 60000)) throw new Error('API timeout must be between 1000 and 60000 ms');
  if (api_base_url) {
    const parsed = new URL(api_base_url);
    if (!['http:','https:'].includes(parsed.protocol)) throw new Error('API Base URL must use HTTP or HTTPS');
    if (parsed.username || parsed.password) throw new Error('API Base URL must not contain embedded credentials');
  }
  return { query, order, per_page, thumbsize, gay, lq, format, method, video_id, api_base_url, api_search_path, api_details_path, api_timeout_ms, api_format, items_per_page, cache_duration };
}

const ADMIN_FIELDS: (keyof PortalSettings)[] = ['query','order','per_page','thumbsize','gay','lq','format','method','video_id','api_base_url','api_search_path','api_details_path','api_timeout_ms','api_format','items_per_page','cache_duration'];
function blankAdminSettings(saved: Partial<PortalSettings>): Record<string, unknown> {
  return Object.fromEntries(ADMIN_FIELDS.map((key) => [key, saved[key] ?? '']));
}

export async function GET(request: NextRequest) {
  if (isAdmin(request)) {
    const saved = await getSavedPortalSettings();
    return NextResponse.json({ success: true, settings: blankAdminSettings(saved) }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const settings = await getPortalSettings();
  return NextResponse.json({ success: true, settings: { query: settings.query, order: settings.order, per_page: settings.per_page, thumbsize: settings.thumbsize, gay: settings.gay, lq: settings.lq, format: settings.format, method: settings.method } }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const settings = validateSettings(await request.json());
    await savePortalSettings(settings);
    return NextResponse.json({ success: true, message: 'Settings saved successfully!', settings: blankAdminSettings(settings) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid settings' }, { status: 400 });
  }
}
