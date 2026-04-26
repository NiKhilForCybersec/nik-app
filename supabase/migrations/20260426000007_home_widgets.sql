-- Nik — home widget canvas.
--
-- Each row is one widget on the user's Home screen. The renderer
-- (web/src/components/widgets/) maps `widget_type` → React component;
-- per-instance configuration lives in the JSONB `config` blob whose
-- shape is validated by the type's Zod schema in the contract layer.
--
-- Position is a flat integer; the grid auto-flows. Adding explicit
-- (col, row) coordinates can come later if drag-and-drop demands it.

set check_function_bodies = off;

create table if not exists public.home_widgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Widget type discriminator. Validated against an enum in the
  -- contract layer (web/src/contracts/widgets.ts → WidgetType).
  -- Stored as text so adding a new type is a one-line contract
  -- change without a Postgres migration.
  widget_type text not null check (length(widget_type) between 1 and 60),
  -- Display order (lower = earlier in the grid).
  position int not null default 0,
  -- Grid units. 1×1 = small square, 2×1 = wide, 1×2 = tall, 2×2 = hero.
  w int not null default 1 check (w between 1 and 2),
  h int not null default 1 check (h between 1 and 2),
  -- Per-instance configuration. Shape depends on widget_type.
  -- E.g. hydration_today: { showHistory?: boolean, goalOverride?: number }
  --      habit_ring:      { habitId: uuid }
  --      diary_today:     { showTags?: boolean }
  config jsonb not null default '{}'::jsonb,
  -- Soft-delete so undo / history is possible.
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists home_widgets_user_position_idx
  on public.home_widgets(user_id, position) where archived_at is null;

alter table public.home_widgets enable row level security;

drop policy if exists "widgets select own" on public.home_widgets;
drop policy if exists "widgets insert own" on public.home_widgets;
drop policy if exists "widgets update own" on public.home_widgets;
drop policy if exists "widgets delete own" on public.home_widgets;
create policy "widgets select own" on public.home_widgets for select using (user_id = auth.uid());
create policy "widgets insert own" on public.home_widgets for insert with check (user_id = auth.uid());
create policy "widgets update own" on public.home_widgets for update using (user_id = auth.uid());
create policy "widgets delete own" on public.home_widgets for delete using (user_id = auth.uid());

drop trigger if exists touch_home_widgets_updated_at on public.home_widgets;
create trigger touch_home_widgets_updated_at
  before update on public.home_widgets
  for each row execute function public.touch_updated_at();
