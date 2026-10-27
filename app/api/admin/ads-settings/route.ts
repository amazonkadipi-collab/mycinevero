import { NextResponse } from "next/server";
import { defaultAdsSettings, type AdsSettings } from "@/lib/ads-settings";

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const SETTING_KEY = "ads";

function storageConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function readSettings(): Promise<AdsSettings> {
  if (!storageConfigured()) throw new Error("Persistent settings storage is not configured");
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/site_settings?key=eq.${SETTING_KEY}&select=value&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(`Settings read failed: HTTP ${response.status}`);
  const rows = await response.json() as Array<{ value?: Partial<AdsSettings> }>;
  const value = rows[0]?.value;
  if (!value) return defaultAdsSettings;
  return {
    adsense: value.adsense === true,
    display300x250: value.display300x250 === true,
    adsterraNativeBanner: value.adsterraNativeBanner === true,
  };
}

export async function GET() {
  try {
    return NextResponse.json(await readSettings(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[admin/ads-settings] Read failed", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Could not load persistent ad settings. Check Supabase configuration and migrations." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  let body: Partial<AdsSettings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body ||
    typeof body.adsense !== "boolean" ||
    typeof body.display300x250 !== "boolean" ||
    typeof body.adsterraNativeBanner !== "boolean"
  ) {
    return NextResponse.json({ error: "All ad settings must be boolean values" }, { status: 400 });
  }

  if (!storageConfigured()) {
    return NextResponse.json(
      { error: "Persistent settings storage is not configured" },
      { status: 503 },
    );
  }

  const settings: AdsSettings = {
    adsense: body.adsense,
    display300x250: body.display300x250,
    adsterraNativeBanner: body.adsterraNativeBanner,
  };

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/site_settings?on_conflict=key`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY!,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify([{ key: SETTING_KEY, value: settings, updated_at: new Date().toISOString() }]),
        cache: "no-store",
      },
    );
    if (!response.ok) {
      const details = (await response.text()).slice(0, 300);
      console.error("[admin/ads-settings] Save failed", response.status, details);
      return NextResponse.json(
        { error: "Could not save ad settings. Confirm the site_settings migration is applied." },
        { status: 503 },
      );
    }
    return NextResponse.json(settings, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin/ads-settings] Save failed", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Could not save ad settings" }, { status: 503 });
  }
}
