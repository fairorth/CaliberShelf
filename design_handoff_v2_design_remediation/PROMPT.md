# The prompt

Paste this into Claude Code in `c:\Projects\CaliberShelf`. Nothing else is required from
you first — task zero (copying the design system into the repo) is part of the prompt.

---

```
Implement CaliberShelf v2: a design and UI remediation pass from an external design
review. The full spec is in design_handoff_v2_design_remediation/ in this repo.

Read these first, in this order, and follow them:
  design_handoff_v2_design_remediation/README.md
  design_handoff_v2_design_remediation/DECISIONS.md
  design_handoff_v2_design_remediation/00-design-system.md
  design_handoff_v2_design_remediation/04-screen-specs.md

Then execute all three phases in order, unattended:
  01-phase-1-now.md   (5 defect fixes)
  02-phase-2-next.md  (19 findings — follow its stated commit order)
  03-phase-3-photo-lab.md (the Photo Lab + capture rework, including migrations)

Rules for this run:
- Do NOT stop to ask me for approval or design direction. Every open question is already
  answered in DECISIONS.md. If something is genuinely ambiguous, implement the option that
  best satisfies the task's acceptance criteria and note it in your phase summary.
- Task zero, before Phase 1: copy 00-design-system.md into the repo as
  docs/design-system.md, and paste its final "Rules block for root CLAUDE.md" section into
  the root CLAUDE.md under a new "## Design System" heading. Commit that alone.
- One branch per phase (v2/phase-1, v2/phase-2, v2/phase-3), one commit per finding,
  merged to master when that phase's exit checklist passes.
- Bump package.json "version" on every commit, per this repo's convention.
- After every finding: npm run lint && npm run typecheck && npm run build must be clean.
  Use the .claude/skills/verify skill where it applies. Fix forward; never leave a red gate.
- Light mode is supported: verify every screen you touch in BOTH themes before closing a
  finding.
- The three new screens (watch view page, nav rail, Photo Lab Coverage + Review) are
  specified in 04-screen-specs.md with mockups in
  design_handoff_v2_design_remediation/screens/. Build to those specs; do not propose
  alternatives first.
- Migrations follow supabase/CLAUDE.md and .claude/skills/db-migration; regenerate database
  types after each and keep RLS consistent with the existing ownership pattern.
- At the end of each phase, write a short summary: findings landed, files touched,
  migrations added, and anything you deviated from and why. Then continue to the next phase
  without waiting for me.

Start now with task zero.
```

---

## If you'd rather run it phase by phase

Same prompt, but replace the "execute all three phases" block with:

```
Then execute Phase 1 only: design_handoff_v2_design_remediation/01-phase-1-now.md.
Stop after its exit checklist passes and give me the phase summary.
```

…and repeat for `02-` and `03-`. The docs are written so either mode works. One caveat if
you split it: Phase 2's internal commit order matters more than the phase boundary does —
don't reorder within it.

## What you'll want to review afterwards, per phase

- **Phase 1:** try to lose work in the watch form (reload, click away, edit-then-undo);
  set filters, reload, confirm they're gone and that active ones are visible; click a photo
  once.
- **Phase 2:** browse the collection without ever landing in a form; check the rail at
  desktop / tablet / phone widths; flip to light mode on every screen; confirm one accent.
- **Phase 3:** answer "what do I shoot tonight?" from the Coverage screen alone, then shoot
  ten frames of one watch and count your interactions.
