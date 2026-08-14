import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format cents (BIGINT) to a display currency string.
 * Example: formatCurrency(15000, "USD") => "$150.00"
 * Pass wholeDollars for summary stats: formatCurrency(1522550, "USD", true) => "$15,226"
 */
export function formatCurrency(
  cents: number,
  currency: string = "USD",
  wholeDollars = false
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    ...(wholeDollars ? { maximumFractionDigits: 0 } : {}),
  }).format(cents / 100)
}

/**
 * Convert a dollar amount to cents for database storage.
 * Example: dollarsToCents(150.00) => 15000
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Hold period for display: "18d" · "11m" · "2y 3m". Takes whole days (from
 * daysBetween) so the arithmetic stays in one place; returns "—" when the
 * purchase date is unknown.
 */
export function formatHoldDays(days: number | null | undefined): string {
  if (days == null || days < 0) return "—"
  if (days < 31) return `${days}d`
  const months = Math.floor(days / 30.44)
  if (months < 12) return `${months}m`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}m` : `${years}y`
}
