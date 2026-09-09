const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export type PortalSettings = {
  query: string;
  order: string;
  per_page: number;
  thumbsize: string;
  gay: number;
  lq: number;
  format: 'json';
};

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  query: 'all', order: 'latest', per_page: 30, thumbsize: 'medium', gay: 0, lq: 1, format: 'json',
};

const KEYS = Object.keys(DEFAULT_PORTAL_SETTINGS) as (keyof PortalSettings)[];

async function supabaseRequest(path: string, init?: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase is not configured');
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

export async function getPortalSettings(): Promise<PortalSettings> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { ...DEFAULT_PORTAL_SETTINGS };
  try {
    const response = await supabaseRequest('site_settings?select=key,value&key=like.elovex_*');
    if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}`);
    const rows = (await response.json()) as { key: string; value: string }[];
    const settings: Record<string, unknown> = { ...DEFAULT_PORTAL_SETTINGS };
    for (const row of rows) {
      const key = row.key.replace(/^elovex_/, '') as keyof PortalSettings;
      if (!KEYS.includes(key)) continue;
      settings[key] = key === 'query' || key === 'order' || key === 'thumbsize' || key === 'format' ? row.value : Number(row.value);
    }
    return { ...DEFAULT_PORTAL_SETTINGS, ...settings } as PortalSettings;
  } catch {
    return { ...DEFAULT_PORTAL_SETTINGS };
  }
}

export async function savePortalSettings(settings: PortalSettings) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.');
  const rows = KEYS.map((key) => ({
    key: `elovex_${key}`,
    value: String(settings[key]),
    value_type: typeof settings[key] === 'number' ? 'number' : 'text',
    description: `Elovex portal setting: ${key}`,
    updated_by: 'admin',
    updated_at: new Date().toISOString(),
  }));
  const response = await supabaseRequest('site_settings?on_conflict=key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Could not save settings (${response.status}): ${detail.slice(0, 300)}`);
  }
  return settings;
}
