import fs from 'node:fs/promises';
import path from 'node:path';

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

export const DEFAULT_SETTINGS = {
  query: 'all',
  order: 'latest',
  per_page: 24,
  thumbsize: 'medium',
  gay: 0,
  lq: 1,
  format: 'json',
};

export async function getSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings) {
  const next = { ...DEFAULT_SETTINGS, ...settings };
  await fs.writeFile(SETTINGS_FILE, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}
