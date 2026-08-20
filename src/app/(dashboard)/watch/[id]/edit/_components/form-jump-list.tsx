"use client"

/**
 * Section navigation for the edit form (Phase 9 §3.6).
 *
 * This is the longest form in the app — Identity, Ownership, Market,
 * Specifications, Timegrapher, Photos — and it is one the user moves through
 * often. The card-per-section structure already implied a jump list; nothing
 * new needed inventing, only exposing.
 *
 * It rides in the sticky left column, so it stays put while the form scrolls.
 * Plain anchors: the cards carry real ids, so this needs no scroll observer
 * and keeps working if the form is reordered.
 */

const SECTIONS = [
  { id: "identity", label: "Identity" },
  { id: "ownership", label: "Ownership" },
  { id: "market", label: "Market" },
  { id: "specifications", label: "Specifications" },
  { id: "labels", label: "Labels" },
  { id: "timegrapher", label: "Timegrapher" },
  { id: "photos", label: "Photos" },
] as const

export function FormJumpList() {
  return (
    <nav aria-label="Form sections" className="hidden lg:block">
      <p className="px-2.5 pb-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        Sections
      </p>
      <ul className="flex flex-col">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={(e) => {
                // Smooth, and without pushing a hash onto history for every
                // glance at a section.
                const target = document.getElementById(s.id)
                if (!target) return
                e.preventDefault()
                target.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
              className="block rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
