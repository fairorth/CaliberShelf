-- 00021_add_price_check_enabled.sql
-- Opt-in flag for the market-valuation agent (Phase 4). Only watches with
-- this flag set are included in automated price checks, and enabling it
-- requires a reference number so the agent can identify the exact variant.

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS price_check_enabled BOOLEAN NOT NULL DEFAULT false;

-- Defense in depth: the app enforces this in Zod, but the database should
-- never hold a price-checkable watch without a reference number.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'watches_price_check_requires_ref'
  ) THEN
    ALTER TABLE public.watches
      ADD CONSTRAINT watches_price_check_requires_ref
      CHECK (NOT price_check_enabled OR reference_number IS NOT NULL);
  END IF;
END $$;
