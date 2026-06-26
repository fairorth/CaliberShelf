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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
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
