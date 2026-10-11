import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TenTenLoupe",
    short_name: "TenTenLoupe",
    description: "Track and showcase your watch collection",
    start_url: "/dashboard",
    display: "standalone",
    // The light --background (oklch(0.97 0.005 235) ≈ #f2f6f8). This was the
    // dark surface's #0f1318 from before the product went light-only, which
    // flashed a dark splash before every launch. Change with globals.css.
    background_color: "#f2f6f8",
    theme_color: "#f2f6f8",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
