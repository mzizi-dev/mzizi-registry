import type { MetadataRoute } from "next"

/**
 * Web app manifest — served at /manifest.webmanifest.
 *
 * Next.js App Router auto-wires `app/icon.svg`, `app/apple-icon.png` and
 * `app/favicon.ico` into <head>, but a manifest is what Android/Chrome and
 * installable-PWA consumers read for the larger maskable sizes. Without it the
 * 192/512 PNGs in `public/icons/` are never requested.
 *
 * Colours are the bundu accent (copper) on the mzizi cream surface, matching
 * `app/icon.svg`. These are literal values because a manifest is JSON served to
 * the browser — it cannot resolve CSS custom properties, which is the same
 * reason `next/og` routes are exempt from the no-hardcoded-hex rule (§7.4).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "mzizi",
    short_name: "mzizi",
    description:
      "The Mzizi design system — component registry, brand, and the DNA-helix frontend architecture. An open-architecture project of the Bundu Foundation.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f5",
    theme_color: "#bf5a36",
    icons: [
      { src: "/icons/mzizi-icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icons/mzizi-icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/icons/mzizi-icon-256.png", type: "image/png", sizes: "256x256" },
      {
        src: "/icons/mzizi-icon-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "any",
      },
      {
        src: "/icons/mzizi-icon-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
  }
}
