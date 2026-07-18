-- Deal-scanner Phase A (deterministic availability checks).
--
-- brands.store_url: the brand's official web store (most microbrands run
-- Shopify, whose public /products.json exposes price + per-variant
-- availability). scripts/deal-check.mjs polls it for wish-list watches.
--
-- wishlist_deals: ONE current row per watch (upsert on watch_id) holding the
-- latest availability + retail price. The best_used_* columns are reserved
-- for Phase B (gray-market agent) and stay null until then.

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS store_url TEXT;

CREATE TABLE IF NOT EXISTS public.wishlist_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watch_id UUID NOT NULL UNIQUE REFERENCES public.watches(id) ON DELETE CASCADE,

  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'shopify',

  -- available | preorder | sold_out | not_found | no_store | unknown
  availability TEXT NOT NULL DEFAULT 'unknown',
  retail_price_cents BIGINT,
  currency TEXT NOT NULL DEFAULT 'USD',
  product_url TEXT,
  product_title TEXT,

  -- Phase B: gray-market agent results
  best_used_price_cents BIGINT,
  best_used_url TEXT,
  best_used_note TEXT,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wishlist_deals_user_id_idx
  ON public.wishlist_deals(user_id);

ALTER TABLE public.wishlist_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist_deals_select_owner" ON public.wishlist_deals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "wishlist_deals_insert_owner" ON public.wishlist_deals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlist_deals_update_owner" ON public.wishlist_deals
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlist_deals_delete_owner" ON public.wishlist_deals
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER wishlist_deals_updated_at
  BEFORE UPDATE ON public.wishlist_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
