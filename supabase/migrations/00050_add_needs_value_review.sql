-- Evidence guardrail for the valuation agents (V10 part 1 follow-up).
--
-- A quick check on the Breguet 7097 exhausted its search budget on tool
-- errors, and the model produced a "general knowledge" placeholder ($13,500
-- against a ~$20k watch) that was saved as if it were research. From now on
-- a run whose result is not backed by real evidence (>= 2 datapoints AND at
-- least one successful search/fetch) is DISCARDED — the existing valuation
-- stands — and the watch is flagged here instead.
--
-- The flag surfaces as a "Market value" chip in the Attention Needed report
-- and clears when any trusted valuation lands (successful agent run, or a
-- manual Log-a-value entry).

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS needs_value_review BOOLEAN NOT NULL DEFAULT false;
