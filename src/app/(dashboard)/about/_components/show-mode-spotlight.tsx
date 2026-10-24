import Link from "next/link"
import { CloudOff, ScanText, Store, ZoomIn } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Show mode, told as a spotlight: the vendor-first capture flow of the phone
 * camera at a watch fair (v1.11.23), drawn as the real controls — shot type
 * chips, "+ Watch", "Next vendor →" — with the live tally of what has been
 * admired so far when there is any.
 */
export function ShowModeSpotlight({
  admiredWatches,
  vendors,
  shows,
}: {
  admiredWatches: number
  vendors: number
  shows: number
}) {
  const tally = [
    admiredWatches > 0 ? `${admiredWatches.toLocaleString()} ${admiredWatches === 1 ? "watch" : "watches"} admired` : null,
    vendors > 0 ? `${vendors.toLocaleString()} ${vendors === 1 ? "booth" : "booths"}` : null,
    shows > 0 ? `${shows} ${shows === 1 ? "show" : "shows"}` : null,
  ].filter(Boolean)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[300px_1fr]">
        <CameraMock />

        <div className="space-y-4">
          <div>
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              For watch fairs
            </p>
            <h3 className="mt-1 font-display text-md font-semibold tracking-tight">Show mode</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              At a show you walk from booth to booth, so the camera does too. Switch on “At a watch show”, name the
              event, and the camera starts capturing <span className="text-foreground">Admired</span> watches:
              pieces you love seeing in the metal but don’t mean to own. They stay off the wish list on purpose:
              no deal alerts, no totals.
            </p>
          </div>

          <ul className="grid gap-2.5 sm:grid-cols-2">
            <Point
              icon={Store}
              title="Booth by booth"
              text="Shoot each watch, then the booth and the maker’s sign. + Watch stays at the same booth; Next vendor moves on. Booths are numbered by visit until they have a name."
            />
            <Point
              icon={ScanText}
              title="It reads the sign"
              text="Shoot a vendor’s sign, banner or card as a Name frame and the AI reads the maker’s name off it, without overwriting a name you typed."
            />
            <Point
              icon={CloudOff}
              title="Made for halls with no signal"
              text="Every frame is saved on the phone first and sent when there’s signal. A frame is only deleted once the server confirms it, and resends never create duplicates."
            />
            <Point
              icon={ZoomIn}
              title="Review before you leave"
              text="Browse booth by booth, pinch to 5× on the full-size original to check sharpness, move a frame to another watch, or go back and shoot more."
            />
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              {tally.length > 0 ? `So far · ${tally.join(" · ")}` : "Ready for the next show"}
            </p>
            <Link href="/inspiration?tab=admired" className="text-xs font-medium text-brass hover:underline">
              Open the Admired board →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Point({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <li className="flex gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-2xs leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </li>
  )
}

/** The Show-mode camera, drawn: viewfinder with the sharpness ring, shot types, next steps. */
function CameraMock() {
  return (
    <figure
      className="order-last mx-auto w-full max-w-[300px] self-center rounded-xl border border-border bg-surface-rail p-3 shadow-sm lg:order-first"
      aria-label="The Show mode camera controls"
    >
      <div className="flex items-center justify-between font-mono text-2xs uppercase tracking-wide text-muted-foreground">
        <span>Booth 7 · Watch 2</span>
        <span>Sharp</span>
      </div>
      <div className="relative mt-2 flex aspect-[4/3] items-center justify-center rounded-xl bg-surface-photo">
        {/* The live dial-sharpness ring: solid when the dial is sharp. */}
        <span className="h-28 w-28 rounded-full border-2 border-foreground/60" aria-hidden="true" />
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden="true">
        {["Watch", "Booth", "Name"].map((k, i) => (
          <span
            key={k}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-2xs font-medium",
              i === 0 ? "bg-brass text-brass-foreground" : "text-muted-foreground ring-1 ring-border"
            )}
          >
            {k}
          </span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-[auto_1fr] gap-1.5" aria-hidden="true">
        <span className="rounded-lg px-3 py-1.5 text-center text-2xs font-medium text-muted-foreground ring-1 ring-border">
          + Watch
        </span>
        <span className="rounded-lg bg-brass px-3 py-1.5 text-center text-2xs font-medium text-brass-foreground">
          Next vendor →
        </span>
      </div>
      <figcaption className="mt-2 text-center text-2xs text-muted-foreground">
        Saved on the phone · sends when there’s signal
      </figcaption>
    </figure>
  )
}
