-- 00048_add_photo_dimensions.sql
-- Phase 8 §2.1 / Phase 9 §1.1, §2.2 (design_handoff_v4/13-phase-8-dimensions.md):
-- pixel dimensions of the STORED photograph, so a frame's aspect is known
-- before anything is rendered.
--
-- Four rules need this, and two of them cannot be answered any other way:
--   · Phase 8 §1.2  pick the WIDEST frame for the stage      (server-side)
--   · Phase 8 §2.1  size the stage box to the photograph
--   · Phase 9 §1.1  pick the NEAREST-1:1 frame for tiles     (server-side)
--   · Phase 9 §2.2  size the watch-page hero box
-- The two selection rules run in the query, before a browser has loaded any
-- image, so measuring at render time could not serve them — and §2.1 forbids
-- render-time inference anyway, because the box must be right on first paint
-- with no layout shift as the rotation advances.
--
-- Values describe the composite that was actually stored (post-resize,
-- post-EXIF-rotation), never the source RAW: the stacker resizes, so RAW
-- dimensions would describe a file that is not the one being displayed.
--
-- Both nullable, deliberately. NULL is a real, supported state: a photo with
-- no dimensions gets the 3:2 content-width fallback box and is EXCLUDED from
-- widest-frame and nearest-1:1 comparison rather than assumed square. The
-- backfill will not resolve every legacy row, and those must degrade quietly.

ALTER TABLE public.watch_photos
  ADD COLUMN IF NOT EXISTS image_width INTEGER
    CHECK (image_width IS NULL OR image_width > 0);

ALTER TABLE public.watch_photos
  ADD COLUMN IF NOT EXISTS image_height INTEGER
    CHECK (image_height IS NULL OR image_height > 0);

COMMENT ON COLUMN public.watch_photos.image_width IS
  'Pixel width of the stored composite, after EXIF orientation. NULL = unknown; caller falls back to 3:2 and skips aspect comparison.';
COMMENT ON COLUMN public.watch_photos.image_height IS
  'Pixel height of the stored composite, after EXIF orientation. NULL = unknown; caller falls back to 3:2 and skips aspect comparison.';
