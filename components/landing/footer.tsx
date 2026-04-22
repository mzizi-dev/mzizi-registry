import { Separator } from "@/components/ui/separator"
import { NyuchiLogo } from "@/components/layout/nyuchi-logo"

const minerals = [
  { name: "cobalt", color: "bg-[var(--color-cobalt)]" },
  { name: "tanzanite", color: "bg-[var(--color-tanzanite)]" },
  { name: "malachite", color: "bg-[var(--color-malachite)]" },
  { name: "gold", color: "bg-[var(--color-gold)]" },
  { name: "terracotta", color: "bg-[var(--color-terracotta)]" },
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

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
          {/* Getting Started */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Getting Started</span>
            <a href="/docs" className={footerLink}>
              Introduction
            </a>
            <a href="/docs/installation" className={footerLink}>
              Installation
            </a>
            <a href="/docs/cli" className={footerLink}>
              CLI
            </a>
            <a href="/docs/theming" className={footerLink}>
              Theming
            </a>
            <a href="/docs/dark-mode" className={footerLink}>
              Dark Mode
            </a>
            <a href="/docs/api-reference" className={footerLink}>
              API Reference
            </a>
            <a href="/docs/contributing" className={footerLink}>
              Contributing
            </a>
            <a href="/docs/changelog" className={footerLink}>
              Changelog
            </a>
          </div>

          {/* Components & Blocks */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Components</span>
            <a href="/components" className={footerLink}>
              All Components
            </a>
            <a href="/blocks" className={footerLink}>
              Blocks
            </a>
            <a href="/blocks/dashboard" className={footerLink}>
              Dashboard
            </a>
            <a href="/blocks/authentication" className={footerLink}>
              Authentication
            </a>
            <a href="/blocks/sidebar" className={footerLink}>
              Sidebar
            </a>
            <a href="/charts" className={footerLink}>
              Charts
            </a>
          </div>

          {/* Design System */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Design System</span>
            <a href="/foundations" className={footerLink}>
              Foundations
            </a>
            <a href="/foundations/typography" className={footerLink}>
              Typography
            </a>
            <a href="/foundations/accessibility" className={footerLink}>
              Accessibility
            </a>
            <a href="/foundations/layout" className={footerLink}>
              Layout
            </a>
            <a href="/design/tokens" className={footerLink}>
              Semantic Tokens
            </a>
            <a href="/design/icons" className={footerLink}>
              Icons
            </a>
          </div>

          {/* Brand & Content */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Brand</span>
            <a href="/brand" className={footerLink}>
              Brand Guidelines
            </a>
            <a href="/content" className={footerLink}>
              Content
            </a>
            <a href="/content/writing" className={footerLink}>
              Writing
            </a>
          </div>

          {/* Architecture */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Architecture</span>
            <a href="/architecture" className={footerLink}>
              3D Architecture
            </a>
            <a href="/architecture/layers" className={footerLink}>
              Layer Decision Guide
            </a>
            <a href="/architecture/component-backlinks" className={footerLink}>
              Component Backlinks
            </a>
            <a href="/architecture/fundi" className={footerLink}>
              Fundi (L9)
            </a>
            <a href="/patterns" className={footerLink}>
              Patterns
            </a>
            <a href="/patterns/error-boundaries" className={footerLink}>
              Error Boundaries
            </a>
          </div>

          {/* Registry & Developer */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Registry</span>
            <a href="/registry" className={footerLink}>
              Overview
            </a>
            <a href="/registry/schema" className={footerLink}>
              Schema
            </a>
            <a href="/registry/consuming" className={footerLink}>
              Consuming
            </a>
            <a href="/registry/contributing" className={footerLink}>
              Contributing
            </a>
            <a href="/registry/mcp" className={footerLink}>
              MCP Server
            </a>
            <a href="/api-docs" className={footerLink}>
              API Docs
            </a>
          </div>
        </div>

        {/* Ecosystem products */}
        <Separator className="my-8" />

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <NyuchiLogo size={24} showWordmark suffix="design" />
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              The design system for the bundu ecosystem — powering mukoko, nyuchi, and every app in
              the family. Built on the Five African Minerals palette.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
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
