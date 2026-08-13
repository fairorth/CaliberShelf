# Fix pass — collection table, round 3

Branch `fix/collection-table-3` off the current tip of main. Commit per item.

Reviewed from a screenshot of the collection table, light mode, one filter active.

Landed correctly and must not regress: zebra striping, the band-2 filter chip row with
`Clear all`, the `Columns` button placement, and the header metrics no longer clipping.

---

## 1. Thumbnails are letterboxed — the watch is cut in half

The photo cell renders each image as a wide horizontal band roughly 290×40, slicing a strip out
of the middle of the watch. Cases are cut off top and bottom; several rows show only a lug and
part of a dial. This is worse than the pre-v2 state and it is the most visually damaging thing
on the screen.

A collection table thumbnail must be **square and `object-cover` centred**, around 56×56. The
watch should be recognisable at a glance — that is the column's only job.

## 2. The PHOTO column is ~300px wide

It is consuming roughly a fifth of the table for a thumbnail. Set it to a fixed ~72px (56px
image plus padding) and give the reclaimed width to `MODEL`, which is currently cramped against
its badges.

## 3. There is an empty column between MODEL and PRICE

A wide blank column sits between them, and its header cell contains a stray outlined rectangle —
an unstyled input or a mis-rendered resize handle. Nothing renders in the body cells.

Find what is emitting it. If it is a column with no data source, remove it from the default set.
If it is a resize affordance, style it or drop it. An empty column with a mystery box in the
header reads as a broken page.

## 4. `WISH LIST` badge is light blue — E1 violation, fifth occurrence

`COMING SOON` is correctly brass. `WISH LIST` beside it is baby blue.

Both are status badges and both must come from the palette. Differentiate them by treatment, not
by inventing a second hue: brass filled for `COMING SOON`, brass outlined for `WISH LIST` — or
any pairing that stays within brass and the neutrals.

This is the fifth separate instance of a non-brass accent surviving a sweep. Audit every badge,
pill, chip and status indicator in the app in one pass and confirm each one's colour resolves
from a palette token, not a literal.

## 5. The green dollar glyph next to SBGE285

A green currency icon appears inline in the model cell. Green is not in the palette. If it marks
price-tracking, use a brass icon; if it marks a price change, brass with a direction arrow. It
also has no label or tooltip — an unexplained coloured glyph in a data table is noise.

---

## Exit checks

- [ ] Thumbnails are square, `object-cover`, ~56px; every watch is recognisable
- [ ] PHOTO column is ~72px wide
- [ ] No empty column; no stray box in any header cell
- [ ] `WISH LIST` and `COMING SOON` both resolve from brass/neutral tokens
- [ ] No green, blue, or other non-palette hue on any badge, pill or status glyph app-wide
- [ ] Every coloured glyph in a data cell has a tooltip or label
- [ ] lint, typecheck, build pass
