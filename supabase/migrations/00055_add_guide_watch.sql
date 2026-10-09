-- 00055_add_guide_watch.sql
-- "Guide Watch" — a flag marking a watch as part of the Master Collection
-- Guides programme, independent of ownership (owned / coming soon / wish list).
--
-- Why a stored flag and not just the guide_entries.watch_id link: the guide
-- seeders created dozens of wish-list watches, and the owner could no longer
-- tell those apart from the ones they fell for and entered by hand. The flag
-- is the owner's to keep — it survives a purchase (wish list → owned), and it
-- can be switched off on a watch the owner wanted before any guide named it.
-- The link stays the record of WHICH guide and entry; the flag answers "is this
-- a guide watch?" in one column the collection and reports can filter on.
--
-- Backfill: every watch currently linked from a guide entry.

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS is_guide_watch BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.watches.is_guide_watch IS
  'Part of a Master Collection Guide. Independent of ownership; persists through purchase. Owner-editable.';

UPDATE public.watches w
   SET is_guide_watch = true
 WHERE is_guide_watch = false
   AND EXISTS (
     SELECT 1 FROM public.guide_entries e
      WHERE e.watch_id = w.id
   );
