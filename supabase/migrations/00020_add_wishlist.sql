-- 00020_add_wishlist.sql
-- Track watches the user wants but doesn't own yet ("wish list").
-- Wish-list watches are excluded from the collection view, counts, and
-- total-value calculations by default.

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS is_wishlist BOOLEAN NOT NULL DEFAULT false;
