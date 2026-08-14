-- 00043_add_cost_basis_lifecycle_ask.sql
-- Phase 5 (Watches as Investments), 1 of 5: sale lifecycle, cost basis, ask.
--
-- Lifecycle is linear, one status per watch: owned -> candidate -> listed -> sold.
-- Transitions are enforced in the server action (src/lib/actions/sales.ts),
-- NOT here — the app owns the lifecycle; a CHECK would block backfills.
--
--   owned     -> candidate | listed
--   candidate -> listed | owned            (owned = "changed my mind")
--   listed    -> sold | candidate | owned  (back = withdrawn, listing row closed)
--   sold      -> owned                     (admin-only undo, deletes the sale row)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_status') THEN
    CREATE TYPE public.sale_status AS ENUM ('owned','candidate','listed','sold');
  END IF;
END $$;

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS sale_status public.sale_status NOT NULL DEFAULT 'owned',
  ADD COLUMN IF NOT EXISTS candidate_since DATE,
  ADD COLUMN IF NOT EXISTS candidate_note TEXT,               -- why it's on the block (<=200 chars, enforced in Zod)
  ADD COLUMN IF NOT EXISTS target_ask_cents BIGINT,
  -- acquisition costs, captured at buy time (decision: cost basis includes these)
  ADD COLUMN IF NOT EXISTS acq_shipping_cents BIGINT,
  ADD COLUMN IF NOT EXISTS acq_tax_cents BIGINT,
  ADD COLUMN IF NOT EXISTS acq_duty_cents BIGINT,
  -- Generated, so no query ever re-derives it and no screen can disagree with
  -- another. Where purchase_price_cents is null the basis is 0 and the UI must
  -- show "—" for gain, never +100%.
  ADD COLUMN IF NOT EXISTS cost_basis_cents BIGINT
    GENERATED ALWAYS AS (
      COALESCE(purchase_price_cents,0) + COALESCE(acq_shipping_cents,0)
      + COALESCE(acq_tax_cents,0) + COALESCE(acq_duty_cents,0)
    ) STORED;
