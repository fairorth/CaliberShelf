/**
 * Calendar dates as the OWNER experiences them — the device's local day, as
 * "YYYY-MM-DD". Pure, and shared with the iPhone app.
 *
 * Never derive a wear's date with `toISOString().slice(0, 10)`: that is the
 * UTC day, so a US evening wear landed on tomorrow (mobile-app.md B1). And
 * never derive "today" on the server for a wear — the server's clock is UTC
 * and knows nothing of where the watch is; the client sends its local date.
 */

/** The local calendar day of `d` (default: now) as YYYY-MM-DD. */
export function localDateIso(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Whether a client-supplied "today" is plausible: a real YYYY-MM-DD within a
 * day of the UTC date. Every timezone on Earth is within ±14h of UTC, so a
 * genuine local today is always UTC-yesterday, -today or -tomorrow.
 */
export function isPlausibleLocalToday(iso: string, now: Date = new Date()): boolean {
  if (!ISO_DATE.test(iso)) return false
  const t = Date.parse(`${iso}T00:00:00Z`)
  if (Number.isNaN(t)) return false
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.abs(t - utcMidnight) <= 86_400_000
}
