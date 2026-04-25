-- Nik — events + integrations.
--
-- The plumbing every external integration (Gmail, Calendar, WhatsApp,
-- HealthKit, etc.) feeds into. One generic events table; per-integration
-- MCP servers normalize their signals into this shape and POST in.
--
-- This decouples "screens that show things" from "where the data came
-- from" — Brief and Vault read from events; the source could be Gmail
-- today, a manual entry tomorrow, or a future iMessage MCP.

set check_function_bodies = off;

-- ── INTEGRATIONS ─────────────────────────────────────────
-- Tracks which external services a user has connected.
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  -- Per-provider identifier (gmail account email, calendar id, etc.)
  external_id text,
  status text not null default 'connected'
    check (status in ('connected', 'disconnected', 'error', 'pending')),
  -- OAuth/credential blob (encrypted at app layer; Supabase column-level
  -- encryption is opt-in we'll wire when we add real OAuth).
  credentials_enc bytea,
  -- Per-provider scopes the user granted.
  scopes text[] default array[]::text[],
  -- Last successful sync.
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

create index if not exists integrations_user_idx on public.integrations(user_id);

-- ── EVENTS ───────────────────────────────────────────────
-- Generic feed row. Every ingested signal lands here.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Discriminator. Each MCP server uses its own kind namespace.
  -- e.g. 'movie_ticket', 'calendar_event', 'gmail_thread', 'flight_booking'
  kind text not null check (length(kind) between 1 and 80),
  -- One-line title surfaced in lists.
  title text not null check (length(title) between 1 and 200),
  -- Optional body / preview text.
  body text,
  -- When the event happens (or happened). Null for things without a time.
  occurs_at timestamptz,
  -- Where the event happens. Free-form, optional.
  location text,
  -- Per-kind structured payload (booking ref, attendees, sender, etc.)
  payload jsonb not null default '{}'::jsonb,
  -- Provenance.
  source_provider text,        -- 'gmail', 'calendar', 'whatsapp', 'manual'
  source_ref text,             -- e.g. gmail message id, calendar event id
  source_url text,             -- deep link back to the original
  integration_id uuid references public.integrations(id) on delete set null,
  -- Lifecycle for the user.
  read boolean not null default false,
  pinned boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_user_recent_idx on public.events(user_id, occurs_at desc) where archived_at is null;
create index if not exists events_user_kind_idx on public.events(user_id, kind) where archived_at is null;
create unique index if not exists events_dedup_idx on public.events(user_id, source_provider, source_ref) where source_provider is not null and source_ref is not null;

-- ── RLS ──────────────────────────────────────────────────
alter table public.integrations enable row level security;
alter table public.events       enable row level security;

drop policy if exists "integrations select own" on public.integrations;
drop policy if exists "integrations insert own" on public.integrations;
drop policy if exists "integrations update own" on public.integrations;
drop policy if exists "integrations delete own" on public.integrations;
create policy "integrations select own" on public.integrations for select using (user_id = auth.uid());
create policy "integrations insert own" on public.integrations for insert with check (user_id = auth.uid());
create policy "integrations update own" on public.integrations for update using (user_id = auth.uid());
create policy "integrations delete own" on public.integrations for delete using (user_id = auth.uid());

drop policy if exists "events select own" on public.events;
drop policy if exists "events insert own" on public.events;
drop policy if exists "events update own" on public.events;
drop policy if exists "events delete own" on public.events;
create policy "events select own" on public.events for select using (user_id = auth.uid());
create policy "events insert own" on public.events for insert with check (user_id = auth.uid());
create policy "events update own" on public.events for update using (user_id = auth.uid());
create policy "events delete own" on public.events for delete using (user_id = auth.uid());

drop trigger if exists touch_integrations_updated_at on public.integrations;
create trigger touch_integrations_updated_at
  before update on public.integrations
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_events_updated_at on public.events;
create trigger touch_events_updated_at
  before update on public.events
  for each row execute function public.touch_updated_at();
