-- Cinevero large-catalog archive infrastructure.
-- The database objects are intentionally idempotent because the production
-- database can be provisioned before the repository migration history is synced.

alter table public.titles
  add column if not exists indexable boolean not null default false,
  add column if not exists quality_score smallint not null default 0,
  add column if not exists quality_state text not null default 'pending',
  add column if not exists quality_checked_at timestamptz,
  add column if not exists quality_error text,
  add column if not exists quality_attempts integer not null default 0,
  add column if not exists quality_next_attempt_at timestamptz,
  add column if not exists content_hash text,
  add column if not exists discovered_at timestamptz not null default now(),
  add column if not exists last_discovered_at timestamptz,
  add column if not exists last_content_change_at timestamptz,
  add column if not exists discovery_source text,
  add column if not exists is_anime boolean not null default false;

alter table public.titles
  drop constraint if exists titles_quality_state_check;

alter table public.titles
  add constraint titles_quality_state_check
  check (quality_state in ('pending','ready','error','removed'));

alter table public.titles
  drop constraint if exists titles_slug_key;

drop index if exists titles_slug_key;

create unique index if not exists titles_tmdb_media_type_uidx
  on public.titles (tmdb_id, media_type);

create unique index if not exists titles_media_slug_uidx
  on public.titles (media_type, slug);

create index if not exists titles_indexable_catalog_idx
  on public.titles (media_type, id)
  where indexable = true and is_anime = false;

create index if not exists titles_anime_indexable_idx
  on public.titles (id)
  where indexable = true and is_anime = true;

create index if not exists titles_quality_queue_idx
  on public.titles (quality_state, popularity desc nulls last, updated_at asc);

create table if not exists public.catalog_sync_shards (
  id uuid primary key default gen_random_uuid(),
  shard_key text not null unique,
  media_type text not null check (media_type in ('movie','tv')),
  shard_kind text not null check (shard_kind in ('year','month','language_month','genre_language_month','vote_bucket','anime_year','anime_month','anime_language_month')),
  filters jsonb not null default '{}'::jsonb,
  next_page integer not null default 1 check (next_page >= 1),
  completed boolean not null default false,
  priority smallint not null default 50,
  pages_fetched integer not null default 0,
  items_seen bigint not null default 0,
  last_run_at timestamptz,
  last_error text,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalog_sync_shards_ready_idx
  on public.catalog_sync_shards (completed, priority desc, last_run_at asc nulls first);

alter table public.catalog_sync_shards enable row level security;

insert into public.catalog_sync_shards (shard_key, media_type, shard_kind, filters, priority)
select concat('movie:year:', y), 'movie', 'year',
       jsonb_build_object('primary_release_year', y, 'sort_by', 'popularity.desc'), 80
from generate_series(1870, 2035) as y
on conflict (shard_key) do nothing;

insert into public.catalog_sync_shards (shard_key, media_type, shard_kind, filters, priority)
select concat('tv:year:', y), 'tv', 'year',
       jsonb_build_object('first_air_date_year', y, 'sort_by', 'popularity.desc'), 80
from generate_series(1870, 2035) as y
on conflict (shard_key) do nothing;

insert into public.catalog_sync_shards (shard_key, media_type, shard_kind, filters, priority)
select concat('movie:anime_year:', y), 'movie', 'anime_year',
       jsonb_build_object('primary_release_year', y, 'sort_by', 'popularity.desc', 'with_genres', '16', 'with_original_language', 'ja'), 90
from generate_series(1870, 2035) as y
on conflict (shard_key) do nothing;

insert into public.catalog_sync_shards (shard_key, media_type, shard_kind, filters, priority)
select concat('tv:anime_year:', y), 'tv', 'anime_year',
       jsonb_build_object('first_air_date_year', y, 'sort_by', 'popularity.desc', 'with_genres', '16', 'with_original_language', 'ja'), 90
from generate_series(1870, 2035) as y
on conflict (shard_key) do nothing;
