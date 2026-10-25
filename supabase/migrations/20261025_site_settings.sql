create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Only server-side service-role requests can read/write settings.
-- No anon/authenticated policies are intentionally created.
