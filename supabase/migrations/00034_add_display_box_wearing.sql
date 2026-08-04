-- 00034_add_display_box_wearing.sql
-- Which watch in the current display box is on the wrist right now (single-select).
-- NULL = none currently being worn.

ALTER TABLE public.display_boxes
  ADD COLUMN IF NOT EXISTS wearing_watch_id UUID
    REFERENCES public.watches(id) ON DELETE SET NULL;
