-- 00045_create_watch_sales.sql
-- Phase 5, 3 of 5: sales. UNIQUE (watch_id) is the linear decision made
-- physical — one sale per watch. Realized gain is
-- net_proceeds_cents - watches.cost_basis_cents, computed in
-- src/lib/queries/sales.ts and nowhere else. Money is BIGINT cents.

CREATE TABLE IF NOT EXISTS public.watch_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL UNIQUE REFERENCES public.watches(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.watch_listings(id) ON DELETE SET NULL,

  sold_at DATE NOT NULL,
  sale_price_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  venue public.sale_venue NOT NULL,      -- denormalized: sales outlive listings
  venue_other TEXT,

  buyer_name TEXT,                       -- "Dan K." or "u/handle"
  buyer_handle TEXT,
  payment_method TEXT,                   -- PayPal G&S, Zelle, cash, wire…
  tracking_number TEXT,

  venue_fee_cents BIGINT NOT NULL DEFAULT 0,
  processing_fee_cents BIGINT NOT NULL DEFAULT 0,
  shipping_cost_cents BIGINT NOT NULL DEFAULT 0,
  insurance_cents BIGINT NOT NULL DEFAULT 0,

  -- Generated: nothing anywhere re-derives net proceeds.
  net_proceeds_cents BIGINT
    GENERATED ALWAYS AS (
      sale_price_cents - venue_fee_cents - processing_fee_cents
      - shipping_cost_cents - insurance_cents
    ) STORED,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS watch_sales_user_sold_idx
  ON public.watch_sales (user_id, sold_at DESC);

ALTER TABLE public.watch_sales ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_sales_select_owner') THEN
    CREATE POLICY watch_sales_select_owner ON public.watch_sales
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_sales_insert_owner') THEN
    CREATE POLICY watch_sales_insert_owner ON public.watch_sales
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_sales_update_owner') THEN
    CREATE POLICY watch_sales_update_owner ON public.watch_sales
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_sales_delete_owner') THEN
    CREATE POLICY watch_sales_delete_owner ON public.watch_sales
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- updated_at trigger (reuse existing function)
DROP TRIGGER IF EXISTS watch_sales_updated_at ON public.watch_sales;
CREATE TRIGGER watch_sales_updated_at
  BEFORE UPDATE ON public.watch_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
