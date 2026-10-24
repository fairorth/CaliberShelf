import type { Metadata } from "next"
import {
  Activity,
  Aperture,
  Archive,
  BadgeDollarSign,
  BookOpen,
  Bot,
  CalendarCheck,
  CalendarDays,
  Camera,
  ChartLine,
  CirclePlus,
  Compass,
  Crosshair,
  Download,
  FileText,
  Focus,
  Gauge,
  Hash,
  LayoutGrid,
  Lightbulb,
  Link2,
  Lock,
  Map as MapIcon,
  Presentation,
  Receipt,
  RefreshCw,
  RotateCcw,
  Scale,
  ScanEye,
  ScanSearch,
  ScanText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Table2,
  Tag,
  Target,
  Upload,
  Watch,
  Wrench,
} from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { localDateIso } from "@/lib/dates"
import { getAboutCounts } from "@/lib/queries/about"
import { getPortfolioOverview, valueMixLabel } from "@/lib/queries/portfolio"
import { getRatingsReport } from "@/lib/queries/ratings"
import { getWatches } from "@/lib/queries/watches"
import type { WatchWithCover } from "@/lib/types/watch"
import { formatCurrency } from "@/lib/utils"
import { APP_VERSION } from "@/lib/version"
import { AboutStats, type AboutStat } from "./_components/about-stats"
import { FeatureCard, FeatureGrid, SectionHeading, type Feature, type FeatureSection } from "./_components/feature-grid"
import { PhotoPipeline } from "./_components/photo-pipeline"
import { RateGameSpotlight, type CrowdFavourite } from "./_components/rate-game-spotlight"
import { ShowModeSpotlight } from "./_components/show-mode-spotlight"
import type { ShowcaseWatch } from "./_components/showcase-watch"

export const metadata: Metadata = {
  title: "About TenTenLoupe",
}

export const dynamic = "force-dynamic"

// ── The pocket: TenTen for iPhone ────────────────────────────────
// Rate My Watches and Show mode get spotlights of their own; these are the rest.
const IPHONE_FEATURES: Feature[] = [
  {
    icon: ScanEye,
    title: "Identify",
    text: "“Which of my watches is this?” Take one photo and in about eight seconds you get up to three matches from your own collection, each with a confidence level and a one-line reason (“green dial, date at 3”). Then log the wear, photograph it, or add it if it’s new.",
    cost: "A few cents",
  },
  {
    icon: Focus,
    title: "A Camera That Knows Dials",
    text: "A live sharpness ring sits over the dial: solid white when it’s sharp, dashed amber when it’s soft, measured on every preview frame with the same maths as the studio scorer. Press early and the shutter waits for focus. It switches to the macro lens automatically when you get close.",
  },
  {
    icon: CirclePlus,
    title: "Box to Saved in a Minute",
    text: "A new arrival goes in from the camera: photo, brand, model, reference, category, price, tax, import fees, purchase date and storage box. The deeper specs can wait for the desk.",
  },
  {
    icon: CalendarCheck,
    title: "Today",
    text: "Log what’s on the wrist and how it feels (Loved it · Fine · Meh). Tap a recent photo to log a wear, or fill in a forgotten day on the This Week strip. Dated by your local day, never the server’s clock.",
  },
  {
    icon: RotateCcw,
    title: "The Caseback Run",
    text: "The game shows each watch’s caseback under its dial, so the Rate tab counts watches still missing a caseback photo and walks you through them one after another in the camera.",
  },
  {
    icon: ShieldCheck,
    title: "Private by Design",
    text: "An optional Face ID lock. Prices hidden by default for shows and meet-ups. One switch hides your keep-or-sell judgements before you hand the phone to someone to browse.",
  },
  {
    icon: LayoutGrid,
    title: "The Collection, Pocket-Sized",
    text: "A searchable photo grid and a watch card with a swipeable gallery. The card also carries the attachment and keep-or-sell judgements that feed The Edit on the web.",
  },
  {
    icon: Download,
    title: "Offline First, Always Current",
    text: "Wears, ratings and photos made without signal wait in a queue and send themselves later. Small updates arrive over the air with a “Restart to update” banner.",
  },
]

