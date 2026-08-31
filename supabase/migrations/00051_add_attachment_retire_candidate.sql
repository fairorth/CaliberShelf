-- 00051_add_attachment_retire_candidate.sql
-- Two related changes to the sale story:
--
-- 1. ATTACHMENT — how much the owner loves a watch, on a four-step scale.
--    It is the counterweight to every number in the Market section: a watch
--    can be up 40% and still be a 'max', and that is the whole reason to
--    record it. TEXT + CHECK rather than a Postgres enum precisely because
--    of change 2 below — dropping a value from an enum means recreating the
--    type, and this list will move before sale_status does.
--
-- 2. CANDIDATE IS RETIRED. The lifecycle is now linear in three steps:
--
--       owned -> listed -> sold
--
--    "Thinking about it" was a state the app tracked but the owner never
--    used as one: either a watch is for sale (with a venue, a date and an
--    ask) or it is not. Transitions stay enforced in
--    src/lib/actions/sales.ts, not here.
--
--    The 'candidate' VALUE remains in the public.sale_status enum — removing
--    an enum value requires recreating the type and rewriting every column
--    that uses it, which is a great deal of risk for a value that, after the
--    UPDATE below, no row holds and no code can write. It is dead, not gone.

-- ── 1. Attachment ───────────────────────────────────────────────

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS attachment TEXT
    CHECK (attachment IS NULL OR attachment IN ('max','high','medium','low'));

COMMENT ON COLUMN public.watches.attachment IS
  'How attached the owner is: max | high | medium | low. NULL = unrated.';

-- ── 2. Retire candidate ─────────────────────────────────────────
-- Any watch still sitting on the block goes back to plain owned. It was
-- never listed anywhere, so there is no listing row to reconcile.

UPDATE public.watches
   SET sale_status = 'owned'
 WHERE sale_status = 'candidate';

ALTER TABLE public.watches
  DROP COLUMN IF EXISTS candidate_since,
  DROP COLUMN IF EXISTS candidate_note;
