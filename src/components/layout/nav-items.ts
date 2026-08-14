import {
  Archive,
  BadgeDollarSign,
  CalendarDays,
  Camera,
  ChartColumn,
  Compass,
  House,
  Images,
  Info,
  Link2,
  List,
  PackagePlus,
  Settings,
  Tag,
  TrendingUp,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  heading: string
  items: NavItem[]
}

/** Home sits above the groups, ungrouped (04-screen-specs §2). */
export const NAV_HOME: NavItem = { href: "/dashboard", label: "Home", icon: House }

/** The four groups with visible headings, in the mockup's exact order.
 *  Capture is reached inside Photo Lab, never as a rail item (§2). */
export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Collection",
    items: [
      { href: "/collection", label: "Collection", icon: List },
      { href: "/brands", label: "Brands", icon: Tag },
      { href: "/straps", label: "Straps", icon: Link2 },
    ],
  },
  {
    heading: "Analysis",
    items: [
      { href: "/wear-log", label: "Wear Log", icon: CalendarDays },
      { href: "/reports", label: "Reports", icon: ChartColumn },
      { href: "/guides", label: "Guides", icon: Compass },
    ],
  },
  {
    // Phase 5 §3.1: Deals is market-side and moves in here; the imagery tools
    // get their own honest group below. (Both headings are short enough for
    // the rail's 175px — the old "Acquisition & Imagery" needed 191px and
    // wrapped, which is why that combined group is gone.)
    heading: "Market",
    items: [
      { href: "/market", label: "Market", icon: TrendingUp },
      { href: "/market/sold", label: "Sold Archive", icon: Archive },
      { href: "/deals", label: "Deals", icon: BadgeDollarSign },
    ],
  },
  {
    heading: "Imagery",
    items: [
      { href: "/photo-lab", label: "Photo Lab", icon: Camera },
      { href: "/inspiration", label: "Inspiration", icon: Images },
      { href: "/batch-import", label: "Batch Import", icon: PackagePlus },
    ],
  },
  {
    heading: "System",
    items: [
      { href: "/config", label: "Config", icon: Settings },
      { href: "/about", label: "About", icon: Info },
    ],
  },
]

/** Active-state test: exact for Home; prefix otherwise. The Collection item
 *  also claims watch detail pages, which are reached from the collection. */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard"
  // Exact, so the Sold Archive child route doesn't also light up its parent.
  if (href === "/market") return pathname === "/market"
  if (href === "/collection") {
    return (
      pathname.startsWith("/collection") ||
      pathname.startsWith("/watch") ||
      pathname.startsWith("/category") ||
      pathname.startsWith("/add")
    )
  }
  return pathname === href || pathname.startsWith(href + "/")
}
