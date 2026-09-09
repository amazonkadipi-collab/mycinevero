import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

const DEFAULT_SETTINGS = {
  query: 'all',
  order: 'latest',
  per_page: 24,
  thumbsize: 'medium',
  gay: 0,
  lq: 1,
  format: 'json',
} as const;

const ORDERS = new Set([
  'latest',
  'longest',
  'shortest',
  'top-rated',
  'most-popular',
  'top-weekly',
  'top-monthly',
]);

const PER_PAGE = new Set([12, 24, 48]);
const THUMB_SIZES = new Set(['small', 'medium', 'big']);
const FILTER_VALUES = new Set([0, 1, 2]);
const FORMATS = new Set(['json', 'xml']);

async function readSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf8');
    const saved = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function validateSettings(input: Record<string, unknown>) {
  const query = String(input.query ?? 'all').trim() || 'all';
  const order = String(input.order ?? 'latest');
  const per_page = Number(input.per_page ?? 24);
  const thumbsize = String(input.thumbsize ?? 'medium');
  const gay = Number(input.gay ?? 0);
  const lq = Number(input.lq ?? 1);
  const format = String(input.format ?? 'json');

  if (!ORDERS.has(order)) throw new Error('Invalid order');
  if (!PER_PAGE.has(per_page)) throw new Error('Invalid per_page');
  if (!THUMB_SIZES.has(thumbsize)) throw new Error('Invalid thumbsize');
  if (!FILTER_VALUES.has(gay)) throw new Error('Invalid gay value');
  if (!FILTER_VALUES.has(lq)) throw new Error('Invalid lq value');
  if (!FORMATS.has(format)) throw new Error('Invalid format');

  return { query, order, per_page, thumbsize, gay, lq, format };
}

export async function GET() {
  return NextResponse.json(await readSettings());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = validateSettings(body);

    await fs.writeFile(
      SETTINGS_FILE,
      JSON.stringify(settings, null, 2) + '\n',
      'utf8',
    );

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully!',
      settings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid settings';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
