import type { NextConfig } from "next";
import { version } from "./package.json";

const nextConfig: NextConfig = {
  // Expose package.json's version to the client bundle (read in src/lib/version.ts)
  // so the header badge always matches the released version — single source of truth.
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  experimental: {
    serverActions: {
      // Generous cap so an un-optimizable phone capture (large HEIC/48MP) never
      // hard-fails the whole request before the watch is created; the add flow
      // downscales client-side first, so real bodies are a few hundred KB.
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ztmmhuaivirxfokmckvx.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
      {
        // Pro image-transformation (resize) endpoint
        protocol: "https",
        hostname: "ztmmhuaivirxfokmckvx.supabase.co",
        pathname: "/storage/v1/render/image/sign/**",
      },
    ],
  },
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
      ],
    },
  ],
};

export default nextConfig;
