-- Nik — hydration intake log.
--
-- One row per intake event (a glass, a bottle, a sip). Daily totals
-- are computed at read time from this ledger. Source tags let the
-- screen distinguish manual taps from device-synced events (Apple
-- Health, smart bottles, etc.) when those land later.

set check_function_bodies = off;

create table if not exists public.hydration_intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Volume in millilitres. Glass ≈ 240, cup ≈ 240, bottle ≈ 500, large ≈ 1000.
  ml int not null check (ml > 0 and ml <= 5000),
  occurred_at timestamptz not null default now(),
  source text not null default 'manual' check (length(source) between 1 and 40),
  -- Free-form short note, e.g. "after run", "with meds".
  note text check (note is null or length(note) <= 200),
  created_at timestamptz not null default now()
);

create index if not exists hydration_user_recent_idx
  on public.hydration_intakes(user_id, occurred_at desc);

alter table public.hydration_intakes enable row level security;

drop policy if exists "hydration select own" on public.hydration_intakes;
drop policy if exists "hydration insert own" on public.hydration_intakes;
drop policy if exists "hydration delete own" on public.hydration_intakes;
create policy "hydration select own" on public.hydration_intakes for select using (user_id = auth.uid());
create policy "hydration insert own" on public.hydration_intakes for insert with check (user_id = auth.uid());
create policy "hydration delete own" on public.hydration_intakes for delete using (user_id = auth.uid());