// ── The desk: the web app ────────────────────────────────────────
const COLLECTION: FeatureSection = {
  id: "collection",
  eyebrow: "On the web · the desk",
  heading: "Your Collection, Properly Kept",
  blurb: "Catalogue, browse and live with the collection. A real taxonomy, not a junk drawer.",
  features: [
    {
      icon: Presentation,
      title: "The Light Table",
      text: "The home page is a photo stage to leave running on a screen. Watches rotate on a glow made from the photo itself, never a crop. Hover for a 2.4× loupe. The film strip shows each watch’s five angles, and a missing one links straight to the Photo Lab.",
    },
    {
      icon: Table2,
      title: "Table or Tiles",
      text: "Choose and resize your columns, filter by anything from movement to storage box, and sort by wear count, attachment, value or gain. Filters live in the web address, so a view survives a trip into a watch and back. Export exactly what’s on screen to CSV.",
    },
    {
      icon: Watch,
      title: "The Watch Page",
      text: "A gallery with a zoomable lightbox, wear history, the strap currently fitted and a timegrapher log (rate, amplitude, beat error, with the lift angle to set up the machine). Plus one-press “Wore today”.",
    },
    {
      icon: Sparkles,
      title: "Add Fast, Fill Smart",
      text: "Quick add needs only brand, model and category. Then 🔍 fills case dimensions free from a licensed catalog of ~9,300 models, and ✨ fills the rest from the official spec sheet. Both fill blanks only; a guessed reference stays ⚠ unverified until you confirm it.",
    },
    {
      icon: Compass,
      title: "Three Clean Axes",
      text: "Category is design (Dress, Sport, Chronograph, Tool / Field, Horology). Complications are what the movement does. Tier is a price band from what you paid, in bands you define. The three are never mixed.",
    },
    {
      icon: BookOpen,
      title: "Collection Guides",
      text: "A story-driven collecting plan in chapters, each with a reference, its place in history, a target price and a priority. A thesis acts as the stopping rule. The Collection Spine shows what’s owned, coming, wanted or passed.",
    },
    {
      icon: CalendarDays,
      title: "Wear Log",
      text: "Calendar, history, streaks, most and least worn. Each wear’s Loved it · Fine · Meh becomes real data for deciding what stays.",
    },
    {
      icon: Archive,
      title: "Boxes & Straps",
      text: "Know which box in the safe holds each watch, and keep a strap drawer that knows what’s mounted where.",
    },
  ],
}

const MARKET: FeatureSection = {
  id: "market",
  eyebrow: "On the web · the money side",
  heading: "Market & The Edit",
  blurb: "What it’s worth, what it cost, and the hardest question in collecting: which ones go?",
  features: [
    {
      icon: Scale,
      title: "The Edit",
      text: "Five steps to decide what to sell. Sort into floor piles, rate attachment with no prices on screen, settle look-alike head-to-heads, then drag “Keep N of M” and watch the sell list re-form live. Money is not an input: value decides the order you sell in, never whether.",
    },
    {
      icon: Target,
      title: "To Sell",
      text: "Set a goal and what it’s for. One bar stacks money already realised, current listings and decided-but-unlisted watches, each at its true amount after fees, and suggests which Maybes would close the gap.",
    },
    {
      icon: BadgeDollarSign,
      title: "Financials, With Receipts",
      text: "Cost basis itemised: price, sales tax, import fees, shipping. Current value says where it came from: Researched, Logged or Static. “Check price now” runs a minute of live market research, then shows its evidence and every search it made.",
    },
    {
      icon: ChartLine,
      title: "Market Overview",
      text: "Portfolio value over time against a cost-basis line, unrealised and realised gain, a sales pipeline, and an attention list for stale valuations and listings. The Sold Archive keeps every sale’s holding period and fees.",
    },
    {
      icon: Gauge,
      title: "Watch Values",
      text: "Every held watch’s value, the source behind it, gain against cost and movement since last time. A per-row switch enrols a watch in monthly AI research.",
    },
    {
      icon: Receipt,
      title: "Ready for Tax Time",
      text: "An Annual Summary laid out for the tax preparer on letter paper, profit and loss by year, and a printable insurance schedule with CSV and PDF export.",
    },
  ],
}

