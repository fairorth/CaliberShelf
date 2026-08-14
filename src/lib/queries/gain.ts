// Pure gain arithmetic — the ONE implementation, re-exported by
// src/lib/queries/sales.ts and portfolio.ts (the two files all gain numbers
// come from). It lives in its own module only so client components (the
// Record-sale ledger, which recomputes as you type) can import it without
// dragging in the server Supabase client. No other file may do gain math.
//
// The "—" rule: a watch with no purchase price has a meaningless basis
// (the generated column coalesces it to 0), so every gain figure for it is
// null and the UI renders "—" — never 0, never +100%, never ∞.

export interface GainFigure {
  cents: number
  /** vs cost basis; null when the basis is 0 (a percent would be ∞). */
  pct: number | null
}

interface BasisFields {
  cost_basis_cents: number
  purchase_price_cents: number | null
}

/**
 * Gain of a value (a latest valuation mid, or a sale's net proceeds) versus
 * the watch's stored cost basis. Realized and unrealized gain are the same
 * arithmetic — only the value differs. Returns null when the purchase price
 * is unknown.
 */
export function gainVersusBasis(
  valueCents: number,
  watch: BasisFields
): GainFigure | null {
  if (watch.purchase_price_cents == null) return null
  const cents = valueCents - watch.cost_basis_cents
  const pct =
    watch.cost_basis_cents > 0 ? (cents / watch.cost_basis_cents) * 100 : null
  return { cents, pct }
}

/**
 * Portfolio-level gain: sums value − basis over the pairs where the purchase
 * price is known (unknown-basis watches are excluded from the delta — their
 * value may still appear in a total, but they cannot contribute a gain).
 * Returns null when no pair is computable.
 */
export function aggregateGain(
  pairs: Array<{ valueCents: number; watch: BasisFields }>
): GainFigure | null {
  let gainCents = 0
  let basisCents = 0
  let n = 0
  for (const { valueCents, watch } of pairs) {
    const g = gainVersusBasis(valueCents, watch)
    if (g === null) continue
    gainCents += g.cents
    basisCents += watch.cost_basis_cents
    n++
  }
  if (n === 0) return null
  return { cents: gainCents, pct: basisCents > 0 ? (gainCents / basisCents) * 100 : null }
}

/** The four fee columns summed — the "fees" column, never net proceeds. */
export function feesTotalCents(sale: {
  venue_fee_cents: number
  processing_fee_cents: number
  shipping_cost_cents: number
  insurance_cents: number
}): number {
  return (
    sale.venue_fee_cents +
    sale.processing_fee_cents +
    sale.shipping_cost_cents +
    sale.insurance_cents
  )
}

export interface SaleLedgerPreview {
  salePriceCents: number
  feesCents: number
  netProceedsCents: number
  costBasisCents: number
  gain: GainFigure | null
}

/**
 * Live preview for the Record-sale dialog's ledger (§3.5), recomputed as the
 * user types. This mirrors the watch_sales.net_proceeds_cents GENERATED
 * expression for preview only — once saved, the stored column is the
 * authority and every reader uses it, never this.
 */
export function saleLedgerPreview(
  input: {
    salePriceCents: number
    venueFeeCents: number
    processingFeeCents: number
    shippingCostCents: number
    insuranceCents: number
  },
  watch: BasisFields
): SaleLedgerPreview {
  const feesCents =
    input.venueFeeCents +
    input.processingFeeCents +
    input.shippingCostCents +
    input.insuranceCents
  const netProceedsCents = input.salePriceCents - feesCents
  return {
    salePriceCents: input.salePriceCents,
    feesCents,
    netProceedsCents,
    costBasisCents: watch.cost_basis_cents,
    gain: gainVersusBasis(netProceedsCents, watch),
  }
}

/** Whole days between two "YYYY-MM-DD" dates; null when either is missing. */
export function daysBetween(
  from: string | null | undefined,
  to: string | null | undefined
): number | null {
  if (!from || !to) return null
  return Math.floor((Date.parse(to) - Date.parse(from)) / 86_400_000)
}
