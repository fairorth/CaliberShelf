import { guideEntryStatus } from "@/lib/types/guide"
import type { GuideEntryWithWatch } from "@/lib/types/guide"

// The Collection Spine — the guide's chapters as a horizontal timeline.
// Entries are position-ordered (chronological by design), spaced equally so
// vintage clusters (six chapters in 1966-69) never collide. Owned chapters
// glow brass; the gaps stay dark until they're filled.

const GAP = 72
const PAD = 40
const LINE_Y = 62
const H = 132

const NODE_CLASS: Record<string, { fill: string; r: number; opacity?: number }> = {
  owned: { fill: "var(--brass, #c9a25e)", r: 8 },
  coming_soon: { fill: "#fbbf24", r: 6.5 },
  wishlist: { fill: "#38bdf8", r: 6.5 },
  candidate: { fill: "currentColor", r: 5, opacity: 0.35 },
  passed: { fill: "currentColor", r: 4, opacity: 0.15 },
}

export function GuideSpine({ entries }: { entries: GuideEntryWithWatch[] }) {
  if (entries.length === 0) return null
  const width = PAD * 2 + (entries.length - 1) * GAP

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card/50 py-2">
        <svg
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          className="text-muted-foreground"
          role="img"
          aria-label="Collection spine timeline"
        >
          {/* baseline */}
          <line
            x1={PAD}
            y1={LINE_Y}
            x2={width - PAD}
            y2={LINE_Y}
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeWidth={2}
          />
          {entries.map((e, i) => {
            const x = PAD + i * GAP
            const status = guideEntryStatus(e)
            const node = NODE_CLASS[status] ?? NODE_CLASS.candidate
            const owned = status === "owned"
            return (
              <g key={e.id}>
                {/* year above */}
                <text
                  x={x}
                  y={30}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize={10}
                  fill="currentColor"
                  fillOpacity={owned ? 0.95 : 0.55}
                >
                  {e.year_from ?? ""}
                </text>
                {/* tick + node */}
                <line
                  x1={x}
                  y1={LINE_Y - 12}
                  x2={x}
                  y2={LINE_Y + 12}
                  stroke="currentColor"
                  strokeOpacity={0.15}
                />
                {owned && (
                  <circle cx={x} cy={LINE_Y} r={12} fill="var(--brass, #c9a25e)" fillOpacity={0.18} />
                )}
                <circle
                  cx={x}
                  cy={LINE_Y}
                  r={node.r}
                  fill={node.fill}
                  fillOpacity={node.opacity ?? 1}
                />
                {/* reference below */}
                <text
                  x={x}
                  y={LINE_Y + 32}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize={9}
                  fill="currentColor"
                  fillOpacity={owned ? 0.9 : 0.5}
                >
                  {e.reference_number ?? e.title.slice(0, 10)}
                </text>
                {/* priority under reference for the hunt targets */}
                {status === "candidate" && e.priority != null && e.priority >= 9 && (
                  <text
                    x={x}
                    y={LINE_Y + 48}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--brass, #c9a25e)"
                    fillOpacity={0.9}
                  >
                    ★ {e.priority}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted-foreground">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-brass align-middle" /> Owned</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400 align-middle" /> Coming soon</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-sky-400 align-middle" /> Wish list</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-muted-foreground/40 align-middle" /> Candidate</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-muted-foreground/20 align-middle" /> Passed</span>
        <span className="text-brass">★ top-priority gap</span>
      </div>
    </div>
  )
}
