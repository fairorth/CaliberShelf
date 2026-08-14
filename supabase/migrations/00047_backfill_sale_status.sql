-- 00047_backfill_sale_status.sql
-- Phase 5, 5 of 5: sale-status backfill.
--
-- Deliberately a no-op for existing rows: 00043's DEFAULT 'owned' already
-- covers every watch, and there is no data to invent.
--
-- Acquisition-cost note: existing watches keep
-- cost_basis_cents = purchase_price_cents until the three new fields
-- (acq_shipping_cents / acq_tax_cents / acq_duty_cents) are filled in by hand
-- on the edit form. That is expected, not a bug.

UPDATE public.watches SET sale_status = 'owned' WHERE sale_status IS NULL;  -- 0 rows: column is NOT NULL
