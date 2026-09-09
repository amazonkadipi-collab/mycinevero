import { NextResponse } from 'next/server';
import { DEFAULT_SETTINGS, getSettings, saveSettings } from '../../../../lib/storage';

const ORDERS = new Set(['latest', 'longest', 'shortest', 'top-rated', 'most-popular', 'top-weekly', 'top-monthly']);
const PER_PAGE = new Set([12, 24, 48]);
const THUMBS = new Set(['small', 'medium', 'big']);
const MODES = new Set([0, 1, 2]);
const FORMATS = new Set(['json', 'xml']);

function validate(input) {
  const value = {
    query: String(input?.query ?? DEFAULT_SETTINGS.query).trim() || 'all',
    order: String(input?.order ?? DEFAULT_SETTINGS.order),
    per_page: Number(input?.per_page ?? DEFAULT_SETTINGS.per_page),
    thumbsize: String(input?.thumbsize ?? DEFAULT_SETTINGS.thumbsize),
    gay: Number(input?.gay ?? DEFAULT_SETTINGS.gay),
    lq: Number(input?.lq ?? DEFAULT_SETTINGS.lq),
    format: String(input?.format ?? DEFAULT_SETTINGS.format),
  };

  if (!ORDERS.has(value.order)) throw new Error('Invalid order');
  if (!PER_PAGE.has(value.per_page)) throw new Error('Invalid per_page');
  if (!THUMBS.has(value.thumbsize)) throw new Error('Invalid thumbsize');
  if (!MODES.has(value.gay)) throw new Error('Invalid gay mode');
  if (!MODES.has(value.lq)) throw new Error('Invalid low-quality mode');
  if (!FORMATS.has(value.format)) throw new Error('Invalid format');

  return value;
}

function isAdmin(request) {
  return request.cookies.get('video_portal_admin')?.value === 'authenticated';
}

export async function GET(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await getSettings());
}

export async function POST(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const settings = validate(body);
    const saved = await saveSettings(settings);
    return NextResponse.json({ success: true, message: 'Settings saved successfully!', settings: saved });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid settings' }, { status: 400 });
  }
}
