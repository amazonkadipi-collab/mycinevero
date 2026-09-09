import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';
const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');
const ADMIN_COOKIE = 'video_portal_admin';
const DEFAULT_SETTINGS = { query: 'all', order: 'latest', per_page: 30, thumbsize: 'medium', lq: 1, format: 'json' } as const;
const ORDERS = new Set(['latest', 'longest', 'shortest', 'top-rated', 'most-popular', 'top-weekly', 'top-monthly']);
const THUMB_SIZES = new Set(['small', 'medium', 'big']);

async function readSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(await fs.readFile(SETTINGS_FILE, 'utf8')), format: 'json' }; }
  catch { return { ...DEFAULT_SETTINGS }; }
}

function validateSettings(input: Record<string, unknown>) {
  const query = String(input.query ?? 'all').trim() || 'all';
  const order = String(input.order ?? 'latest');
  const per_page = Number(input.per_page ?? 30);
  const thumbsize = String(input.thumbsize ?? 'medium');
  const lq = Number(input.lq ?? 1);
  if (!ORDERS.has(order)) throw new Error('Invalid order');
  if (!Number.isInteger(per_page) || per_page < 1 || per_page > 1000) throw new Error('per_page must be an integer from 1 to 1000');
  if (!THUMB_SIZES.has(thumbsize)) throw new Error('Invalid thumbsize');
  if (![0, 1, 2].includes(lq)) throw new Error('Invalid lq value');
  return { query, order, per_page, thumbsize, lq, format: 'json' };
}

function isAdmin(request: NextRequest) { return request.cookies.get(ADMIN_COOKIE)?.value === 'authenticated'; }

export async function GET() { return NextResponse.json({ success: true, settings: await readSettings() }, { headers: { 'Cache-Control': 'no-store' } }); }

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const settings = validateSettings(await request.json());
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2) + '\n', 'utf8');
    return NextResponse.json({ success: true, message: 'Settings saved successfully!', settings });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid settings' }, { status: 400 }); }
}
