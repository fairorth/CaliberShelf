-- 00046_add_valuation_source.sql
-- Phase 5, 4 of 5: manual valuations logged alongside agent rows (V7).
--
-- Rules (enforced in Zod + the server action, not here): manual rows require
-- value_mid_cents, confidence, and entered_note; agent_model stays null;
-- datapoints/sources may be null. Portfolio totals and the trend chart's
-- primary series use agent rows only — manual rows plot as hollow markers on
-- the same axis (decision: alongside, not overriding).

ALTER TABLE public.watch_valuations
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'agent'
    CHECK (source IN ('agent','manual')),
  ADD COLUMN IF NOT EXISTS entered_note TEXT;   -- "saw one sell at RedBar for 4.2"
