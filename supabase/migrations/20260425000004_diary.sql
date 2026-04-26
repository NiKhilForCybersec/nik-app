-- Nik — diary entries.
--
-- One row per entry. Free-form text + optional metadata + AI-extracted
-- mood/tags. Photos + voice notes are referenced by URL (Supabase
-- Storage bucket setup in a later migration).

set check_function_bodies = off;

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,                                  -- short headline
  body text not null check (length(body) between 1 and 50000),
  -- Time the user wrote about (not necessarily when written).
  occurred_at timestamptz not null default now(),
  -- 1-5, 1=worst, 5=best, null=unset.
  mood int check (mood between 1 and 5),
  -- AI- or user-tagged moods/themes. Free-form short strings.
  tags text[] not null default array[]::text[],
  -- Free text, e.g. "Bandra · Cafe Zoe", "home", "in-flight".
  location text,
  -- Optional links (photo URLs, voice note URLs in storage).
  photo_urls text[] not null default array[]::text[],
  voice_url text,
  voice_seconds int check (voice_seconds is null or voice_seconds > 0),
  -- Score delta this entry contributed (0 = no change).
  score_delta int not null default 0,
  -- Pillar this entry maps to (focus|health|mind|family).
  pillar text check (pillar in ('focus','health','mind','family')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists diary_user_recent_idx
  on public.diary_entries(user_id, occurred_at desc) where archived_at is null;

alter table public.diary_entries enable row level security;

drop policy if exists "diary select own" on public.diary_entries;
drop policy if exists "diary insert own" on public.diary_entries;
drop policy if exists "diary update own" on public.diary_entries;
drop policy if exists "diary delete own" on public.diary_entries;
create policy "diary select own" on public.diary_entries for select using (user_id = auth.uid());
create policy "diary insert own" on public.diary_entries for insert with check (user_id = auth.uid());
create policy "diary update own" on public.diary_entries for update using (user_id = auth.uid());
create policy "diary delete own" on public.diary_entries for delete using (user_id = auth.uid());

drop trigger if exists touch_diary_updated_at on public.diary_entries;
create trigger touch_diary_updated_at
  before update on public.diary_entries
  for each row execute function public.touch_updated_at();
