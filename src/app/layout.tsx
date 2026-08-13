import type { Metadata, Viewport } from "next"
import { Geist, Fraunces, JetBrains_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar"
import { ThemeProvider } from "@/components/theme-provider"
import { StorageMigration } from "@/components/storage-migration"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

// Engraved-dial display serif for the marque and headings.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
})

// Spec-sheet monospace for technical data (calibers, rates, refs, prices).
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
})

// No maximumScale: pinch-zoom must work app-wide (WCAG 1.4.4, F1) — this is
// a photography app; never lock the viewport scale.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "TenTenLoupe",
  description: "Track and showcase your watch collection",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TenTenLoupe",
  },
  // Declared here rather than via app/favicon.ico so the tab, the iOS home
  // screen and the manifest all point at the same brand PNGs in public/.
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // No hand-written <head>: the apple-touch-icon link used to be pinned there
    // to a file under /icons that the rebrand deleted. metadata.icons above
    // emits it now, so there is one source of truth.
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {/* Light is the product's only theme (FIXES-ROUND-1 §1). forcedTheme
            pins it: a fresh profile gets light, and a stale `theme: dark` left
            in localStorage from the pre-fix build cannot resurrect the dark
            palette. The .dark tokens stay in globals.css but are unreachable —
            there is deliberately no theme switcher. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        {/* Rebrand storage shim — must be in the tree so its module evaluates. */}
        <StorageMigration />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
