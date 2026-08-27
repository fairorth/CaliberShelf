-- Price-check redesign, part 1 (quick vs deep runs).
--
-- watch_valuations.run_mode: 'quick' = the in-app "Check price now" snapshot
-- (3 searches / 1 fetch, ~1 minute, asking-price oriented); 'deep' = the full
-- methodology (monthly cron today, overnight queue later). Existing rows were
-- all produced by the full methodology, so the default backfills them as
-- 'deep'. The trend chart's primary series will use deep rows; quick rows
-- plot as snapshot markers (rollout #4).
--
-- agent_run_items.duration_ms: per-step timing as a real, queryable number.
-- Until now it was stringified into the free-text detail column ("· 4.2s"),
-- which made "where do the minutes go across runs" unanswerable in SQL.

ALTER TABLE public.watch_valuations
  ADD COLUMN IF NOT EXISTS run_mode TEXT NOT NULL DEFAULT 'deep'
    CHECK (run_mode IN ('quick', 'deep'));

ALTER TABLE public.agent_run_items
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