const PHOTO_LAB: FeatureSection = {
  id: "photo-lab",
  eyebrow: "Photography · the heart of it",
  heading: "The Photo Lab",
  blurb: "Ten past ten is the hand position every watch photo uses; the loupe is the watchmaker’s magnifier. Photography is in the name, and here it’s a whole studio workflow, not an upload button.",
  features: [
    {
      icon: Camera,
      title: "A Documented Studio",
      text: "A saved camera preset, a four-switch lens pre-flight, a working-distance table, in-camera focus stacking, and a recipe for the laid-down hero shot: landscape, strap in a lazy S, crown to camera, hands at 10:10.",
    },
    {
      icon: ScanSearch,
      title: "Triage That Costs Pennies",
      text: "Free computer vision measures sharpness and glare, finds near-duplicates, and folds a 30-frame focus stack into its composite. Only the survivors go to AI grading. A whole session costs about two cents, and nothing is ever deleted.",
    },
    {
      icon: Upload,
      title: "Accepting Is Publishing",
      text: "One key in Review reads the RAW, renders a 2000-pixel JPEG, uploads it with a thumbnail, records its true dimensions, tags the angle and, if you like, makes it the cover.",
    },
    {
      icon: Crosshair,
      title: "The Frame Fits the Photograph",
      text: "Wherever the photo is the point, it’s shown whole. The watch page sizes the hero to the photo’s real shape, the Light Table lands on the widest frame, and tiles choose the frame closest to square.",
    },
    {
      icon: Aperture,
      title: "One Vocabulary of Angles",
      text: "Flat · Hero · Profile · Caseback · Macro, the same everywhere: the film strip, the lightbox, the phone camera and the 1–5 keys. The Coverage grid makes them a shot list.",
    },
    {
      icon: Lightbulb,
      title: "Inspiration",
      text: "A photography mood board of shots worth learning from, beside the Admired board of watches seen at shows.",
    },
  ],
}

const AGENTS: FeatureSection = {
  id: "agents",
  eyebrow: "Automation · with receipts",
  heading: "The Agent Fleet",
  blurb: "A crew of AI agents does the tedious research. They fill blanks, flag guesses, never overwrite you, and show what every run cost.",
  features: [
    {
      icon: BadgeDollarSign,
      title: "Market Valuation",
      text: "Researches what a watch actually sells for, favouring sold prices over asking prices: a low–mid–high range with a confidence level and evidence. Monthly in depth, or on demand in about a minute.",
      cost: "~$1–1.50 a watch",
    },
    {
      icon: Sparkles,
      title: "Spec Autofill",
      text: "Finds the official spec sheet and fills only the empty fields, highlighting what it filled and listing its sources.",
      cost: "5–15¢ a click",
    },
    {
      icon: ScanEye,
      title: "Watch Identify",
      text: "Recognises which of your own watches is in a phone photo, down to sibling versions of the same model.",
      cost: "A few cents",
    },
    {
      icon: ScanText,
      title: "Sign & Placard Reader",
      text: "Reads a vendor’s sign at a show to name the booth, and a display placard to pull out maker, model, reference and the price exactly as printed.",
      cost: "A few cents",
    },
    {
      icon: Hash,
      title: "Reference Finder",
      text: "Finds missing reference numbers across the collection, every one flagged for you to verify.",
      cost: "~44¢ a watch",
    },
    {
      icon: Link2,
      title: "Store-Link Finder",
      text: "Finds each brand’s official online store and whether it’s a major, a micro or an independent.",
      cost: "~14¢ a brand",
    },
    {
      icon: Tag,
      title: "Deal Scanner",
      text: "Checks every wish-list watch against the brand’s own store each day: Available now, Pre-order or Sold out.",
      cost: "Free",
    },
    {
      icon: RefreshCw,
      title: "Catalog Sync",
      text: "Mirrors a licensed catalog of thousands of watches each week, so spec lookups are instant and free.",
      cost: "Free",
    },
    {
      icon: Aperture,
      title: "Photo Grader",
      text: "Grades studio frames against a shot list: pass or fail with the defect named in six words or fewer, never an aesthetic score.",
      cost: "~0.15¢ a frame",
    },
    {
      icon: Activity,
      title: "Agent Execution Review",
      text: "Every run any agent has ever made, with its cost, duration, tokens, searches and a full audit trail of what it changed.",
    },
  ],
}

