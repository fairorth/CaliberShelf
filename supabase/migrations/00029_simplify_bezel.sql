-- 00029_simplify_bezel.sql
-- Bezels don't earn first-class billing here. Drop the two bezel spec columns
-- (and their enum types), and replace them with a single rotating_bezel flag.
-- The old bezel_type / bezel_material data is intentionally discarded.

ALTER TABLE public.watches
  DROP COLUMN IF EXISTS bezel_type,
  DROP COLUMN IF EXISTS bezel_material;

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS rotating_bezel BOOLEAN NOT NULL DEFAULT false;

-- Enum types are now unused.
DROP TYPE IF EXISTS public.bezel_type;
DROP TYPE IF EXISTS public.bezel_material;
