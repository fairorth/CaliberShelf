-- 00033_create_display_box.sql
-- "Display Box" — the weekly rotation of watches pulled from the safe into the
-- study case. History is kept (one display_boxes row per generation); the
-- current box is the most recent row for the user.

CREATE TABLE IF NOT EXISTS public.display_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT 'algorithm',
  rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.display_box_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL REFERENCES public.display_boxes(id) ON DELETE CASCADE,
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  position INT NOT NULL,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS display_boxes_user_created_idx ON public.display_boxes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS display_box_watches_box_idx ON public.display_box_watches(box_id);

ALTER TABLE public.display_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.display_box_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "display_boxes_select_owner" ON public.display_boxes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "display_boxes_insert_owner" ON public.display_boxes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "display_boxes_delete_owner" ON public.display_boxes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "display_box_watches_select_owner" ON public.display_box_watches
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.display_boxes b WHERE b.id = box_id AND b.user_id = auth.uid())
  );
CREATE POLICY "display_box_watches_insert_owner" ON public.display_box_watches
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.display_boxes b WHERE b.id = box_id AND b.user_id = auth.uid())
  );
CREATE POLICY "display_box_watches_delete_owner" ON public.display_box_watches
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.display_boxes b WHERE b.id = box_id AND b.user_id = auth.uid())
  );
