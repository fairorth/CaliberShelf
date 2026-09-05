-- 00053_tier_valuations.sql
-- Static valuations for untracked watches (v1.10.2).
--
-- The valuation agent only runs on watches with a reference number and price
-- tracking switched on, which left most of the collection with no value at
-- all. A third valuation source fills the gap: `tier`, a flat percentage of
-- the purchase price taken from the watch's price tier
-- (profiles.tier_config[].valuationPct, JSONB — no migration needed there).
--
-- Rules, enforced in src/lib/actions/tier-valuations.ts, not here:
--   * A tier row exists only for a watch that is NOT price-tracked, not sold
--     and not on the wish list, and that has a purchase price.
--   * There is at most ONE per watch and it has no history — it is derived,
--     not observed, so a refresh replaces it rather than appending. The
--     partial unique index below is the guard.
--   * Tracked watches never get one: the agent estimate is the answer, and two
--     current values for one watch is the same fact twice.
--
-- run_mode gains 'static' for the same reason: 'deep' on a row that never ran
-- anything would be a lie in the one column that says how a number was made.

-- Both CHECKs were created inline by ADD COLUMN (00046, 00049), so Postgres
-- named them itself. Drop by DEFINITION rather than by assumed name: a widened
-- constraint added alongside a surviving narrow one would look like it worked
-- and still reject every insert.
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.watch_valuations'::regclass
      AND contype = 'c'
      AND (pg_get_constraintdef(oid) ILIKE '%source%'
           OR pg_get_constraintdef(oid) ILIKE '%run_mode%')
  LOOP
    EXECUTE format('ALTER TABLE public.watch_valuations DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.watch_valuations
  ADD CONSTRAINT watch_valuations_source_check
  CHECK (source IN ('agent', 'manual', 'tier'));

ALTER TABLE public.watch_valuations
  ADD CONSTRAINT watch_valuations_run_mode_check
  CHECK (run_mode IN ('quick', 'deep', 'static'));

CREATE UNIQUE INDEX IF NOT EXISTS watch_valuations_one_tier_per_watch
  ON public.watch_valuations (watch_id)
  WHERE source = 'tier';
