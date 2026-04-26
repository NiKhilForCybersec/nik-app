-- Nik — family circle.
-- One row per circle member that the user can see/share with. The
-- "owner" of the row is the signed-in user (RLS on user_id). The
-- `member_id` is a stable per-circle handle (e.g. 'meera', 'kiaan')
-- used by the privacy matrix and the view log.
--
-- Rich per-member data (health, meds, mood, schedule, diary) is kept
-- in a flexible JSONB `profile` for now so we can ship without
-- modelling every health domain. Promote fields out as they earn
-- their own dashboards.

set check_function_bodies = off;

create table if not exists public.circle_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Stable handle within this user's circle. Used by sharing / view-log
  -- / alerts. Lowercase, slug-ish.
  member_id text not null check (length(member_id) between 1 and 40),
  name text not null,
  -- "Partner", "Son · 8", "Mother", "You", etc.
  role text not null default '',
  -- Family relation enum-ish; free-form so the design is locale-neutral.
  relation text not null default 'family' check (
    relation in ('self','partner','child','parent','sibling','grandparent','caregiver','friend','family')
  ),
  age int check (age is null or age between 0 and 120),
  hue int not null default 220 check (hue between 0 and 360),
  -- True for the row representing the user themselves.
  is_self boolean not null default false,
  -- Realtime presence — updated by the client.
  status text not null default 'offline' check (status in ('online','away','offline')),
  location text,
  last_seen_at timestamptz,
  birthday text,
  blood_type text,
  -- Sharing tier the OWNER (this user) gives to this viewer when looking
  -- at the owner's data. Custom categories override via custom_cats.
  share_tier text not null default 'family' check (share_tier in ('inner','family','kid','caregiver','custom')),
  custom_cats text[] not null default array[]::text[],
  -- Rich denormalized profile: health/meds/mood/schedule/diary etc.
  -- See web/src/contracts/circle.ts for the canonical shape.
  profile jsonb not null default '{}'::jsonb,
  -- Member is a primary care recipient (gets surfaced first in alerts).
  care_recipient boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists circle_members_user_member_idx
  on public.circle_members(user_id, member_id);

alter table public.circle_members enable row level security;

drop policy if exists "circle select own" on public.circle_members;
drop policy if exists "circle insert own" on public.circle_members;
drop policy if exists "circle update own" on public.circle_members;
drop policy if exists "circle delete own" on public.circle_members;
create policy "circle select own" on public.circle_members for select using (user_id = auth.uid());
create policy "circle insert own" on public.circle_members for insert with check (user_id = auth.uid());
create policy "circle update own" on public.circle_members for update using (user_id = auth.uid());
create policy "circle delete own" on public.circle_members for delete using (user_id = auth.uid());

drop trigger if exists touch_circle_members_updated_at on public.circle_members;
create trigger touch_circle_members_updated_at
  before update on public.circle_members
  for each row execute function public.touch_updated_at();
