-- Nik — extend profiles + add quests.
--
-- profiles already exists (created in 20260425000001 with PK `id` and an
-- on-signup trigger). This migration adds the richer "About me" columns
-- the Profile screen needs, and creates the quests table.

set check_function_bodies = off;

-- ── PROFILES (extend) ────────────────────────────────────
alter table public.profiles
  add column if not exists age int check (age is null or age between 1 and 120),
  add column if not exists height_cm int check (height_cm is null or height_cm between 30 and 300),
  add column if not exists weight_kg int check (weight_kg is null or weight_kg between 1 and 500),
  add column if not exists goal text,
  add column if not exists persona text not null default 'Direct · witty',
  add column if not exists voice text not null default 'Default',
  add column if not exists joined_at timestamptz not null default now();

-- The profile is auto-inserted by handle_new_user(); allow the client
-- to insert too (idempotent seed path).
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (id = auth.uid());


-- ── QUESTS ───────────────────────────────────────────────
create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  -- S = legendary, A = epic, B = standard, C = minor, D = chore.
  rank text not null check (rank in ('S','A','B','C','D')),
  xp int not null default 0 check (xp >= 0),
  status text not null check (status in ('active','done','pending','dismissed')) default 'active',
  -- 0..1, optional. Null when status is binary (pending/done).
  progress real check (progress is null or (progress >= 0 and progress <= 1)),
  auto bool not null default false,
  -- Free-form source label, e.g. "GPS · Cult Fit", "Calendar".
  trigger text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists quests_user_status_idx
  on public.quests(user_id, status, created_at desc);

alter table public.quests enable row level security;

drop policy if exists "quests select own" on public.quests;
drop policy if exists "quests insert own" on public.quests;
drop policy if exists "quests update own" on public.quests;
drop policy if exists "quests delete own" on public.quests;
create policy "quests select own" on public.quests for select using (user_id = auth.uid());
create policy "quests insert own" on public.quests for insert with check (user_id = auth.uid());
create policy "quests update own" on public.quests for update using (user_id = auth.uid());
create policy "quests delete own" on public.quests for delete using (user_id = auth.uid());
