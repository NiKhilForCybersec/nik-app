-- Nik — initial schema: profiles + habits.
-- The privacy matrix (family circle sharing) lives in later migrations
-- once we have a couple more tables. For now, RLS = "users see their own
-- rows only", enforced via auth.uid().

set check_function_bodies = off;

-- ── PROFILES ─────────────────────────────────────────────
-- One row per Supabase auth user. Mirrors what the app calls "user".
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Friend',
  title text not null default '',
  level int not null default 1,
  xp int not null default 0,
  xp_max int not null default 1000,
  streak int not null default 0,
  stats jsonb not null default '{"STR":10,"INT":10,"DEX":10,"VIT":10,"FOC":10}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── HABITS ───────────────────────────────────────────────
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  target int not null check (target > 0),
  done int not null default 0 check (done >= 0),
  unit text not null check (length(unit) between 1 and 40),
  icon text not null default 'sparkle',
  hue int not null default 220 check (hue between 0 and 360),
  streak int not null default 0,
  source text not null default 'manual',
  auto boolean not null default false,
  -- last_done_at lets us reset `done` to 0 when the local day rolls over.
  last_done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists habits_user_id_idx on public.habits(user_id);

-- ── habit_bump RPC ───────────────────────────────────────
-- Atomically increments done, updates streak if newly completed,
-- sets last_done_at. Returns the updated habit row.
create or replace function public.habit_bump(habit_id uuid, amount int default 1)
returns public.habits
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.habits;
  was_complete boolean;
  is_now_complete boolean;
begin
  select * into h from public.habits where id = habit_id;
  if not found then
    raise exception 'habit not found: %', habit_id;
  end if;
  if h.user_id <> auth.uid() then
    raise exception 'forbidden: not your habit';
  end if;

  was_complete := h.done >= h.target;
  update public.habits
     set done = least(h.done + amount, h.target * 2),  -- cap at 2x target
         last_done_at = now(),
         updated_at = now(),
         streak = case
           -- Newly completing today + had it done yesterday → +1 streak
           when not was_complete
                and (h.done + amount) >= h.target
                and (h.last_done_at is null or h.last_done_at < (now() - interval '12 hours'))
             then h.streak + 1
           else h.streak
         end
   where id = habit_id
   returning * into h;

  return h;
end;
$$;

-- ── RLS ──────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.habits enable row level security;

-- Profiles: read own, update own. Insert handled by the auth trigger below.
drop policy if exists "profiles read own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles update own" on public.profiles
  for update using (id = auth.uid());

-- Habits: full CRUD on own rows.
drop policy if exists "habits select own" on public.habits;
drop policy if exists "habits insert own" on public.habits;
drop policy if exists "habits update own" on public.habits;
drop policy if exists "habits delete own" on public.habits;
create policy "habits select own" on public.habits
  for select using (user_id = auth.uid());
create policy "habits insert own" on public.habits
  for insert with check (user_id = auth.uid());
create policy "habits update own" on public.habits
  for update using (user_id = auth.uid());
create policy "habits delete own" on public.habits
  for delete using (user_id = auth.uid());

-- ── Auto-create profile on signup ────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Friend'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
