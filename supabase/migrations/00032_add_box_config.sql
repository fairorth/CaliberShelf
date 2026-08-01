-- 00032_add_box_config.sql
-- User-configurable number of storage boxes. Stored per user on profiles as
-- JSONB { "count": N }. Boxes are numbered Box1..BoxN and offered as a dropdown
-- on the watch form's Box field. NULL column = use the app's built-in default (10).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS box_config JSONB;
