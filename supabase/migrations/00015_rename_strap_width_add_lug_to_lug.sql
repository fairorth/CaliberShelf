-- 00015_rename_strap_width_add_lug_to_lug.sql
-- Two case-measurement changes on watches:
--   1. Rename lug_width_mm -> strap_width_mm. The value has always meant the
--      strap/bracelet width between the lugs; "Strap Width" is the clearer label.
--   2. Add lug_to_lug_mm: the tip-to-tip case length (typically ~46mm), which
--      drives how a watch actually wears on the wrist.
-- RENAME preserves the column data and any dependent objects.

ALTER TABLE public.watches
  RENAME COLUMN lug_width_mm TO strap_width_mm;

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS lug_to_lug_mm NUMERIC(4,1);