const REPORTS: FeatureSection = {
  id: "reports",
  eyebrow: "Analysis",
  heading: "Insights",
  blurb: "The collection, told back to you.",
  features: [
    {
      icon: MapIcon,
      title: "Collection Map",
      text: "A size × dial-colour heatmap and a diameter × thickness scatter that reveals your comfort zone, and the gaps in it.",
    },
    {
      icon: Wrench,
      title: "Attention Needed",
      text: "A to-do list of missing details, each linking to its fix, until it reads ALL CLEAR.",
    },
    {
      icon: Smartphone,
      title: "Ratings",
      text: "The consensus across every friend who has played Rate My Watches, the most divisive watches, and whether each lead is clear or close.",
    },
    {
      icon: FileText,
      title: "Valuations, Sales & More",
      text: "Each research run with its evidence, sales by year, the collection by category and by box, and a brand wish list with models that fit your usual size.",
    },
  ],
}

const BUILT_ON: Feature[] = [
  {
    icon: Bot,
    title: "Claude AI",
    text: "Anthropic’s Claude models power every research agent and the phone’s vision features, using live web search and schema-validated output.",
  },
  {
    icon: Smartphone,
    title: "Expo & React Native",
    text: "A native iPhone app that shares its rules with the web from the same source files.",
  },
  {
    icon: Lock,
    title: "Supabase + Vercel",
    text: "Postgres with row-level security, private photo storage, and instant global deploys.",
  },
  {
    icon: BookOpen,
    title: "ChronoScout Catalog",
    text: "A licensed, weekly-synced catalog of thousands of watches, attributed properly.",
  },
]

const PRINCIPLES: { title: string; text: string }[] = [
  { title: "Every fact has one home", text: "So no two screens can ever disagree." },
  { title: "AI assists, never authors", text: "It fills only blanks, flags its guesses, and shows its receipts." },
  { title: "Money informs, never decides", text: "The engine that suggests what to sell doesn’t use price." },
  { title: "The frame fits the photograph", text: "A watch photo is shown whole." },
]

