# Fix pass — brand review round 2

Branch `fix/brand-review-2` off the current tip of main. Commit per item.

Reviewed from a screenshot of the Photo Lab page at full width, light mode.

---

## 1. The mark disappears on light surfaces — spec bug, fix in BRAND.md too

The mark renders as a pale washed-out disc. The iris blades are invisible; it reads as a grey
circle with a white centre, and at rail size it carries no brand recognition at all.

**Cause:** the blade values in `BRAND.md` (`rgba(201,162,94,0.72)` / `rgba(201,162,94,0.28)`)
were specified against the navy ground. On a light surface, brass at 28% alpha is nearly white
and 72% is barely tinted, so the six-blade structure vanishes.

**Fix:** the light variant needs opaque blades in the deeper brass range, not alpha:

- alternating blades: `#8a6a2f` and `#b08c46`
- barrel ring: `#8a6a2f`
- aperture interior: the page surface colour
- hands and indices: `#14202e` (navy), not ivory

Verify at 20, 26, 32 and 88px on the actual light background — the six blades must be legible as
distinct facets at 32px. Update `design_handoff_v2_design_remediation/brand/BRAND.md` with the
corrected light-mode values and regenerate `mark-light.svg` / `mark-small-light.svg` /
`logo-horizontal-light.svg` / `logo-stacked-light.svg` to match.

## 2. System blue is back — E1 violation, third occurrence

Three visible instances on one screen:

- the version string `v1.8.0` under the logo
- the `COLLECTION` nav group heading
- `watches have a hero angle` inside the Photo Lab summary line

Brass is the only accent. Sweep again for `blue-[45]00`, `#3b82f6`, `text-blue`, and any
unstyled `<a>` inheriting a UA default. Then set default `a` and `a:hover` colours from the
palette globally so new links cannot regress to browser blue.

The Photo Lab summary line should not contain a link mid-sentence at all — it is a statistic,
not navigation. Render it as plain text.

## 3. Brass on light reads brown, not brass

The `Add Watch` and `Start session` buttons are a muddy brown. Darkening brass for contrast on
light is correct in principle, but it has gone past brass into a dull chocolate.

Target `#8a6a2f` for filled buttons on light with ivory/white label text, and verify it clears
4.5:1. If it does not, adjust the label rather than pushing the fill darker.

## 4. The colon is invisible at rail size

The colon is the single most important detail in the wordmark — it is the entire 10:10
reference — and at 19px on light it disappears into the surrounding text.

Give the colon the brass used for text on light (`#8a6a2f`), not the button fill, and confirm it
reads as deliberately coloured rather than as a rendering artefact at rail size.

## 5. The logo appears twice, 80px apart

In the collapsed-rail layout the mark sits at the top of the 56px rail AND the full horizontal
lockup sits in the page header immediately to its right. Two logos within 80px of each other.

Pick one. The rail mark is the right one to keep — it is the persistent brand anchor and it
matches the expanded rail's behaviour. Remove the lockup from the page header, or if the header
needs the wordmark, drop the mark from the collapsed rail.

## 6. The version string is glued into the lockup

`Ten:Ten LOUPE v1.8.0` renders as one continuous unit, so the version reads as part of the
wordmark. It is not. Move it out of the lockup entirely — footer, About page, or a tooltip on
the mark. Nothing may sit inside the lockup's clear space (`BRAND.md`: clear space equals the
height of the `T` in Ten).

## 7. LOUPE renders grey, not brass

In the header lockup `LOUPE` is a neutral grey. Per `BRAND.md` it is brass, and with the colon
it is one of only two brass elements in the wordmark. Grey makes the lockup read as a single
flat word instead of name-plus-qualifier.

## 8. Blue dot in the Coverage legend

The `SCORED` legend swatch is system blue — a fourth instance of the E1 violation, in the same
sweep as item 2. The three legend states should be brass (scored), a neutral mid-tone (frames,
unscored) and an outline (empty).

While there: `FRAMES, UNSCORED` is awkward as a label. `UNSCORED` alone is enough.

## 9. `FLAT DIAL-ON` column header wraps badly

The first angle column header breaks across two lines mid-phrase and pushes the header row out
of alignment with the other four. Either shorten the label to `FLAT` (the other four are single
words) or give the five angle columns equal fixed widths so no header wraps.

## 10. Coverage has no empty state

Every one of 119 rows reads `0/5` with five empty cells. The screen is technically correct and
practically useless — it is a wall of nothing, and it is meant to be the most valuable screen in
the app.

When no photo in the collection has an angle tag, replace the matrix with an empty state that
explains why ("No photos have been tagged with an angle yet") and offers the way out: a bulk
angle-tagging entry point into Review. Show the matrix once at least one angle exists.

---

## Not a branding issue, but visible in the same screenshot

`0 of 119 watches have a hero angle` with `595` on the reshoot list means `watch_photos.angle`
was never backfilled — every photo is untagged, so Coverage has nothing to plot. Expected, since
backfill is manual, but Coverage is unusable until some angles exist. Consider a bulk angle-tag
action in Review, or a one-time heuristic pass over existing photos.

---

## Exit checks

- [ ] The mark's six blades are legible at 32px on the light surface
- [ ] `grep -rn "blue-[45]00\|#3b82f6\|text-blue"` returns nothing in app code
- [ ] Global `a` / `a:hover` colours are defined from the palette
- [ ] No link inside the Photo Lab summary statistic
- [ ] Filled brass buttons clear 4.5:1 against their label
- [ ] The colon is visibly brass at 19px
- [ ] `BRAND.md` and the four light-variant SVGs carry the corrected values
- [ ] lint, typecheck, build pass
