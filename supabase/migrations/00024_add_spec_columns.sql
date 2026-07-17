-- New spec columns on watches: weight, case shape, bezel type/material.
-- Rounds out the wearability dimensions (weight joins diameter, lug-to-lug,
-- thickness) and adds bezel identity for tool watches.

DO $$ BEGIN
  CREATE TYPE public.case_shape AS ENUM (
    'round',
    'cushion',
    'tonneau',
    'rectangular',
    'square',
    'oval',
    'octagonal',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.bezel_type AS ENUM (
    'none',
    'fixed',
    'dive',
    'gmt',
    'tachymeter',
    'compass',
    'countdown',
    'internal',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.bezel_material AS ENUM (
    'stainless_steel',
    'titanium',
    'ceramic',
    'aluminum',
    'sapphire',
    'gold',
    'bronze',
    'carbon',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS weight_g NUMERIC(6, 1),
  ADD COLUMN IF NOT EXISTS case_shape public.case_shape,
  ADD COLUMN IF NOT EXISTS bezel_type public.bezel_type,
  ADD COLUMN IF NOT EXISTS bezel_material public.bezel_material;
