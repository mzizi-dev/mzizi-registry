import { Separator } from "@/components/ui/separator"
import { NyuchiLogo } from "@/components/layout/nyuchi-logo"

const minerals = [
  { name: "cobalt", color: "bg-[var(--color-cobalt)]" },
  { name: "tanzanite", color: "bg-[var(--color-tanzanite)]" },
  { name: "malachite", color: "bg-[var(--color-malachite)]" },
  { name: "gold", color: "bg-[var(--color-gold)]" },
  { name: "terracotta", color: "bg-[var(--color-terracotta)]" },
]

// ──────────────────────────────────────────────────────────────────────────
// Footer columns — 4 coherent buckets, not 6 overlapping ones.
//
// Rationale (after the UX critique on PR #43):
//   - "Getting Started" and "Registry & Developer" overlapped on /docs
//     entries and /registry entries. Both now fall under the single
//     "Developer" column.
//   - "Design System" and "Brand" were split between /foundations,
//     /design, /brand and /content with ambiguous scope — see issue #48.
//     They're now one "Design System" column.
//   - "Components & Blocks" stays its own column because component
//     browsing is the primary reason most developers land here.
//   - "Architecture" keeps a dedicated column because the 3D frontend
//     model + fundi + patterns are distinctive doctrine, not generic docs.
//
// When #48 lands (IA consolidation) these columns should re-consolidate
// further.
// ──────────────────────────────────────────────────────────────────────────

type FooterColumn = {
  title: string
  links: Array<{ label: string; href: string }>
}

const columns: FooterColumn[] = [
  {
    title: "Components",
    links: [
      { label: "All Components", href: "/components" },
      { label: "Blocks", href: "/blocks" },
      { label: "Charts", href: "/charts" },
      { label: "Patterns", href: "/patterns" },
    ],
  },
  {
    title: "Design System",
    links: [
      { label: "Brand", href: "/brand" },
      { label: "Foundations", href: "/foundations" },
      { label: "Design Tokens", href: "/foundations/tokens" },
      { label: "Icons", href: "/foundations/icons" },
      { label: "Accessibility", href: "/foundations/accessibility" },
      { label: "Typography", href: "/foundations/typography" },
    ],
  },
  {
    title: "Architecture",
    links: [
      { label: "3D Architecture", href: "/architecture" },
      { label: "Layer Decision Guide", href: "/architecture/layers" },
      { label: "Component Backlinks", href: "/architecture/component-backlinks" },
      { label: "Fundi (L9)", href: "/architecture/fundi" },
      { label: "Observability", href: "/observability" },
    ],
  },
  {
    title: "Developer",
    links: [
      { label: "Introduction", href: "/docs" },
      { label: "Installation", href: "/docs/installation" },
      { label: "CLI", href: "/docs/cli" },
      { label: "Theming", href: "/docs/theming" },
      { label: "API Reference", href: "/docs/api-reference" },
      { label: "Registry", href: "/registry" },
      { label: "MCP Server", href: "/registry/mcp" },
      { label: "Changelog", href: "/docs/changelog" },
      { label: "Contributing", href: "/docs/contributing" },
    ],
  },
]

const footerLink = "text-xs text-muted-foreground transition-colors hover:text-foreground"

export function Footer() {
  return (
    // Full-bleed: Nextra's <Footer> wrapper applies its own max-width and
    // left-aligns content inside the docs grid. The negative margins +
    // 100vw width here break out of that container so the footer spans
    // the full viewport on desktop, then re-centres its grid via mx-auto.
    <div className="relative right-1/2 left-1/2 -mx-[50vw] w-screen px-4 pt-8 pb-10 sm:px-6 sm:pb-12">
      <div className="mx-auto max-w-6xl">
        <Separator className="mb-10" />

        {/* Primary nav: 4 columns on desktop, 2 on tablet, 1 stacked on mobile. */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">{col.title}</span>
              {col.links.map((link) => (
                <a key={link.href} href={link.href} className={footerLink}>
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Brand lockup + ecosystem family */}
        <Separator className="my-8" />

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <NyuchiLogo size={24} showWordmark suffix="design" />
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              The design system for the bundu ecosystem — powering mukoko, nyuchi, and every app in
              the family. Built on the Five African Minerals palette.
            </p>
            <div className="flex items-center gap-1.5 pt-1" aria-label="Five African Minerals">
              {minerals.map((m) => (
                <span key={m.name} className={`size-2 rounded-full ${m.color}`} title={m.name} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:flex sm:flex-wrap sm:gap-12">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">mukoko — consumer</span>
              <a
                href="https://www.mukoko.com"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
              >
                mukoko.com
              </a>
              <a
                href="https://weather.mukoko.com"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
              >
                weather
              </a>
              <a
                href="https://news.mukoko.com"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
              >
                news
              </a>
              <a
                href="https://lingo.mukoko.com"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
              >
                lingo
              </a>
              <a
                href="https://nhimbe.com"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
              >
                nhimbe
              </a>
              <a
                href="https://shamwari.ai"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
              >
                shamwari
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">nyuchi — enterprise</span>
              <a
                href="https://nyuchi.com"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
              >
                nyuchi.com
              </a>
              <a
                href="https://bushtrade.co.zw"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
              >
                bushtrade
              </a>
              <a
                href="https://github.com/nyuchitech/design-portal"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
              >
                GitHub
              </a>
              <a
                href="https://github.com/nyuchitech"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
              >
                Nyuchi on GitHub
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
          <span className="text-xs text-muted-foreground">
            Built by{" "}
            <a
              href="https://github.com/nyuchitech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 transition-colors hover:text-muted-foreground"
            >
              Nyuchi Africa
            </a>
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">v4.0.26</span>
        </div>
      </div>
    </div>
  )
}
