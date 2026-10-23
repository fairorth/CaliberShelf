import { deviceSetting } from "./device-setting"

/**
 * More → "Show watch purchase price". Off by default: the phone is used in
 * public — a show floor, a GTG — where a price on screen is nobody else's
 * business. When on, the collection tiles and the watch card show what was
 * paid. Per device.
 */
const showPurchasePrice = deviceSetting("tenten.showPurchasePrice", false)
export const setShowPurchasePrice = showPurchasePrice.set
export const useShowPurchasePrice = showPurchasePrice.useSetting

/**
 * More → "Show personal settings": the watch card's keep judgements —
 * attachment, keep or sell, sentimental. On by default (it is the owner's
 * phone); off before handing it to someone to flip through the collection,
 * so they can neither see nor change them. Per device.
 */
const showPersonalSettings = deviceSetting("tenten.showPersonalSettings", true)
export const setShowPersonalSettings = showPersonalSettings.set
export const useShowPersonalSettings = showPersonalSettings.useSetting

/** "$1,250" — whole dollars, as the web's tiles show it. */
export function formatPrice(cents: number | null): string | null {
  if (cents == null) return null
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    cents / 100
  )
}
