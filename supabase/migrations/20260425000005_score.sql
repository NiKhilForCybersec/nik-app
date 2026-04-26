-- Nik — Nik Score state + event ledger.
--
-- Two tables:
--   user_scores  — current snapshot per user (one row each)
--   score_events — append-only ledger of every contribution
--
-- A trigger on score_events keeps user_scores up to date so the
-- frontend can read the snapshot in O(1).

set check_function_bodies = off;

-- ── USER SCORES (snapshot) ────────────────────────────────
create table if not exists public.user_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total int not null default 0,
  delta_7d int not null default 0,
  rank text not null default 'Recruit',
  next_rank text,
  next_rank_at int,
  pillars jsonb not null default
    '{"focus":{"value":0,"max":300,"weeklyGoal":240,"trend":[0,0,0,0,0,0,0]},
      "health":{"value":0,"max":250,"weeklyGoal":220,"trend":[0,0,0,0,0,0,0]},
      "mind":{"value":0,"max":250,"weeklyGoal":200,"trend":[0,0,0,0,0,0,0]},
      "family":{"value":0,"max":200,"weeklyGoal":170,"trend":[0,0,0,0,0,0,0]}}'::jsonb,
  today_contribution int not null default 0,
  updated_at timestamptz not null default now()
);

-- ── SCORE EVENTS (ledger) ─────────────────────────────────
create table if not exists public.score_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  delta int not null,
  source text not null,        -- "Focus 50min · Spec writing", "B12 + Multivitamin"
  pillar text not null check (pillar in ('focus','health','mind','family')),
  ref_kind text,               -- 'habit' / 'focus_session' / 'diary_entry' / 'meds_log' / etc
  ref_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists score_events_user_recent_idx
  on public.score_events(user_id, occurred_at desc);

-- ── BACKLOG (missed tasks accumulating gentle nudges) ─────
create table if not exists public.score_backlog (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  missed_label text not null,    -- "Yesterday", "2 days ago", "Sunday"
  cost int not null default 0,   -- score impact (often negative or 0)
  makeup text,                   -- "Call mom today (+5)"
  pillar text not null check (pillar in ('focus','health','mind','family')),
  dismissable boolean not null default true,
  gentle boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists score_backlog_user_open_idx
  on public.score_backlog(user_id) where resolved_at is null;

-- ── RLS ──────────────────────────────────────────────────
alter table public.user_scores  enable row level security;
alter table public.score_events enable row level security;
alter table public.score_backlog enable row level security;

drop policy if exists "user_scores select own"  on public.user_scores;
drop policy if exists "user_scores update own"  on public.user_scores;
drop policy if exists "user_scores insert own"  on public.user_scores;
create policy "user_scores select own" on public.user_scores for select using (user_id = auth.uid());
create policy "user_scores update own" on public.user_scores for update using (user_id = auth.uid());
create policy "user_scores insert own" on public.user_scores for insert with check (user_id = auth.uid());

drop policy if exists "score_events select own" on public.score_events;
drop policy if exists "score_events insert own" on public.score_events;
create policy "score_events select own" on public.score_events for select using (user_id = auth.uid());
create policy "score_events insert own" on public.score_events for insert with check (user_id = auth.uid());

drop policy if exists "score_backlog select own" on public.score_backlog;
drop policy if exists "score_backlog insert own" on public.score_backlog;
drop policy if exists "score_backlog update own" on public.score_backlog;
drop policy if exists "score_backlog delete own" on public.score_backlog;
create policy "score_backlog select own" on public.score_backlog for select using (user_id = auth.uid());
create policy "score_backlog insert own" on public.score_backlog for insert with check (user_id = auth.uid());
create policy "score_backlog update own" on public.score_backlog for update using (user_id = auth.uid());
create policy "score_backlog delete own" on public.score_backlog for delete using (user_id = auth.uid());
