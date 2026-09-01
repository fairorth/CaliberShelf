-- Add 'none' to the attachment scale: max | high | medium | low | none.
--
-- 'none' is a RATING, not the absence of one: NULL still means "never
-- rated", while 'none' says the owner considered it and feels nothing —
-- which, as the counterweight to every Market number, is the clearest
-- sell signal the scale can give.
--
-- attachment is TEXT + CHECK precisely so this costs one constraint swap
-- (00051's lesson from retiring the 'candidate' enum value).

ALTER TABLE public.watches
  DROP CONSTRAINT IF EXISTS watches_attachment_check;

ALTER TABLE public.watches
  ADD CONSTRAINT watches_attachment_check
    CHECK (attachment IS NULL OR attachment IN ('max', 'high', 'medium', 'low', 'none'));
