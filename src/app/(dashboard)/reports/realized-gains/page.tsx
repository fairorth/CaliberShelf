import { permanentRedirect } from "next/navigation"

// Realized Gains was absorbed by the Watch Sales report, which shows open
// listings and completed sales together. The slug survives as a redirect: it
// was linked from the reports index, the Market panel and any bookmark.
export default function RealizedGainsPage() {
  permanentRedirect("/reports/sales")
}
