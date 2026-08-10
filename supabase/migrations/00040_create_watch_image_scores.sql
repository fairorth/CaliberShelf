-- 00040_create_watch_image_scores.sql
-- Photo-scoring agent (docs/photo-scoring-agent.md): one row per scored image
-- per watch, keyed by content hash so re-runs are idempotent. Covers BOTH
-- capture-folder frames (local files, not in watch_photos) and, later,
-- uploaded photos (watch_photo_id set once linked). CV columns are the free
-- deterministic layer; shot_card/card_pass are Track A (standard shots);
-- angle_class + ai_* rubric columns are Track B (creative shots). Owner-only.

CREATE TABLE IF NOT EXISTS public.watch_image_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watch_photo_id UUID REFERENCES public.watch_photos(id) ON DELETE SET NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('cr3', 'jpeg', 'heif', 'export')),
  rel_path TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  -- Focus-stack collapse (plan section 3.7)
  stack_seq INTEGER,
  stack_role TEXT CHECK (stack_role IN ('source', 'composite', 'unstacked')),
  -- Layer 1: CV triage (deterministic, free)
  sharpness_roi REAL,
  brightness REAL,
  glare_fraction REAL,
  phash TEXT,
  dup_group INTEGER,
  dup_best BOOLEAN NOT NULL DEFAULT FALSE,
  -- Layer 2: track routing + AI evaluation
  shot_card TEXT,
  card_pass BOOLEAN,
  angle_class TEXT CHECK (angle_class IS NULL OR angle_class IN
    ('flat_dial_on', 'angled_hero', 'side_profile', 'caseback_clasp', 'macro_detail', 'other')),
  ai_dial_focus INTEGER CHECK (ai_dial_focus IS NULL OR ai_dial_focus BETWEEN 1 AND 5),
  ai_framing INTEGER CHECK (ai_framing IS NULL OR ai_framing BETWEEN 1 AND 5),
  ai_reflections INTEGER CHECK (ai_reflections IS NULL OR ai_reflections BETWEEN 1 AND 5),
  ai_background INTEGER CHECK (ai_background IS NULL OR ai_background BETWEEN 1 AND 5),
  ai_lighting INTEGER CHECK (ai_lighting IS NULL OR ai_lighting BETWEEN 1 AND 5),
  ai_color INTEGER CHECK (ai_color IS NULL OR ai_color BETWEEN 1 AND 5),
  ai_detail INTEGER CHECK (ai_detail IS NULL OR ai_detail BETWEEN 1 AND 5),
  ai_primary_defect TEXT,
  ai_unusable BOOLEAN NOT NULL DEFAULT FALSE,
  ai_model TEXT,
  -- Layer 3: composite + hero selection
  composite_score REAL,
  hero_for_class BOOLEAN NOT NULL DEFAULT FALSE,
  scored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (watch_id, content_hash)
);

CREATE INDEX IF NOT EXISTS watch_image_scores_watch_id_idx
  ON public.watch_image_scores (watch_id);
CREATE INDEX IF NOT EXISTS watch_image_scores_user_id_idx
  ON public.watch_image_scores (user_id);

ALTER TABLE public.watch_image_scores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_image_scores_select_owner') THEN
    CREATE POLICY watch_image_scores_select_owner ON public.watch_image_scores
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_image_scores_insert_owner') THEN
    CREATE POLICY watch_image_scores_insert_owner ON public.watch_image_scores
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_image_scores_update_owner') THEN
    CREATE POLICY watch_image_scores_update_owner ON public.watch_image_scores
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_image_scores_delete_owner') THEN
    CREATE POLICY watch_image_scores_delete_owner ON public.watch_image_scores
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
