import type { Metadata } from "next"
import { CaliberShelfMark } from "@/components/calibershelf-mark"
import { APP_VERSION } from "@/lib/version"
import { getWatches } from "@/lib/queries/watches"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils"
import { AboutStats } from "./_components/about-stats"

export const metadata: Metadata = {
  title: "About CaliberShelf",
}

export const dynamic = "force-dynamic"

interface Feature {
  icon: string
  title: string
  text: string
}
interface Section {
  heading: string
  blurb: string
  features: Feature[]
}

const SECTIONS: Section[] = [
  {
    heading: "The Agent Fleet",
    blurb: "A crew of AI agents does the tedious research so you don't have to — and every one of them shows its work.",
    features: [
      {
        icon: "💰",
        title: "Market Valuation",
        text: "Each month an AI agent researches the real secondary-market value of your flagged watches from sold listings and auctions, and records the estimate with the evidence behind it.",
      },
      {
        icon: "✨",
        title: "Spec Autofill",
        text: "One click web-searches a watch's official specs — dimensions, movement, materials, even its reference number — and fills only the blanks, never overwriting your entries.",
      },
      {
        icon: "🔍",
        title: "Find in Catalog",
        text: "Instant, free spec prefill from a mirrored catalog of thousands of watches — pick your model and its case dimensions drop right into the form.",
      },
      {
        icon: "🏷️",
        title: "Deal Scanner",
        text: "Every day it checks your wish-list watches against each brand's store and flags what's available and at what price. Free — no AI required.",
      },
      {
        icon: "📈",
        title: "Agent Execution Review",
        text: "Total transparency: every agent run is logged with its duration, cost, and a full audit trail of exactly what it changed.",
      },
    ],
  },
  {
    heading: "Built On",
    blurb: "Serious plumbing under a calm surface.",
    features: [
      {
        icon: "📚",
        title: "ChronoScout Catalog",
        text: "A mirrored, weekly-synced catalog of thousands of watches powers instant spec lookups — with its data licensed and attributed properly.",
      },
      {
        icon: "🤖",
        title: "Claude AI",
        text: "Anthropic's Claude models drive every research agent, using live web search and structured, schema-validated output.",
      },
      {
        icon: "🔒",
        title: "Supabase + Vercel",
        text: "Postgres with row-level security, private photo storage, and instant global deploys — your collection, safe and fast.",
      },
    ],
  },
  {
    heading: "Photography & Presentation",
    blurb: "Your watches deserve to look their best — and this is only the beginning.",
    features: [
      {
        icon: "🖼️",
        title: "Smart Photo Handling",
        text: "Drop, drag, or paste a photo and it's optimized right in the browser — even HEIC from an iPhone — then thumbnailed and served at the perfect size.",
      },
      {
        icon: "🔎",
        title: "Gallery & Lightbox",
        text: "Every watch gets a cover shot and a full photo gallery with a crisp, zoomable lightbox.",
      },
      {
        icon: "🎯",
        title: "Dial Framing",
        text: "Fine-tune each dial's focal point and zoom so it's framed just right — and the home screen renders your collection as a living wristwatch dial.",
      },
      {
        icon: "🚀",
        title: "More To Come",
        text: "Richer imagery and presentation are actively in the works — this corner of the app is about to get a lot more beautiful.",
      },
    ],
  },
  {
    heading: "Your Collection, Organized",
    blurb: "A real taxonomy instead of a junk drawer.",
    features: [
      {
        icon: "🧭",
        title: "Three Clean Axes",
        text: "Watches are sorted by design archetype (Dress, Sport, Chronograph, Daily, Horology — categories you control), their complications, and a price tier derived automatically from what you paid. No muddling price with style.",
      },
      {
        icon: "🎚️",
        title: "Tiers On Your Terms",
        text: "Price tiers are derived from purchase price, but the bands are yours — set them under Config → Tiers and every report follows suit.",
      },
      {
        icon: "▣",
        title: "Know Where It Lives",
        text: "Record which case or box in the safe holds each watch. Sort the collection by box to see what's filed and what isn't.",
      },
      {
        icon: "📋",
        title: "Flexible Views",
        text: "Search, filter, and sort across brand, movement, category, label, complication, box, price, and tier — in table or gallery view.",
      },
      {
        icon: "⭐",
        title: "Wish List & Coming Soon",
        text: "Track what you want and what's on the way, kept cleanly separate from your owned collection's counts and value.",
      },
      {
        icon: "📅",
        title: "Wear Log & Timegrapher",
        text: "Log what you actually wear and record timegrapher runs to watch each movement's accuracy over time.",
      },
    ],
  },
  {
    heading: "Insights",
    blurb: "The collection, told back to you.",
    features: [
      {
        icon: "🗺️",
        title: "Collection Map",
        text: "See where your collection is dense and where the gaps are: a size × dial-color grid, distributions, and price scatter plots.",
      },
      {
        icon: "💵",
        title: "Value & Category Reports",
        text: "Watches by category with price subtotals, and valuation runs you can drill into for the evidence behind every estimate.",
      },
      {
        icon: "🛠️",
        title: "Attention Needed",
        text: "A living worklist of watches, brands, and movements missing key details — each linking straight to the fix.",
      },
    ],
  },
]

export default async function AboutPage() {
  const watches = await getWatches()
  const owned = watches.filter((w) => !w.is_wishlist)
  const value = owned.reduce((s, w) => s + (w.purchase_price_cents ?? 0), 0)

  let catalog = 0
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("chronoscout_sync_state")
      .select("watches_count")
      .eq("id", 1)
      .maybeSingle()
    catalog = data?.watches_count ?? 0
  } catch {
    // stats are a flourish — never let a missing sync break the page
  }

  // Watches tracked counts the whole collection — owned, coming soon, AND wish list.
  const collectionValue = value > 0 ? formatCurrency(value, "USD", true) : null

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border px-6 py-12 text-center sm:py-16">
        <div className="mx-auto mb-5 w-fit">
          <CaliberShelfMark size={64} className="rounded-2xl" />
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          CaliberShelf
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          Part collection manager, part private research lab — a personal horology platform
          where a fleet of AI agents handles the busywork and your watches take center stage.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[2px] text-muted-foreground">
          <span className="h-px w-8 bg-border" />
          v{APP_VERSION}
          <span className="h-px w-8 bg-border" />
        </div>
      </section>

      {/* By the numbers */}
      <AboutStats
        watchesTracked={watches.length}
        collectionValue={collectionValue}
        catalogModels={catalog}
        agentCount={6}
      />

      {/* Feature sections */}
      {SECTIONS.map((section) => (
        <section key={section.heading} className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {section.heading}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{section.blurb}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.features.map((f) => (
              <div
                key={f.title}
                className="flex gap-3.5 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brass/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
                  {f.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                    {f.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Footer note */}
      <section className="rounded-2xl border border-dashed border-border px-6 py-6 text-center">
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Built with care for the details: transparent methods over black-box scores, agents
          that flag rather than guess, and every cost shown. A collection, properly kept.
        </p>
      </section>
    </div>
  )
}
