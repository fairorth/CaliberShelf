-- Phase 6.6: Replace display cases with categories + add labels
--
-- This migration:
-- 1. Renames display_cases → categories (preserves IDs so watch FKs stay valid)
-- 2. Drops capacity, case_type columns; adds color column
-- 3. Drops the case_size enum type
-- 4. Renames watches.case_id → category_id, drops case_slot
-- 5. Creates labels + watch_labels tables with RLS
--
-- Run in Supabase SQL Editor.

-- ═══════════════════════════════════════════════════════════════
-- STEP 1: Rename display_cases → categories
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.display_cases RENAME TO categories;

-- Drop columns that no longer apply
ALTER TABLE public.categories
  DROP COLUMN IF EXISTS capacity,
  DROP COLUMN IF EXISTS case_type;

-- Add optional color for future use
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS color TEXT;

-- Drop the case_size enum (no longer needed)
DROP TYPE IF EXISTS public.case_size;

-- ═══════════════════════════════════════════════════════════════
-- STEP 2: Rename RLS policies (drop old, create new)
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "display_cases_select_owner" ON public.categories;
DROP POLICY IF EXISTS "display_cases_insert_owner" ON public.categories;
DROP POLICY IF EXISTS "display_cases_update_owner" ON public.categories;
DROP POLICY IF EXISTS "display_cases_delete_owner" ON public.categories;
DROP POLICY IF EXISTS "display_cases_select_public" ON public.categories;

CREATE POLICY "categories_select_owner" ON public.categories
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "categories_insert_owner" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update_owner" ON public.categories
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_delete_owner" ON public.categories
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Public access (future sharing)
CREATE POLICY "categories_select_public" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = categories.user_id
      AND profiles.is_public = true
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- STEP 3: Rename trigger and index
-- ═══════════════════════════════════════════════════════════════

-- Drop old trigger, create new one with new name
DROP TRIGGER IF EXISTS display_cases_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Rename index
ALTER INDEX IF EXISTS display_cases_user_id_idx RENAME TO categories_user_id_idx;

-- ═══════════════════════════════════════════════════════════════
-- STEP 4: Update watches table — rename case_id, drop case_slot
-- ═══════════════════════════════════════════════════════════════

-- Drop the unique index on (case_id, case_slot) first
DROP INDEX IF EXISTS watches_case_slot_unique;

-- Drop the case_slot column
ALTER TABLE public.watches DROP COLUMN IF EXISTS case_slot;

-- Rename case_id → category_id
ALTER TABLE public.watches RENAME COLUMN case_id TO category_id;

-- Rename the index
ALTER INDEX IF EXISTS watches_case_id_idx RENAME TO watches_category_id_idx;

-- ═══════════════════════════════════════════════════════════════
-- STEP 5: Create labels table
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Each user's labels are unique by name
CREATE UNIQUE INDEX IF NOT EXISTS labels_user_name_unique ON public.labels(user_id, name);
CREATE INDEX IF NOT EXISTS labels_user_id_idx ON public.labels(user_id);

-- Enable RLS
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "labels_select_owner" ON public.labels
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "labels_insert_owner" ON public.labels
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "labels_update_owner" ON public.labels
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "labels_delete_owner" ON public.labels
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- STEP 6: Create watch_labels junction table
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.watch_labels (
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  PRIMARY KEY (watch_id, label_id)
);

CREATE INDEX IF NOT EXISTS watch_labels_watch_id_idx ON public.watch_labels(watch_id);
CREATE INDEX IF NOT EXISTS watch_labels_label_id_idx ON public.watch_labels(label_id);

-- Enable RLS
ALTER TABLE public.watch_labels ENABLE ROW LEVEL SECURITY;

-- RLS based on watch ownership (join to watches table)
CREATE POLICY "watch_labels_select_owner" ON public.watch_labels
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.watches
      WHERE watches.id = watch_labels.watch_id
      AND watches.user_id = auth.uid()
    )
  );

CREATE POLICY "watch_labels_insert_owner" ON public.watch_labels
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.watches
      WHERE watches.id = watch_labels.watch_id
      AND watches.user_id = auth.uid()
    )
  );

CREATE POLICY "watch_labels_delete_owner" ON public.watch_labels
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.watches
      WHERE watches.id = watch_labels.watch_id
      AND watches.user_id = auth.uid()
    )
  );
