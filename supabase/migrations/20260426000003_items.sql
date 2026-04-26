-- Nik — generic items.
-- A single table that backs every "named entry with metadata" feature
-- in the More tab roadmap: reading list, shopping list, recipes,
-- plants, wardrobe, travel, bucket list, photos, birthdays, friends,
-- pets, subscriptions, bills, receipts, investments, achievements,
-- goals, career, side projects, network contacts, care team,
-- reflection.
--
-- Discriminated by `kind`. Domain-specific fields live in the JSONB
-- `meta` blob until any one kind earns its own dedicated table.

set check_function_bodies = off;

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Domain key. Validated at the contract layer (Zod enum) so any new
  -- kind is one Zod value + one screen away. The DB stores it as text
  -- so we don't have to migrate Postgres for every new kind.
  kind text not null check (length(kind) between 1 and 40),
  title text not null check (length(title) between 1 and 200),
  body text,
  -- Free-form per-kind metadata: { author, isbn, currentPage } for
  -- reading; { quantity, store } for shopping; { date, location } for
  -- travel; etc.
  meta jsonb not null default '{}'::jsonb,
  -- Status lifecycle. Most kinds use 'active'/'done'; some use
  -- 'archived' or 'wishlist'. Free-form on purpose.
  status text not null default 'active' check (length(status) between 1 and 40),
  -- For ordered lists / wishlists / sprints. Lower = higher priority.
  position int not null default 0,
  -- Tags surface in search + filter; not used for permissions.
  tags text[] not null default array[]::text[],
  -- Optional date the item is anchored to (birthday, due date, trip start).
  occurs_at timestamptz,
  -- Reminder hook — when set, intents-tick can surface this item.
  remind_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists items_user_kind_idx
  on public.items(user_id, kind, position) where archived_at is null;
create index if not exists items_user_remind_idx
  on public.items(user_id, remind_at) where remind_at is not null and archived_at is null;
create index if not exists items_user_occurs_idx
  on public.items(user_id, occurs_at) where occurs_at is not null and archived_at is null;

alter table public.items enable row level security;

drop policy if exists "items select own" on public.items;
drop policy if exists "items insert own" on public.items;
drop policy if exists "items update own" on public.items;
drop policy if exists "items delete own" on public.items;
create policy "items select own" on public.items for select using (user_id = auth.uid());
create policy "items insert own" on public.items for insert with check (user_id = auth.uid());
create policy "items update own" on public.items for update using (user_id = auth.uid());
create policy "items delete own" on public.items for delete using (user_id = auth.uid());

drop trigger if exists touch_items_updated_at on public.items;
create trigger touch_items_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();
