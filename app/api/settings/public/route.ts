import { NextResponse } from 'next/server';
import { DEFAULT_PORTAL_SETTINGS, getPortalSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getPortalSettings();
    return NextResponse.json(
      {
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
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      {
        success: true,
        settings: {
          query: DEFAULT_PORTAL_SETTINGS.query,
          order: DEFAULT_PORTAL_SETTINGS.order,
          per_page: DEFAULT_PORTAL_SETTINGS.per_page,
          thumbsize: DEFAULT_PORTAL_SETTINGS.thumbsize,
          gay: DEFAULT_PORTAL_SETTINGS.gay,
          lq: DEFAULT_PORTAL_SETTINGS.lq,
          format: DEFAULT_PORTAL_SETTINGS.format,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
