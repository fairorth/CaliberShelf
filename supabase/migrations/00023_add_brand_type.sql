-- Add brand_type to brands: distinguishes major manufacturers from
-- microbrands and independent watchmakers. Used by the deal-scanner to route
-- wish-list watches to the right market source (brand-direct availability vs
-- gray market).

DO $$ BEGIN
  CREATE TYPE public.brand_type AS ENUM ('major', 'micro', 'indie');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS brand_type public.brand_type;
