import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TenTenLoupe",
    short_name: "TenTenLoupe",
    description: "Track and showcase your watch collection",
    start_url: "/dashboard",
    display: "standalone",
    // Match the dark app surface so the PWA splash/launch doesn't flash white.
    background_color: "#0f1318",
    theme_color: "#0f1318",
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
