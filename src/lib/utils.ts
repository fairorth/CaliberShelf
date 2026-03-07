import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format cents (BIGINT) to a display currency string.
 * Example: formatCurrency(15000, "USD") => "$150.00"
 */
export function formatCurrency(cents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100)
}

/**
 * Convert a dollar amount to cents for database storage.
 * Example: dollarsToCents(150.00) => 15000
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}
