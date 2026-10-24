import type { LucideIcon } from "lucide-react"
import { StatusPill } from "@/components/ui/status-pill"

export interface Feature {
  icon: LucideIcon
  title: string
  text: string
  /** A cost or price note ("Free", "5–15¢ a click") — shown as a neutral pill. */
  cost?: string
}

export interface FeatureSection {
  id: string
  eyebrow: string
  heading: string
  blurb: string
  features: Feature[]
}

/** One About section: eyebrow, heading, blurb, then a two-up grid of feature cards. */
export function FeatureGrid({ section, children }: { section: FeatureSection; children?: React.ReactNode }) {
  return (
    <section id={section.id} className="scroll-mt-20 space-y-4">
      <SectionHeading eyebrow={section.eyebrow} heading={section.heading} blurb={section.blurb} />
      {children}
      <div className="grid gap-3 sm:grid-cols-2">
        {section.features.map((f) => (
          <FeatureCard key={f.title} feature={f} />
        ))}
      </div>
    </section>
  )
}

export function SectionHeading({ eyebrow, heading, blurb }: { eyebrow: string; heading: string; blurb: string }) {
  return (
    <div>
      <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-1 font-display text-md font-semibold tracking-tight">{heading}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{blurb}</p>
    </div>
  )
}

export function FeatureCard({ feature: f }: { feature: Feature }) {
  return (
    <div className="flex gap-3.5 rounded-xl border border-border bg-card p-4 transition-colors duration-150 ease-out hover:border-brass/40">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <f.icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-sm font-semibold">{f.title}</h3>
          {f.cost && <StatusPill>{f.cost}</StatusPill>}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
      </div>
    </div>
  )
}
