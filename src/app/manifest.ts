import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CaliberShelf",
    short_name: "CaliberShelf",
    description: "Track and showcase your watch collection",
    start_url: "/dashboard",
    display: "standalone",
    // Match the dark app surface so the PWA splash/launch doesn't flash white.
    background_color: "#0f1318",
    theme_color: "#0f1318",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
