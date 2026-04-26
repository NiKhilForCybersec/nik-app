-- Nik — score recompute + auto-source from activity.
--
-- Until now user_scores stayed at zero unless something explicitly
-- updated it. This migration:
--   1. Adds recompute_user_score(uid) that aggregates score_events
--      → total, pillars{value,trend}, delta_7d, today_contribution,
--      plus a derived rank.
--   2. Trigger on score_events that fires recompute on every insert.
--   3. Bridge triggers on real activity tables so logging hydration /
--      sleep / habit bump / diary entries auto-creates a score_event.
--
-- After this migration, the Score widget on Home animates as the user
-- actually does things — no Edge Function cron required for v1.

set check_function_bodies = off;

-- ── recompute_user_score ────────────────────────────────────

create or replace function public.recompute_user_score(uid uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_today int;
  v_delta_7d int;
  v_focus int;
  v_health int;
  v_mind int;
  v_family int;
  v_focus_trend jsonb;
  v_health_trend jsonb;
  v_mind_trend jsonb;
  v_family_trend jsonb;
  v_rank text;
  v_next_rank text;
  v_next_at int;
begin
  select coalesce(sum(delta), 0) into v_total
    from score_events where user_id = uid;

  select coalesce(sum(delta) filter (where occurred_at::date = current_date), 0) into v_today
    from score_events where user_id = uid;

  select coalesce(sum(delta) filter (where occurred_at >= now() - interval '7 days'), 0)
       - coalesce(sum(delta) filter (where occurred_at < now() - interval '7 days' and occurred_at >= now() - interval '14 days'), 0)
    into v_delta_7d
    from score_events where user_id = uid;

  -- per-pillar totals
  select coalesce(sum(delta) filter (where pillar = 'focus'),  0),
         coalesce(sum(delta) filter (where pillar = 'health'), 0),
         coalesce(sum(delta) filter (where pillar = 'mind'),   0),
         coalesce(sum(delta) filter (where pillar = 'family'), 0)
    into v_focus, v_health, v_mind, v_family
    from score_events where user_id = uid;

  -- Trend = sum per day for last 7 days, oldest → newest
  with days as (
    select generate_series(0, 6) as offset_d
  ),
  daily as (
    select offset_d,
      coalesce(sum(delta) filter (where pillar = 'focus'),  0) as f,
      coalesce(sum(delta) filter (where pillar = 'health'), 0) as h,
      coalesce(sum(delta) filter (where pillar = 'mind'),   0) as m,
      coalesce(sum(delta) filter (where pillar = 'family'), 0) as fa
    from days
    left join score_events on user_id = uid
      and occurred_at::date = current_date - offset_d
    group by offset_d
  )
  select
    jsonb_agg(f  order by offset_d desc),
    jsonb_agg(h  order by offset_d desc),
    jsonb_agg(m  order by offset_d desc),
    jsonb_agg(fa order by offset_d desc)
  into v_focus_trend, v_health_trend, v_mind_trend, v_family_trend
  from daily;

  -- Rank ladder.
  if    v_total >= 5000 then v_rank := 'Apex';       v_next_rank := null;          v_next_at := null;
  elsif v_total >= 2000 then v_rank := 'Operative I'; v_next_rank := 'Apex';        v_next_at := 5000;
  elsif v_total >= 800  then v_rank := 'Operative II'; v_next_rank := 'Operative I';v_next_at := 2000;
  elsif v_total >= 200  then v_rank := 'Recruit';     v_next_rank := 'Operative II';v_next_at := 800;
  else                       v_rank := 'Newcomer';    v_next_rank := 'Recruit';     v_next_at := 200;
  end if;

  insert into user_scores (user_id, total, delta_7d, rank, next_rank, next_rank_at, pillars, today_contribution, updated_at)
  values (
    uid, v_total, v_delta_7d, v_rank, v_next_rank, v_next_at,
    jsonb_build_object(
      'focus',  jsonb_build_object('value', v_focus,  'max', 300, 'weeklyGoal', 240, 'trend', v_focus_trend),
      'health', jsonb_build_object('value', v_health, 'max', 250, 'weeklyGoal', 220, 'trend', v_health_trend),
      'mind',   jsonb_build_object('value', v_mind,   'max', 250, 'weeklyGoal', 200, 'trend', v_mind_trend),
      'family', jsonb_build_object('value', v_family, 'max', 200, 'weeklyGoal', 170, 'trend', v_family_trend)
    ),
    v_today, now()
  )
  on conflict (user_id) do update set
    total = excluded.total,
    delta_7d = excluded.delta_7d,
    rank = excluded.rank,
    next_rank = excluded.next_rank,
    next_rank_at = excluded.next_rank_at,
    pillars = excluded.pillars,
    today_contribution = excluded.today_contribution,
    updated_at = excluded.updated_at;
end $$;

-- ── Trigger: recompute on every score_event change ─────────

create or replace function public.score_event_recompute() returns trigger
language plpgsql
as $$
begin
  perform recompute_user_score(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end $$;

drop trigger if exists score_events_recompute on public.score_events;
create trigger score_events_recompute
  after insert or update or delete on public.score_events
  for each row execute function public.score_event_recompute();

-- ── Bridge triggers: real activity → score_events ─────────
--
-- Each bridge inserts a single score_event with a sensible delta.
-- The downstream recompute trigger picks it up and updates the
-- snapshot. All idempotent on (ref_kind, ref_id) — re-firing a
-- trigger on the same source row won't double-count.

create unique index if not exists score_events_dedupe
  on public.score_events (user_id, ref_kind, ref_id)
  where ref_id is not null;

-- Hydration intake → +2 health per intake (capped by hydration's own
-- daily-cap rule on the habit side).
create or replace function public.score_from_hydration_intake() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into score_events (user_id, occurred_at, delta, source, pillar, ref_kind, ref_id)
  values (new.user_id, new.occurred_at, 2, 'Hydration intake', 'health', 'hydration_intake', new.id)
  on conflict (user_id, ref_kind, ref_id) where ref_id is not null do nothing;
  return new;
end $$;

drop trigger if exists score_on_hydration_intake on public.hydration_intakes;
create trigger score_on_hydration_intake
  after insert on public.hydration_intakes
  for each row execute function public.score_from_hydration_intake();

-- Sleep night → +5 health per night logged with duration ≥ 6h.
create or replace function public.score_from_sleep_night() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.duration_min < 360 then return new; end if;
  insert into score_events (user_id, occurred_at, delta, source, pillar, ref_kind, ref_id)
  values (new.user_id, coalesce(new.woke_at, now()), 5, 'Sleep ' || round(new.duration_min/60.0, 1) || 'h', 'health', 'sleep_night', new.id)
  on conflict (user_id, ref_kind, ref_id) where ref_id is not null do nothing;
  return new;
end $$;

drop trigger if exists score_on_sleep_night on public.sleep_nights;
create trigger score_on_sleep_night
  after insert on public.sleep_nights
  for each row execute function public.score_from_sleep_night();

-- Diary entry → +3 mind per entry.
create or replace function public.score_from_diary_entry() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into score_events (user_id, occurred_at, delta, source, pillar, ref_kind, ref_id)
  values (new.user_id, coalesce(new.occurred_at, now()), 3, 'Diary entry', 'mind', 'diary_entry', new.id)
  on conflict (user_id, ref_kind, ref_id) where ref_id is not null do nothing;
  return new;
end $$;

drop trigger if exists score_on_diary_entry on public.diary_entries;
create trigger score_on_diary_entry
  after insert on public.diary_entries
  for each row execute function public.score_from_diary_entry();

-- Quest completed → +xp split by rank into focus pillar (default).
-- Triggered on UPDATE when status flips to 'done'.
create or replace function public.score_from_quest_done() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'done' or coalesce(old.status, '') = 'done' then return new; end if;
  insert into score_events (user_id, occurred_at, delta, source, pillar, ref_kind, ref_id)
  values (
    new.user_id,
    coalesce(new.completed_at, now()),
    greatest(1, round(coalesce(new.xp, 0) / 10.0)::int),
    'Quest: ' || left(new.title, 60),
    'focus',
    'quest_done',
    new.id
  )
  on conflict (user_id, ref_kind, ref_id) where ref_id is not null do nothing;
  return new;
end $$;

drop trigger if exists score_on_quest_done on public.quests;
create trigger score_on_quest_done
  after update on public.quests
  for each row execute function public.score_from_quest_done();

-- Initial backfill: recompute everyone so existing intakes / sleep
-- nights / diary entries flow into the snapshot.
do $$
declare uid uuid;
begin
  for uid in select distinct user_id from score_events union select id from auth.users loop
    perform recompute_user_score(uid);
  end loop;
end $$;

grant execute on function public.recompute_user_score(uuid) to authenticated;
