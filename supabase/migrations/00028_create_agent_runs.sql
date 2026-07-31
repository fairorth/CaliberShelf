-- 00028_create_agent_runs.sql
-- Agent execution audit log — one row per agent invocation, plus an optional
-- per-item audit trail. Powers the Agent Execution Review report
-- (/reports/agents). Every agent (price-check, deal-check, find-references,
-- find-store-urls, chronoscout-sync, spec-fetch) writes here via
-- scripts/lib/agent-run.mjs (cron scripts, service role) or directly (the
-- spec-fetch API route, user session).
--
-- Money is stored as integer MICRODOLLARS (usd * 1_000_000): per-item agent
-- costs are fractions of a cent, so cents would lose precision. Divide by 1e6
-- for dollars at the display layer.
--
-- Ownership: user_id is nullable. Interactive/user-scoped runs (spec-fetch) set
-- it; global/cron runs (e.g. chronoscout-sync mirrors shared data) leave it
-- null as "system" runs. RLS lets the owner read their own rows plus system
-- rows; only the owner (or the service role, which bypasses RLS) may insert.

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  agent TEXT NOT NULL,            -- 'price-check' | 'deal-check' | 'find-references'
                                  --  | 'find-store-urls' | 'chronoscout-sync' | 'spec-fetch'
  trigger TEXT NOT NULL DEFAULT 'manual-cli',  -- 'cron' | 'manual-cli' | 'manual-dispatch' | 'ui-click' | 'backfill'
  status TEXT NOT NULL DEFAULT 'running',       -- 'running' | 'success' | 'partial' | 'failed'

  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,

  model TEXT,                     -- null for deterministic agents
  dry_run BOOLEAN NOT NULL DEFAULT false,

  items_processed INTEGER NOT NULL DEFAULT 0,
  items_updated INTEGER NOT NULL DEFAULT 0,
  items_skipped INTEGER NOT NULL DEFAULT 0,
  items_failed INTEGER NOT NULL DEFAULT 0,

  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  web_searches INTEGER NOT NULL DEFAULT 0,
  cost_usd_micros BIGINT NOT NULL DEFAULT 0,   -- usd * 1_000_000

  notes TEXT,                     -- summary line or error message
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_runs_agent_started_idx
  ON public.agent_runs (agent, started_at DESC);
CREATE INDEX IF NOT EXISTS agent_runs_started_idx
  ON public.agent_runs (started_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  entity_type TEXT,               -- 'watch' | 'brand' | 'movement' | null
  entity_id UUID,                 -- soft link (entity may be deleted later)
  label TEXT NOT NULL,            -- denormalized display name

  action TEXT NOT NULL,           -- 'updated' | 'skipped' | 'failed' | 'flagged' | 'no-result'
  field TEXT,                     -- e.g. 'reference_number', or null for whole-record agents
  detail TEXT,                    -- human summary of what happened
  confidence TEXT,                -- nullable
  cost_usd_micros BIGINT,         -- nullable per-item cost
  sources JSONB,                  -- nullable

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_run_items_run_id_idx
  ON public.agent_run_items (run_id);

-- ── RLS: owner reads own + system rows; owner (or service role) inserts ──
ALTER TABLE public.agent_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_run_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agent_runs_select_owner') THEN
    CREATE POLICY agent_runs_select_owner ON public.agent_runs
      FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agent_runs_insert_owner') THEN
    CREATE POLICY agent_runs_insert_owner ON public.agent_runs
      FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agent_run_items_select_owner') THEN
    CREATE POLICY agent_run_items_select_owner ON public.agent_run_items
      FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agent_run_items_insert_owner') THEN
    CREATE POLICY agent_run_items_insert_owner ON public.agent_run_items
      FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
