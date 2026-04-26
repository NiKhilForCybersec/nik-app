-- Nik — chat persistence.
-- One row per message in a conversation. Conversations are loose threads
-- — no separate threads table for now; the client filters by user + the
-- last N rows. Tool calls + tool results are persisted as JSONB so the
-- LLM can resume the exact context after a reload.

set check_function_bodies = off;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 'user' | 'assistant' | 'tool' (system prompts are ephemeral, not stored)
  role text not null check (role in ('user','assistant','tool')),
  content text not null default '',
  -- For assistant rows: the tool calls it decided to make.
  tool_calls jsonb not null default '[]'::jsonb,
  -- For tool rows: links back to the assistant turn's tool_call_id.
  tool_call_id text,
  -- Telemetry: which provider answered + latency (assistant rows only).
  provider text,
  model text,
  latency_ms int,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_recent_idx
  on public.chat_messages(user_id, created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "chat select own" on public.chat_messages;
drop policy if exists "chat insert own" on public.chat_messages;
drop policy if exists "chat delete own" on public.chat_messages;
create policy "chat select own" on public.chat_messages for select using (user_id = auth.uid());
create policy "chat insert own" on public.chat_messages for insert with check (user_id = auth.uid());
create policy "chat delete own" on public.chat_messages for delete using (user_id = auth.uid());
