import {
  Archive,
  BadgeDollarSign,
  CalendarDays,
  Camera,
  ChartColumn,
  Compass,
  Images,
  Info,
  Link2,
  List,
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

/** No Home item: the wordmark in the rail (and the mark in the collapsed rail
 *  and the header) already navigates to `/dashboard`, and two controls one
 *  above the other going to the same place is one too many. */

/** The five groups with visible headings, in the order they are read.
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
    // Imagery sits directly under the collection: the photography practice is
    // the thing this app is really for, so it outranks the analysis tools.
    heading: "Imagery",
    items: [
      { href: "/photo-lab", label: "Photo Lab", icon: Camera },
      { href: "/inspiration", label: "Inspiration", icon: Images },
      // Batch Import is hidden pending its likely removal. The route still
      // exists and still works if you reach it directly — this only takes it
      // out of the rail, so nothing is deleted while the decision is open.
      // { href: "/batch-import", label: "Batch Import", icon: PackagePlus },
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
    // Phase 5 §3.1: Deals is market-side and lives here.
    heading: "Market",
    items: [
      { href: "/market", label: "Market", icon: TrendingUp },
      { href: "/market/sold", label: "Sold Archive", icon: Archive },
      { href: "/deals", label: "Deals", icon: BadgeDollarSign },
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
