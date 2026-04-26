-- Nik — menstrual cycle tracking.
--
-- Append-only event ledger. The current phase + cycle day are computed
-- on read from the most recent period_start. Symptoms / moods / notes
-- are free-form per-day rows tied to the same ledger so trend
-- analysis stays simple.
--
-- Privacy-sensitive — RLS scoped to user_id only, never exposed via
-- circle sharing without explicit per-category consent (handled at
-- the application layer via canCircleView).

set check_function_bodies = off;

create table if not exists public.cycle_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Calendar date the event happened on (not the timestamp it was logged).
  occurred_on date not null default current_date,
  -- 'period_start' / 'period_end' / 'symptom' / 'mood' / 'note'
  kind text not null check (kind in ('period_start','period_end','symptom','mood','note')),
  -- Free-form per-kind payload:
  --   symptom → { symptom: 'cramps' | 'headache' | ..., severity?: 1-5 }
  --   mood    → { mood: 'low' | 'neutral' | 'high', label?: string }
  --   note    → { text: string }
  --   period_* → optional flow level: { flow?: 'spotting'|'light'|'medium'|'heavy' }
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cycle_events_user_recent_idx
  on public.cycle_events(user_id, occurred_on desc);

alter table public.cycle_events enable row level security;

drop policy if exists "cycle select own" on public.cycle_events;
drop policy if exists "cycle insert own" on public.cycle_events;
drop policy if exists "cycle delete own" on public.cycle_events;
create policy "cycle select own" on public.cycle_events for select using (user_id = auth.uid());
create policy "cycle insert own" on public.cycle_events for insert with check (user_id = auth.uid());
create policy "cycle delete own" on public.cycle_events for delete using (user_id = auth.uid());
