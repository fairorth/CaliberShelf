-- 00036_add_brand_wishlist.sql
-- Tag a brand as a "wish list" brand: one we own no watches from but want to.
-- Set via the Config → Brands add/edit forms; cleared automatically when a
-- non-wish-list watch (owned or coming soon) is saved with that brand.

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS is_wishlist BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.brands.is_wishlist IS
  'Wish-list brand: no owned watches yet, but we want one. Auto-cleared when an owned/coming-soon watch is added for the brand.';
