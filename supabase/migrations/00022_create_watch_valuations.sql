-- 00022_create_watch_valuations.sql
-- Time series of market-value estimates produced by the valuation agent
-- (scripts/price-check.mjs). One row per watch per agent run. Feeds the
-- Phase 4 valuation charts. Money follows the BIGINT-cents convention.

CREATE TABLE IF NOT EXISTS public.watch_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  valued_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Estimate: low/high bound the realistic range, mid is the best single estimate
  value_low_cents BIGINT,
  value_mid_cents BIGINT NOT NULL,
  value_high_cents BIGINT,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Agent metadata
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  n_datapoints INTEGER,
  assumed_variant TEXT,
  datapoints JSONB,      -- [{price_usd, source, type: sold|asking, date, note}]
  sources JSONB,         -- [url, ...]
  method_notes TEXT,
  caveats TEXT,
  agent_model TEXT,      -- e.g. "claude-opus-4-8", for provenance

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS watch_valuations_watch_valued_idx
  ON public.watch_valuations (watch_id, valued_at DESC);

ALTER TABLE public.watch_valuations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_valuations_select_owner') THEN
    CREATE POLICY watch_valuations_select_owner ON public.watch_valuations
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_valuations_insert_owner') THEN
    CREATE POLICY watch_valuations_insert_owner ON public.watch_valuations
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_valuations_delete_owner') THEN
    CREATE POLICY watch_valuations_delete_owner ON public.watch_valuations
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
