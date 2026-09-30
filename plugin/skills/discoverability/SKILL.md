---
name: discoverability
description: Use this skill whenever a Mzizi-ecosystem site or app needs to be found and correctly rendered by machines — social/messaging link previews (OpenGraph), search engines, and AI agents. Covers the doctrine ("if the machine can't see it, it doesn't exist"), the brand-agnostic Mzizi "hive" OG-image template (dynamic per page, carrying each page's title + description + site icon), the static-Astro implementation (the standard), the Next.js reference template in mzizi-registry, APCA-checked text colours, and a pre-ship checklist. Reach for it when a shared link renders no preview, when adding a new route/site, or when wiring SEO/AIO (llms.txt, structured data, agent-readiness). For tokens and brand use mzizi-design; for components use mzizi-roots.
user-invocable: true
---

# Discoverability — SEO + AIO for the Mzizi ecosystem

> **Covenant:** _If the machine can't see it, it doesn't exist._

Discoverability is the machine-facing surface of every Mzizi-ecosystem site — the
part crawlers, social/messaging scrapers, and AI agents read. It is **cross-cutting**,
not a component you install: it is a genetic-code **convention** ("every surface ships
a title, a description, a dynamic preview image, structured data, and an
agent-readable index") base-paired to the components that satisfy it (the OG template,
`llms.txt`, JSON-LD helpers). A surface a machine can't parse may as well not exist —
and a **missing social preview is the single biggest discoverability no-go**, because
it's the first thing a human sees when a link is shared.

All values here are the current doctrine. The source of truth is the repo:
`mzizi-dev/mzizi-registry` for doctrine and tokens, this package for the skills, served
read-only at <https://api.mzizi.dev/v1> and by the MCP at `https://mcp.mzizi.dev/mcp`. There is
no database behind any of it. Brand colour specifically is `palette.canonical.json` in this
package: 21 families, generated and gated, never retyped.

## The number-one failure: a missing OG image

The most common — and most damaging — bug is a link that unfurls with **no preview
image at all**. The canonical cause is metadata that points at an image file that
doesn't exist:

```ts
// ❌ WRONG — points at a static file that isn't in /public, so every scraper 404s
openGraph: { images: ["/og-image.png"] }
twitter:   { images: ["/og-image.png"] }
```

Worse, an explicit `images` array **overrides** a framework's dynamic OG route, so
the good image never gets a chance. **Rule: never hardcode `openGraph.images`.** Let
the framework's file-convention / endpoint serve a _generated_ image, and set an
absolute base URL so scrapers get an absolute URL.

## The Mzizi "hive" OG card

One template, every route, every brand. The card is:

- **Deep-night ground** (`#1B1A17`) with a faint flat-top **honeycomb hex lattice**
  (white at ~5% — texture, not noise) and a few solid **mineral accent cells**
  (cobalt / gold lead, plus tanzanite / malachite / copper for warmth).
- The **site icon on top, above the title** (brand recognition first), then the
  title, an optional eyebrow, the SEO description, and the domain.
- **Left-aligned** (reads better than centred at thumbnail size).
- **Brand-agnostic:** the icon is a parameter, so the same template serves nyuchi
  (the bee), mukoko (the swarm), mzizi, shamwari — each with its own mark + domain.
  It picks up the _site's own icon_, never a hardcoded one.

### Colours are APCA-checked

OG text is read at thumbnail size, so contrast matters. Verified against the
`#1B1A17` ground (APCA reverse polarity; design-system floor is **Lc 75 large /
Lc 90 body**):

| Role                             | Hex       | APCA Lc | Verdict |
| -------------------------------- | --------- | ------- | ------- |
| Title                            | `#F5F5F4` | 92      | ✓ body  |
| Secondary (eyebrow, description) | `#E5E3DE` | 81      | ✓ large |
| Domain (gold)                    | `#FFD740` | 76      | ✓ large |

Do **not** use dim greys like `#B2AFA8` (only Lc 50) for OG text — it looks fine on a
monitor and vanishes in a messaging thumbnail. Re-run APCA when changing any pair.

## Implementation — Astro, static (the standard)

New surfaces are static Astro: mzizi.dev (`mzizi-dev/mzizi-site`) is one. A statically built
site generates its OG images **at build time**:

1. A build-time image endpoint, `src/pages/og/[...slug].png.ts`, with `getStaticPaths()` over
   the site's pages or content collection. Render each page's title and description with
   **satori** to SVG, then rasterise with **sharp** to PNG.
2. In the shared layout's `<head>`, set
   `<meta property="og:image" content={new URL(`/og/${slug}.png`, Astro.site)} />` per page,
   plus `twitter:card` = `summary_large_image`. Set `site` in `astro.config.mjs` so every URL is
   absolute.
3. Use the hive design: honeycomb, the site's icon, and the brand's colour (for mzizi.dev,
   hematite, a Heritage tone; see the constellation in `mzizi-design`).

Keep the site's runtime dependency-light; satori and sharp are build-only. If the site renders
Mzizi Roots components, they arrive as static HTML from `dioxus-ssr` and change nothing here.

**Docs on Mintlify** (docs.mzizi.dev) get their preview images from Mintlify. Check them with a
scraper like any other surface; do not hand-wire `og:image` there.

## Reference template — Next.js (App Router)

`mzizi-registry` is a Next.js app and still carries the reference template at
`lib/og/mzizi-og.tsx` (`renderMziziOg({ title, eyebrow, description, iconPath, domain })`),
wired through `app/opengraph-image.tsx`. It no longer serves mzizi.dev. Do not start a new
surface on Next.js; use this only for a surface that is already on it:

```tsx
// app/opengraph-image.tsx  (root)  — and app/<section>/[slug]/opengraph-image.tsx
import { renderMziziOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/mzizi-og"
export const runtime = "nodejs"          // reads the icon PNG off disk
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export default function Image() {
  return renderMziziOg({ title: "Mzizi" })   // per page: pass that page's title + description
}
```

```ts
// app/layout.tsx  — set metadataBase, DO NOT set openGraph.images / twitter.images
export const metadata = {
  metadataBase: new URL("https://example.org"),
  openGraph: { type: "website", siteName: "Mzizi", title: "Mzizi", description: "…" },
  twitter:   { card: "summary_large_image", title: "Mzizi", description: "…" },
  // No `images` — the opengraph-image.tsx route supplies an absolute, hashed URL,
  // and the twitter card falls back to it.
}
```

## Beyond the image — the rest of the convention

- **Title + meta description** on every route (unique, page-specific).
- **Structured data**: schema.org JSON-LD for the page's primary entity.
- **`llms.txt`** at the site root — the machine-readable index for LLMs.
- **`robots.txt` + `sitemap.xml`** — generated, not hand-maintained.
- **Canonical URLs** absolute (a set `metadataBase` / `site`).
- **Agent-readiness**: an MCP discovery card at `/.well-known/mcp.json` pointing at the MCP
  endpoint (mzizi.dev ships one for `https://mcp.mzizi.dev/mcp`).

## Pre-ship checklist

- [ ] Sharing the URL in Slack / WhatsApp / iMessage / X renders a preview **image**.
- [ ] The OG image is **generated** (dynamic), carries the page's title + description + the site icon, and its URL is **absolute**.
- [ ] No hardcoded `openGraph.images` / `twitter.images`.
- [ ] OG text colours pass APCA (Lc ≥ 75 large / ≥ 90 body).
- [ ] `metadataBase` / `site` is set; canonical URL is absolute.
- [ ] Title + meta description are unique per route.
- [ ] `llms.txt`, `robots.txt`, `sitemap.xml` present; JSON-LD on primary entities.
- [ ] Validate the card in a scraper (e.g. opengraph.xyz) after deploy.

_The whole helix is Mzizi — and discoverability is the convention that makes each
surface legible to the machines that carry it. Ndiri nekuti tiri._
