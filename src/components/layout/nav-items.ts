import {
  BadgeDollarSign,
  CalendarDays,
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
 *  Photo Lab joins Acquisition & Imagery when the route lands (Phase 3). */
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
    heading: "Acquisition & Imagery",
    items: [
      { href: "/deals", label: "Deals", icon: BadgeDollarSign },
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
