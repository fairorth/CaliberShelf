# 13 — Phase 8 step 0: stored photo dimensions

The one schema change in Phases 8 and 9, agreed before either was built.
Everything else in the no-migrations guardrail still holds: no new tables, and
no schema change for sale data, valuations, angles or boxes.

## Why a column was unavoidable

Four rules across the two phases need to know a photograph's aspect:

| Spec | Needs aspect to |
|---|---|
| Phase 8 §1.2 | pick the **widest** frame for the stage |
| Phase 8 §2.1 | size the stage box to the photograph |
| Phase 9 §1.1 | pick the **nearest-1:1** frame for square tiles |
| Phase 9 §2.2 | size the watch-page hero box |

The two selection rules settle it. Choosing *which* frame to show happens in
the query, server-side, before a browser has loaded any image — so measuring a
loaded image could not serve them at any price. And §2.1 forbids render-time
inference regardless: the box must be correct on first paint, with no layout
shift as the rotation advances.

Those two rules are also what Phase 9 §1.1 puts in place of the retired
dial-framing editor. Without stored aspect there is no automatic rule, and the
crop tool would have had to stay.

## The migration

`supabase/migrations/00048_add_photo_dimensions.sql`

```sql
ALTER TABLE public.watch_photos
  ADD COLUMN IF NOT EXISTS image_width INTEGER
    CHECK (image_width IS NULL OR image_width > 0);
ALTER TABLE public.watch_photos
  ADD COLUMN IF NOT EXISTS image_height INTEGER
    CHECK (image_height IS NULL OR image_height > 0);
```

Both nullable. No index: the columns are read alongside rows already being
fetched by `watch_id`, never filtered on.

## What the numbers describe

**The stored composite, after EXIF orientation — never the source RAW.**

The stacker resizes, so RAW dimensions would describe a file nobody displays.
And a camera shooting portrait typically writes a landscape pixel grid plus an
orientation tag: storing that unswapped would hand the stage a landscape box
for a portrait frame, which is the very defect §2.1 exists to remove, arriving
by a different route. Orientations 5–8 are the transposed cases and are swapped
on read.

## Where they are written

| Path | Source of the numbers |
|---|---|
| `uploadWatchPhoto` (`photo-actions.ts`) | `readImageDimensions()` over the uploaded bytes |
| `createWatchWithPhoto` (`batch-import-actions.ts`) | same |
| `promoteScoredFrame` (`photo-lab-actions.ts`) | `sharp(...).toBuffer({ resolveWithObject: true })` — the encode already happening, so the size is the composite's own output and costs nothing extra |

`src/lib/image-meta.ts` holds `readImageDimensions()` and `dimensionColumns()`
so the orientation rule exists once.

## Backfill

```bash
npm run backfill-photo-dimensions
```

`--dry-run` counts without writing; `--limit N` scopes a trial. Idempotent —
it only selects rows where either dimension is NULL, so it is safe to re-run.
Downloads each stored object, measures it, updates the row, and prints
`Resolved` / `Unresolved` with a reason per unresolved row (`object missing`,
`undecodable`, or the database error).

## NULL is a real path, not an error

A photo with no dimensions is a supported state everywhere downstream:

- it gets the **3:2 content-width fallback box**, `object-contain` as always;
- it is **excluded from** widest-frame and nearest-1:1 comparison — *excluded*,
  not assumed square, so it never wins a comparison by default and never
  displaces a frame whose aspect is actually known;
- nothing warns, counts or nags about it. The backfill will not resolve every
  legacy row, and that must degrade quietly.

## Not in this phase

The columns are additive and nothing reads them for anything but layout and
frame choice. `dial_focal_x/y` and `dial_zoom` are untouched here — Phase 9 §1.2
stops writing them but explicitly does not drop them.
