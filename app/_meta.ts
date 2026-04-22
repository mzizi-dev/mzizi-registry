/**
 * Top-level navigation.
 *
 * Architecture rule:
 *  - Header surfaces only 4 top-priority destinations
 *    (Components, Brand, Architecture, Docs).
 *  - Footer holds the complete navigation (every other page).
 *  - The Bundu Family menu is the only top-level menu in the header,
 *    so cross-ecosystem jumps stay one click away.
 *
 * All other Nextra pages are kept (Foundations, Design, Patterns, Charts,
 * Blocks, Registry, Content, API) but marked `display: "hidden"` so they
 * still build and render, just don't clutter the navbar.
 */

const hidden = { display: "hidden" as const, type: "page" as const }

export default {
  index: {
    title: "nyuchi design portal",
    type: "page",
    theme: {
      layout: "full",
      sidebar: false,
      toc: false,
      pagination: false,
      breadcrumb: false,
    },
  },

  // ── 4 top-priority pages in the navbar ────────────────────────────────
  components: { title: "Components", type: "page" },
  brand: { title: "Brand", type: "page" },
  architecture: { title: "Architecture", type: "page" },
  docs: { title: "Docs", type: "page" },

  // ── Hidden from navbar; full nav lives in the footer ─────────────────
  foundations: { ...hidden, title: "Foundations" },
  design: { ...hidden, title: "Design" },
  content: { ...hidden, title: "Content" },
  patterns: { ...hidden, title: "Patterns" },
  charts: { ...hidden, title: "Charts" },
  blocks: { ...hidden, title: "Blocks" },
  registry: { ...hidden, title: "Registry" },
  "api-docs": { ...hidden, title: "API" },

  "---": { type: "separator" as const },

  ecosystem: {
    title: "The Bundu Family",
    type: "menu",
    items: {
      bundu: { title: "bundu — the ecosystem", href: "https://bundu.family" },
      mukoko: { title: "mukoko — super app", href: "https://www.mukoko.com" },
      weather: { title: "weather", href: "https://weather.mukoko.com" },
      news: { title: "news", href: "https://news.mukoko.com" },
      lingo: { title: "lingo", href: "https://lingo.mukoko.com" },
      nhimbe: { title: "nhimbe — events", href: "https://nhimbe.com" },
      shamwari: { title: "shamwari — AI", href: "https://shamwari.ai" },
      nyuchi: { title: "nyuchi — enterprise", href: "https://nyuchi.com" },
      bushtrade: { title: "bushtrade — marketplace", href: "https://bushtrade.co.zw" },
    },
  },
}
