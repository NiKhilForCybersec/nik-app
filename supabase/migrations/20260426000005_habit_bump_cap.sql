-- Cap habit_bump at the target (was 2x target). The Hydrate tile was
-- showing 10/8 because the original RPC let `done` exceed `target` up
-- to 2x — usable for over-achievement, but the user wants the ring to
-- visually max out at the goal (no "10/8 glasses" anywhere on screen).
-- Logging additional intake still works; it just no longer pushes the
-- habit beyond its visible cap.

set check_function_bodies = off;

create or replace function public.habit_bump(habit_id uuid, amount int default 1)
returns public.habits
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.habits;
  was_complete boolean;
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
     set done = least(h.done + amount, h.target),  -- HARD CAP at target
         last_done_at = now(),
         updated_at = now(),
         streak = case
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
