import type { Metadata, Viewport } from "next"
import { Geist, Fraunces, JetBrains_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar"
import { ThemeProvider } from "@/components/theme-provider"
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
  title: "CaliberShelf",
  description: "Track and showcase your watch collection",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CaliberShelf",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
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
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
