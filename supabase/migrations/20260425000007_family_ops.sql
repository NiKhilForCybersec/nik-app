-- Nik — Family Ops: shared family tasks + alarm clusters.
--
-- Two tables (plus optional third for kids/parents profiles, deferred to
-- when we wire the full family circle data):
--   family_tasks     — assignable, recurrence-aware, GPS-bindable
--   family_alarms    — grouped alarms ("morning routine", "school run")
--                      with per-kid times.

set check_function_bodies = off;

-- ── FAMILY TASKS ────────────────────────────────────────
create table if not exists public.family_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  -- ISO time-of-day (HH:MM) — recurring tasks pin to a clock time.
  -- One-shots use due_at instead.
  time_of_day text,
  due_at timestamptz,
  -- Owner is one of the parent identifiers (free string for now).
  owner text,
  paired_with text,                -- the other parent if "BOTH"
  -- Free-form list of kid identifiers this task involves.
  kids text[] not null default array[]::text[],
  -- Recurrence rule: 'none' | 'weekday' | 'tue-thu' | 'monthly_nth' | 'custom'.
  recurrence text not null default 'none',
  recurrence_payload jsonb not null default '{}'::jsonb,
  -- GPS geofence destination.
  geofence_lat real,
  geofence_lng real,
  geofence_label text,
  status text not null default 'pending'
    check (status in ('pending', 'done', 'snoozed', 'cancelled')),
  -- Provenance: who/what created it.
  created_by text not null default 'user' check (created_by in ('user','ai','voice','integration','system')),
  source text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists family_tasks_user_pending_idx
  on public.family_tasks(user_id) where status = 'pending' and archived_at is null;

-- ── FAMILY ALARMS ──────────────────────────────────────
create table if not exists public.family_alarms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cluster_name text not null,        -- e.g. "School morning"
  -- Days of week the cluster is active. 0=Sunday, 6=Saturday.
  active_days int[] not null default array[1,2,3,4,5]::int[],
  -- Per-kid alarms inside the cluster.
  -- [{ kid: 'Anya', time: '06:30', label: 'wake' }, ...]
  alarms jsonb not null default '[]'::jsonb,
  -- Voice phrase that set this up (if user spoke it).
  voice_phrase text,
  master_enabled boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists family_alarms_user_idx
  on public.family_alarms(user_id) where archived_at is null;

-- ── RLS ─────────────────────────────────────────────────
alter table public.family_tasks  enable row level security;
alter table public.family_alarms enable row level security;

drop policy if exists "family_tasks select own" on public.family_tasks;
drop policy if exists "family_tasks insert own" on public.family_tasks;
drop policy if exists "family_tasks update own" on public.family_tasks;
drop policy if exists "family_tasks delete own" on public.family_tasks;
create policy "family_tasks select own" on public.family_tasks for select using (user_id = auth.uid());
create policy "family_tasks insert own" on public.family_tasks for insert with check (user_id = auth.uid());
create policy "family_tasks update own" on public.family_tasks for update using (user_id = auth.uid());
create policy "family_tasks delete own" on public.family_tasks for delete using (user_id = auth.uid());

drop policy if exists "family_alarms select own" on public.family_alarms;
drop policy if exists "family_alarms insert own" on public.family_alarms;
drop policy if exists "family_alarms update own" on public.family_alarms;
drop policy if exists "family_alarms delete own" on public.family_alarms;
create policy "family_alarms select own" on public.family_alarms for select using (user_id = auth.uid());
create policy "family_alarms insert own" on public.family_alarms for insert with check (user_id = auth.uid());
create policy "family_alarms update own" on public.family_alarms for update using (user_id = auth.uid());
create policy "family_alarms delete own" on public.family_alarms for delete using (user_id = auth.uid());

drop trigger if exists touch_family_tasks_updated_at on public.family_tasks;
create trigger touch_family_tasks_updated_at
  before update on public.family_tasks
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_family_alarms_updated_at on public.family_alarms;
create trigger touch_family_alarms_updated_at
  before update on public.family_alarms
  for each row execute function public.touch_updated_at();
