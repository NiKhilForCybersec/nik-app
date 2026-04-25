-- Nik — scheduled intents + long-term memory.
--
-- Two tables that make Nik a real assistant rather than a chat:
--
-- 1. `scheduled_intents` — "in 2 weeks remind me to X" → row here.
--    Worker scans fire_at <= now and triggers the action.
--
-- 2. `user_memories` — free-form things the AI should remember across
--    sessions ("I prefer mornings for hard work", "Mom's birthday is Jan 5").
--    Embedding column is a placeholder; we'll wire pgvector when we add
--    semantic search.

set check_function_bodies = off;

-- ── SCHEDULED INTENTS ─────────────────────────────────────
create table if not exists public.scheduled_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fire_at timestamptz not null,
  -- What kind of action to take when fire_at arrives.
  -- 'notify' = push notification with a message
  -- 'ai_ping' = let Nik AI proactively message the user
  -- 'create_dashboard' = AI created a new tile in More that activates now
  -- 'check_in' = ask the user how something went
  kind text not null check (kind in ('notify', 'ai_ping', 'create_dashboard', 'check_in', 'custom')),
  -- JSON payload — shape depends on kind.
  payload jsonb not null default '{}'::jsonb,
  -- Lifecycle.
  status text not null default 'pending'
    check (status in ('pending', 'fired', 'cancelled', 'failed')),
  fired_at timestamptz,
  failure_reason text,
  -- Provenance — who/what created this intent.
  created_by text not null default 'user' check (created_by in ('user', 'ai', 'integration', 'system')),
  source text,            -- e.g. "chat", "nik-mcp-gmail", "errand-triggered"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scheduled_intents_user_idx on public.scheduled_intents(user_id);
create index if not exists scheduled_intents_due_idx on public.scheduled_intents(fire_at) where status = 'pending';

-- ── USER MEMORIES ─────────────────────────────────────────
create table if not exists public.user_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 'preference' = how the user likes things ('prefers mornings for focus')
  -- 'fact' = stable info ('Mom lives in Pune', 'allergic to penicillin')
  -- 'goal' = aspiration ('learn tabla', 'ship Nik public beta')
  -- 'context' = recent context ('vacationing in Coorg this weekend')
  kind text not null check (kind in ('preference', 'fact', 'goal', 'context')),
  content text not null check (length(content) between 1 and 2000),
  -- Confidence the AI has in this memory (0-1). Lower confidence = ask user to confirm.
  confidence real not null default 1.0 check (confidence between 0 and 1),
  -- Source of the memory.
  source text,           -- e.g. "chat:msg_123", "nik-mcp-gmail:thread_x"
  -- For semantic search later. Null until we wire pgvector.
  embedding text,
  -- Soft-delete + edit lifecycle.
  superseded_by uuid references public.user_memories(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_memories_user_idx on public.user_memories(user_id) where archived_at is null;
create index if not exists user_memories_kind_idx on public.user_memories(user_id, kind) where archived_at is null;

-- ── RLS ───────────────────────────────────────────────────
alter table public.scheduled_intents enable row level security;
alter table public.user_memories     enable row level security;

drop policy if exists "intents select own" on public.scheduled_intents;
drop policy if exists "intents insert own" on public.scheduled_intents;
drop policy if exists "intents update own" on public.scheduled_intents;
drop policy if exists "intents delete own" on public.scheduled_intents;
create policy "intents select own" on public.scheduled_intents for select using (user_id = auth.uid());
create policy "intents insert own" on public.scheduled_intents for insert with check (user_id = auth.uid());
create policy "intents update own" on public.scheduled_intents for update using (user_id = auth.uid());
create policy "intents delete own" on public.scheduled_intents for delete using (user_id = auth.uid());

drop policy if exists "memories select own" on public.user_memories;
drop policy if exists "memories insert own" on public.user_memories;
drop policy if exists "memories update own" on public.user_memories;
drop policy if exists "memories delete own" on public.user_memories;
create policy "memories select own" on public.user_memories for select using (user_id = auth.uid());
create policy "memories insert own" on public.user_memories for insert with check (user_id = auth.uid());
create policy "memories update own" on public.user_memories for update using (user_id = auth.uid());
create policy "memories delete own" on public.user_memories for delete using (user_id = auth.uid());

-- ── intents_tick RPC ──────────────────────────────────────
-- The cron worker (Edge Function or pg_cron) calls this every minute.
-- Returns rows that just fired so the worker can dispatch their actions.
create or replace function public.intents_tick()
returns setof public.scheduled_intents
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.scheduled_intents;
begin
  for rec in
    update public.scheduled_intents
       set status = 'fired',
           fired_at = now(),
           updated_at = now()
     where status = 'pending'
       and fire_at <= now()
     returning *
  loop
    return next rec;
  end loop;
end;
$$;

-- Convenience: auto-bump updated_at on any update.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_intents_updated_at on public.scheduled_intents;
create trigger touch_intents_updated_at
  before update on public.scheduled_intents
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_memories_updated_at on public.user_memories;
create trigger touch_memories_updated_at
  before update on public.user_memories
  for each row execute function public.touch_updated_at();
