'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Save, Settings2 } from 'lucide-react';
import Link from 'next/link';

const DEFAULTS = {
  query: 'all',
  order: 'latest',
  per_page: 24,
  thumbsize: 'medium',
  gay: 0,
  lq: 1,
  format: 'json',
};

const orders = [
  ['latest', 'Latest'],
  ['longest', 'Longest'],
  ['shortest', 'Shortest'],
  ['top-rated', 'Top Rated'],
  ['most-popular', 'Most Popular'],
  ['top-weekly', 'Top Weekly'],
  ['top-monthly', 'Top Monthly'],
];

export default function AdminPage() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load settings');
        return response.json();
      })
      .then((data) => setSettings({ ...DEFAULTS, ...data }))
      .catch(() => setMessage('Using default settings.'));
  }, []);

  const update = (key: keyof typeof DEFAULTS, value: string | number) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save settings');

      setSettings(data.settings);
      setMessage('Settings saved successfully!');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-200 font-sans selection:bg-red-700 selection:text-white">
      <header className="bg-red-800 text-white shadow-md border-b border-red-900/60 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-zinc-950 flex items-center justify-center border border-red-500/40">
              <Settings2 className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-white">
                VIDEO<span className="bg-zinc-950 text-red-500 px-1.5 py-0.5 rounded text-xs ml-1 border border-red-900/80">PORTAL</span>
              </div>
              <div className="text-[10px] text-red-200/80 tracking-wider uppercase font-medium">Admin Dashboard</div>
            </div>
          </div>

          <Link href="/" className="inline-flex items-center gap-2 text-sm text-red-100 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to portal
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-800">
            <h1 className="text-xl font-bold text-white">Video Search Settings</h1>
            <p className="mt-1 text-sm text-zinc-500">Configure the default search behavior for the portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <label className="block">
              <span className="block mb-2 text-sm font-medium text-zinc-300">Search Query</span>
              <input
                value={settings.query}
                onChange={(e) => update('query', e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500"
                placeholder="all"
              />
            </label>

            <label className="block">
              <span className="block mb-2 text-sm font-medium text-zinc-300">Order</span>
              <select value={settings.order} onChange={(e) => update('order', e.target.value)} className="admin-select">
                {orders.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="block mb-2 text-sm font-medium text-zinc-300">Per Page</span>
              <select value={settings.per_page} onChange={(e) => update('per_page', Number(e.target.value))} className="admin-select">
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </label>

            <label className="block">
              <span className="block mb-2 text-sm font-medium text-zinc-300">Thumb Size</span>
              <select value={settings.thumbsize} onChange={(e) => update('thumbsize', e.target.value)} className="admin-select">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="big">Big</option>
              </select>
            </label>

            <label className="block">
              <span className="block mb-2 text-sm font-medium text-zinc-300">Gay Content</span>
              <select value={settings.gay} onChange={(e) => update('gay', Number(e.target.value))} className="admin-select">
                <option value={0}>Exclude</option>
                <option value={1}>Include</option>
                <option value={2}>Only</option>
              </select>
            </label>

            <label className="block">
              <span className="block mb-2 text-sm font-medium text-zinc-300">Low Quality</span>
              <select value={settings.lq} onChange={(e) => update('lq', Number(e.target.value))} className="admin-select">
                <option value={0}>Exclude</option>
                <option value={1}>Include</option>
                <option value={2}>Only</option>
              </select>
            </label>

            <label className="block">
              <span className="block mb-2 text-sm font-medium text-zinc-300">Format</span>
              <select value={settings.format} onChange={(e) => update('format', e.target.value)} className="admin-select">
                <option value="json">JSON</option>
                <option value="xml">XML</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-red-700 hover:bg-red-600 disabled:opacity-60 px-4 py-2.5 text-sm font-bold text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>

            {message && (
              <div className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm ${message.includes('successfully') ? 'border-green-900/60 bg-green-950/30 text-green-400' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}>
                {message.includes('successfully') && <CheckCircle2 className="w-4 h-4" />}
                {message}
              </div>
            )}
          </form>
        </div>
      </main>

      <style jsx>{`
        .admin-select {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(63 63 70);
          background: rgb(24 24 27);
          padding: 0.625rem 0.75rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
        }
        .admin-select:focus {
          border-color: rgb(239 68 68);
        }
      `}</style>
    </div>
  );
}
