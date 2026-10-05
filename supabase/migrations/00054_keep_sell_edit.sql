-- 00054_keep_sell_edit.sql
-- The Edit: the data behind "which watches should I sell?"
--
-- 1. WATCHES gain three owner judgements beside attachment (00051/00052):
--      keep_decision   keep | maybe | sell   — the owner's call (the floor
--                      piles). NULL = undecided. Deliberately NOT a
--                      sale_status value: sale_status is the lifecycle
--                      (owned -> listed -> sold); this is the decision that
--                      precedes it. 'candidate' was retired because nobody
--                      used "thinking about it" — 'sell' here is a firm call
--                      that simply has not been listed yet.
--      sentimental     a lock: never suggested for sale, whatever the score.
--      replaceability  easy | findable | rare | irreplaceable — "could I buy
--                      this again at this price?"
--    plus attachment_rated_at / keep_decided_at so a rating session can
--    resume and stale judgements can be seen. All TEXT + CHECK, not enums
--    (00051's lesson).
--
-- 2. WEAR_LOGS gain `feel` — loved | fine | meh — how the watch felt after a
--    day on the wrist. Optional. It is the wear signal that is informative
--    from the first entry; frequency needs months of logging.
--
-- 3. PROFILES gain the sale goal (amount + label + when it was set) and the
--    fee haircut applied to ESTIMATED values on the To Sell view. Sold
--    watches already carry net proceeds and are never haircut.
--
-- 4. KEEP_FACEOFFS — one row per head-to-head pick ("keep this or that?").
--    Winners and losers feed a small tiebreak in The Edit's keep score.

-- ── 1. Watches ───────────────────────────────────────────────────

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS keep_decision TEXT
    CHECK (keep_decision IS NULL OR keep_decision IN ('keep', 'maybe', 'sell')),
  ADD COLUMN IF NOT EXISTS keep_decided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sentimental BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replaceability TEXT
    CHECK (replaceability IS NULL OR replaceability IN ('easy', 'findable', 'rare', 'irreplaceable')),
  ADD COLUMN IF NOT EXISTS attachment_rated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.watches.keep_decision IS
  'Owner''s keep/sell call: keep | maybe | sell. NULL = undecided. Precedes sale_status; not part of it.';
COMMENT ON COLUMN public.watches.sentimental IS
  'Gift, inheritance, milestone. A lock: The Edit never suggests it for sale.';
COMMENT ON COLUMN public.watches.replaceability IS
  'Could it be bought again at this price? easy | findable | rare | irreplaceable. NULL = unrated.';

-- Existing ratings have no timestamp; stamp them so "rated" is consistent.
UPDATE public.watches
   SET attachment_rated_at = updated_at
 WHERE attachment IS NOT NULL
   AND attachment_rated_at IS NULL;

-- ── 2. Wear logs ─────────────────────────────────────────────────

ALTER TABLE public.wear_logs
  ADD COLUMN IF NOT EXISTS feel TEXT
    CHECK (feel IS NULL OR feel IN ('loved', 'fine', 'meh'));

COMMENT ON COLUMN public.wear_logs.feel IS
  'How the watch felt after the day: loved | fine | meh. NULL = not recorded.';

-- ── 3. Profiles ──────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sale_goal_cents BIGINT
    CHECK (sale_goal_cents IS NULL OR sale_goal_cents >= 0),
  ADD COLUMN IF NOT EXISTS sale_goal_label TEXT,
  ADD COLUMN IF NOT EXISTS sale_goal_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sale_fee_pct NUMERIC(4, 1) NOT NULL DEFAULT 8
    CHECK (sale_fee_pct >= 0 AND sale_fee_pct <= 50);

-- ── 4. Keep face-offs ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.keep_faceoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  winner_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  loser_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (winner_id <> loser_id)
);

CREATE INDEX IF NOT EXISTS keep_faceoffs_user_id_idx ON public.keep_faceoffs(user_id);
CREATE INDEX IF NOT EXISTS keep_faceoffs_winner_id_idx ON public.keep_faceoffs(winner_id);
CREATE INDEX IF NOT EXISTS keep_faceoffs_loser_id_idx ON public.keep_faceoffs(loser_id);

ALTER TABLE public.keep_faceoffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "keep_faceoffs_select_owner" ON public.keep_faceoffs;
CREATE POLICY "keep_faceoffs_select_owner" ON public.keep_faceoffs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "keep_faceoffs_insert_owner" ON public.keep_faceoffs;
CREATE POLICY "keep_faceoffs_insert_owner" ON public.keep_faceoffs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "keep_faceoffs_delete_owner" ON public.keep_faceoffs;
CREATE POLICY "keep_faceoffs_delete_owner" ON public.keep_faceoffs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