export default async function AboutPage() {
  const [watches, portfolio, counts, ratings] = await Promise.all([
    getWatches(),
    getPortfolioOverview(),
    getAboutCounts(),
    getRatingsReport(),
  ])
  const byId = new Map(watches.map((w) => [w.id, w]))

  // Owned, unsold watches with photos in a daily order (seeded by the date, so
  // a refresh doesn't reshuffle mid-visit) — the duel mock's fallback pair.
  const today = localDateIso()
  const shelf = watches
    .filter((w) => !w.is_wishlist && w.sale_status !== "sold" && w.cover_photo_url)
    .map((w) => ({ w, k: seededRank(w.id, today) }))
    .sort((a, b) => a.k - b.k)
    .map(({ w }) => toShowcase(w))

  // The crowd's #1 in each Type segment, live from the Ratings consensus.
  const favourites: CrowdFavourite[] = ratings.consensus
    .filter((c) => c.scheme === "type")
    .flatMap((c) => {
      const top = byId.get(c.ranking[0]?.watchId ?? "")
      return top ? [{ segmentName: c.segmentName, raterCount: c.raterCount, watch: toShowcase(top) }] : []
    })
    .slice(0, 5)

  // The duel mock: the two front-runners of the first consensus segment when
  // there is one (a real close call), else two watches from today's shelf.
  const consensusPair = (ratings.consensus[0]?.ranking ?? [])
    .map((r) => byId.get(r.watchId))
    .filter((w): w is WatchWithCover => Boolean(w?.cover_photo_url))
    .slice(0, 2)
    .map(toShowcase)
  const duelPair = consensusPair.length === 2 ? consensusPair : shelf.slice(0, 2)
  const duel: [ShowcaseWatch, ShowcaseWatch] | null = duelPair.length === 2 ? [duelPair[0], duelPair[1]] : null

  const ownedCount = watches.filter((w) => !w.is_wishlist && w.sale_status !== "sold").length
  const wishCount = watches.filter((w) => w.is_wishlist).length
  const stats: AboutStat[] = [
    {
      label: "Watches tracked",
      value: watches.length.toLocaleString(),
      detail: `${ownedCount} held${wishCount > 0 ? ` · ${wishCount} wished` : ""}`,
    },
  ]
  if (portfolio.currentValueCents > 0) {
    stats.push({
      label: "Collection value",
      value: formatCurrency(portfolio.currentValueCents, "USD", true),
      detail: valueMixLabel(portfolio),
    })
  }
  if (counts.photos > 0) stats.push({ label: "Photographs", value: counts.photos.toLocaleString() })
  if (counts.wears > 0) stats.push({ label: "Wears logged", value: counts.wears.toLocaleString() })
  if (counts.duelPicks > 0) {
    stats.push({
      label: "Duel picks",
      value: counts.duelPicks.toLocaleString(),
      detail: counts.friendRaters > 0 ? `${counts.friendRaters} ${counts.friendRaters === 1 ? "friend has" : "friends have"} played` : undefined,
    })
  }
  if (counts.admiredWatches > 0) {
    stats.push({
      label: "Admired at shows",
      value: counts.admiredWatches.toLocaleString(),
      detail: counts.showVendors > 0 ? `${counts.showVendors} booths` : undefined,
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-16">
      {/* Hero */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="px-6 py-12 text-center sm:py-16">
          {/* The real lockup, not the mark beside plain text — this is the one
              screen that is purely about the brand. aria-label carries the
              product name: BRAND.md forbids "Ten:Ten Loupe" in alt text. */}
          <h1 className="mx-auto mb-5 w-fit" aria-label="TenTenLoupe">
            <Logo orientation="stacked" markSize={64} />
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
            A collector’s workbench for mechanical watches. The <span className="text-foreground">desk</span> on the
            web, where you catalogue, photograph, research and decide. The <span className="text-foreground">pocket</span>{" "}
            on your iPhone, for everything you do with a watch in your hand.
          </p>
          <nav aria-label="On this page" className="mt-5 flex flex-wrap justify-center gap-2">
            {[
              { href: "#iphone", label: "On your phone" },
              { href: "#collection", label: "At your desk" },
              { href: "#photo-lab", label: "Photo Lab" },
              { href: "#agents", label: "Agents" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-1 text-xs text-muted-foreground ring-1 ring-border transition-colors duration-150 ease-out hover:text-foreground hover:ring-brass/45"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 flex items-center justify-center gap-2 font-mono text-2xs uppercase tracking-[2px] text-muted-foreground">
            <span className="h-px w-8 bg-border" />v{APP_VERSION}
            <span className="h-px w-8 bg-border" />
          </div>
        </div>
      </section>

      <AboutStats stats={stats} />

      {/* The pocket */}
      <section id="iphone" className="scroll-mt-20 space-y-4">
        <SectionHeading
          eyebrow="On your iPhone · the pocket"
          heading="TenTen for iPhone"
          blurb="A native, camera-first app for everything you do with a watch in your hand. It shares one account and one set of rules with the web: a wear logged on the phone is on the web calendar a second later."
        />
        <RateGameSpotlight duel={duel} favourites={favourites} friendCount={counts.friendRaters} />
        <ShowModeSpotlight
          admiredWatches={counts.admiredWatches}
          vendors={counts.showVendors}
          shows={counts.shows}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {IPHONE_FEATURES.map((f) => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>
      </section>

      <FeatureGrid section={COLLECTION} />
      <FeatureGrid section={MARKET} />
      <FeatureGrid section={PHOTO_LAB}>
        <PhotoPipeline />
      </FeatureGrid>
      <FeatureGrid section={AGENTS} />
      <FeatureGrid section={REPORTS} />

      <section className="space-y-4">
        <SectionHeading eyebrow="Under the hood" heading="Built On" blurb="Serious plumbing under a calm surface." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BUILT_ON.map((f) => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="rounded-xl border border-dashed border-border px-6 py-8">
        <p className="text-center font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
          The principles
        </p>
        <ul className="mt-4 grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p) => (
            <li key={p.title}>
              <p className="font-display text-md font-semibold tracking-tight">{p.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-sm text-muted-foreground">A collection, properly kept.</p>
      </section>
    </div>
  )
}

function toShowcase(w: WatchWithCover): ShowcaseWatch {
  return { id: w.id, name: `${w.brand.name} ${w.nickname || w.model}`, photoUrl: w.cover_photo_url }
}

/** A stable per-day ordering: FNV-1a over id + date. */
function seededRank(id: string, day: string): number {
  let h = 0x811c9dc5
  for (const ch of id + day) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
