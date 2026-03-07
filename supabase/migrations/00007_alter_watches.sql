-- Wire watches to brands, movements, and display cases
-- Any existing watches must be removed first because the schema
-- is changing fundamentally (text → FK). Storage photos are
-- orphaned on purpose (Supabase Storage can be cleaned manually).

-- Remove existing watch_photos rows (CASCADE would handle this,
-- but being explicit avoids surprises)
DELETE FROM public.watch_photos;

-- Remove existing watches
DELETE FROM public.watches;

-- Now safe to add the new NOT NULL FK columns
ALTER TABLE public.watches
  ADD COLUMN brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
  ADD COLUMN movement_id UUID REFERENCES public.movements(id) ON DELETE SET NULL,
  ADD COLUMN case_id UUID NOT NULL REFERENCES public.display_cases(id) ON DELETE RESTRICT,
  ADD COLUMN case_slot INTEGER NOT NULL;

-- Drop the old free-text/enum columns
ALTER TABLE public.watches
  DROP COLUMN brand,
  DROP COLUMN movement;

-- Ensure no two watches occupy the same slot in a case
CREATE UNIQUE INDEX watches_case_slot_unique ON public.watches(case_id, case_slot);

-- Index for fast case lookups
CREATE INDEX IF NOT EXISTS watches_case_id_idx ON public.watches(case_id);
CREATE INDEX IF NOT EXISTS watches_brand_id_idx ON public.watches(brand_id);
CREATE INDEX IF NOT EXISTS watches_movement_id_idx ON public.watches(movement_id);
