import { ChevronRight } from "lucide-react"

const STEPS: { name: string; text: string }[] = [
  { name: "Coverage", text: "Which watch, which angle — worst first" },
  { name: "Session", text: "One folder per watch, path ready to paste" },
  { name: "Capture", text: "Tethered R10 + RF 100mm macro, focus-stacked" },
  { name: "Score", text: "Free CV triage, AI grading on the survivors" },
  { name: "Review", text: "Keyboard-fast: tag, accept, set cover" },
]

/** The studio route a photograph travels, camera to watch page (photo-lab-app.md §1). */
export function PhotoPipeline() {
  return (
    <ol className="grid gap-2 rounded-xl border border-border bg-surface-rail p-3 sm:grid-cols-5">
      {STEPS.map((s, i) => (
        <li key={s.name} className="relative rounded-lg bg-card px-3 py-2.5">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            {String(i + 1).padStart(2, "0")}
          </p>
          <p className="text-xs font-semibold text-foreground">{s.name}</p>
          <p className="mt-0.5 text-2xs leading-relaxed text-muted-foreground">{s.text}</p>
          {i < STEPS.length - 1 && (
            <ChevronRight
              className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground sm:block"
              aria-hidden="true"
            />
          )}
        </li>
      ))}
    </ol>
  )
}
