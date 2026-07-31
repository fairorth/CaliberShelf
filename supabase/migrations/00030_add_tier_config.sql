-- 00030_add_tier_config.sql
-- User-configurable price tiers. Stored per user on profiles as an ordered
-- JSONB array of { label, max } rows, where `max` is the exclusive upper bound
-- in dollars and the last row's max is null (open-ended top tier). NULL column
-- = use the app's built-in default tiers.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tier_config JSONB;
