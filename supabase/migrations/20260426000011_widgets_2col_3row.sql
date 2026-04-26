-- Nik — clamp widget width to 1-2; keep height 1-3.
--
-- The 3-column grid was too cramped on a phone screen; cells became
-- ~33% of viewport which is too small for legible content. Reverting
-- width to a 2-col grid (w ∈ {1, 2}) but keeping h ∈ {1, 2, 3} so
-- users can still go tall (1×2, 2×2, 1×3, 2×3) for richer widgets.
--
-- Existing rows with w=3 are clamped to w=2 so they re-render in the
-- new layout without violating the constraint.

set check_function_bodies = off;

update public.home_widgets set w = 2 where w = 3;

alter table public.home_widgets drop constraint if exists home_widgets_w_check;
alter table public.home_widgets drop constraint if exists home_widgets_h_check;

alter table public.home_widgets add constraint home_widgets_w_check check (w between 1 and 2);
alter table public.home_widgets add constraint home_widgets_h_check check (h between 1 and 3);
