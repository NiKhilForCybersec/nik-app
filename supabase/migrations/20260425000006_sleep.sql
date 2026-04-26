-- Nik — sleep nights.
--
-- One row per night. Stages stored as JSONB so we can swap between
-- 4-stage (light/deep/rem/awake) and richer hypnograms without schema
-- churn. Dreams are nullable; many nights have none.

set check_function_bodies = off;

create table if not exists public.sleep_nights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Local date the night belongs to (the morning the user woke up).
  night_date date not null,
  -- Time the user actually went to sleep + woke up.
  asleep_at timestamptz,
  woke_at timestamptz,
  -- Total minutes asleep (excluding wakefulness).
  duration_min int check (duration_min is null or duration_min between 0 and 1200),
  -- 0..100 holistic score (subjective + sensor-driven).
  score int check (score is null or score between 0 and 100),
  -- Hypnogram + stage minutes. Example shape:
  -- { "stages": ["awake","light","deep","rem", ...], "minutes": {"light": 240, "deep": 90, "rem": 80, "awake": 12} }
  stages jsonb not null default '{}'::jsonb,
  -- Dreams the user logged (free-form). Each: { text, mood, tags? }.
  dreams jsonb not null default '[]'::jsonb,
  -- Heart-rate variability if Health Kit / Health Connect provides it.
  hrv_ms int,
  resting_hr int,
  -- Wind-down ritual completion (0..1).
  wind_down_complete real check (wind_down_complete is null or wind_down_complete between 0 and 1),
  -- Provenance.
  source text not null default 'manual'
    check (source in ('manual', 'apple-health', 'google-health', 'oura', 'whoop', 'eight-sleep')),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, night_date)
);

create index if not exists sleep_user_recent_idx
  on public.sleep_nights(user_id, night_date desc) where archived_at is null;

alter table public.sleep_nights enable row level security;

drop policy if exists "sleep select own" on public.sleep_nights;
drop policy if exists "sleep insert own" on public.sleep_nights;
drop policy if exists "sleep update own" on public.sleep_nights;
drop policy if exists "sleep delete own" on public.sleep_nights;
create policy "sleep select own" on public.sleep_nights for select using (user_id = auth.uid());
create policy "sleep insert own" on public.sleep_nights for insert with check (user_id = auth.uid());
create policy "sleep update own" on public.sleep_nights for update using (user_id = auth.uid());
create policy "sleep delete own" on public.sleep_nights for delete using (user_id = auth.uid());

drop trigger if exists touch_sleep_updated_at on public.sleep_nights;
create trigger touch_sleep_updated_at
  before update on public.sleep_nights
  for each row execute function public.touch_updated_at();
