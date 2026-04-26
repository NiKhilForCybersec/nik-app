-- Nik — expand widget grid from 2 cols to 3 cols.
--
-- Previously w ∈ {1, 2}, h ∈ {1, 2} → 4 valid shapes. The user wants
-- every combination of {1, 2, 3} → 9 shapes (1×1 … 3×3) on a 3-col
-- grid. Drop the old check + add the new one. Existing rows already
-- satisfy the looser constraint (1–3 ⊃ 1–2).

set check_function_bodies = off;

alter table public.home_widgets drop constraint if exists home_widgets_w_check;
alter table public.home_widgets drop constraint if exists home_widgets_h_check;

alter table public.home_widgets add constraint home_widgets_w_check check (w between 1 and 3);
alter table public.home_widgets add constraint home_widgets_h_check check (h between 1 and 3);
