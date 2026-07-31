-- 00031_add_box.sql
-- Storage location: which watch case / box in the safe holds this watch.
-- Free text on purpose — boxes get named ad hoc ("Safe box 3", "travel roll").

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS box TEXT;

COMMENT ON COLUMN public.watches.box IS
  'Free-text storage location — which watch case/box this watch lives in.';
