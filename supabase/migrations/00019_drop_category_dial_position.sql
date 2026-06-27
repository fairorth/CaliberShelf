-- Remove the obsolete category "dial position".
--
-- Categories used to map 1:1 to the 12 hour positions on the home dial
-- (display_order = 0–11). The home dial is no longer category-based — it now
-- shows a random rotation of photographed watches — so the column and its
-- one-per-hour constraint are dead weight.
--
-- Dropping the column automatically removes any index or unique constraint
-- defined on it.
--
-- Run in Supabase SQL Editor.

ALTER TABLE public.categories DROP COLUMN IF EXISTS display_order;
