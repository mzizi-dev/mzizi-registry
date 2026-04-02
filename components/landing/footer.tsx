import { Separator } from "@/components/ui/separator"
import { MukokoLogo } from "@/components/brand/mukoko-logo"

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
    <footer className="px-4 pb-10 pt-8 sm:px-6 sm:pb-12">
      <div className="mx-auto max-w-6xl">
        <Separator className="mb-10" />

        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* Getting Started */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Getting Started</span>
            <a href="/docs" className={footerLink}>Documentation</a>
            <a href="/docs/installation" className={footerLink}>Installation</a>
            <a href="/docs/cli" className={footerLink}>CLI</a>
            <a href="/docs/theming" className={footerLink}>Theming</a>
            <a href="/docs/dark-mode" className={footerLink}>Dark Mode</a>
            <a href="/docs/changelog" className={footerLink}>Changelog</a>
          </div>

          {/* Components & Blocks */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Components</span>
            <a href="/components" className={footerLink}>All Components</a>
            <a href="/blocks" className={footerLink}>Blocks</a>
            <a href="/blocks/dashboard" className={footerLink}>Dashboard</a>
            <a href="/blocks/authentication" className={footerLink}>Authentication</a>
            <a href="/blocks/sidebar" className={footerLink}>Sidebar</a>
            <a href="/charts" className={footerLink}>Charts</a>
          </div>

          {/* Design System */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Design System</span>
            <a href="/foundations" className={footerLink}>Foundations</a>
            <a href="/foundations/typography" className={footerLink}>Typography</a>
            <a href="/foundations/accessibility" className={footerLink}>Accessibility</a>
            <a href="/foundations/layout" className={footerLink}>Layout</a>
            <a href="/design" className={footerLink}>Design</a>
            <a href="/design/tokens" className={footerLink}>Tokens</a>
            <a href="/design/icons" className={footerLink}>Icons</a>
          </div>

          {/* Brand & Content */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Brand</span>
            <a href="/brand" className={footerLink}>Overview</a>
            <a href="/brand/colors" className={footerLink}>Colors</a>
            <a href="/brand/components" className={footerLink}>Component Specs</a>
            <a href="/brand/guidelines" className={footerLink}>Guidelines</a>
            <a href="/content" className={footerLink}>Content</a>
            <a href="/content/writing" className={footerLink}>Writing</a>
          </div>

          {/* Patterns & Architecture */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Patterns</span>
            <a href="/patterns" className={footerLink}>Overview</a>
            <a href="/patterns/resilience" className={footerLink}>Resilience</a>
            <a href="/patterns/error-boundaries" className={footerLink}>Error Boundaries</a>
            <a href="/patterns/ai-safety" className={footerLink}>AI Safety</a>
            <a href="/architecture" className={footerLink}>Architecture</a>
            <a href="/architecture/principles" className={footerLink}>Principles</a>
          </div>

          {/* Registry & Developer */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Registry</span>
            <a href="/registry" className={footerLink}>Overview</a>
            <a href="/registry/schema" className={footerLink}>Schema</a>
            <a href="/registry/consuming" className={footerLink}>Consuming</a>
            <a href="/registry/contributing" className={footerLink}>Contributing</a>
            <a href="/registry/mcp" className={footerLink}>MCP Server</a>
            <a href="/api-docs" className={footerLink}>API Docs</a>
          </div>
        </div>

        {/* Ecosystem products */}
        <Separator className="my-8" />

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <MukokoLogo size={24} showWordmark={true} suffix="design" />
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              The design system and component registry for the bundu ecosystem.
              Built by nyuchi on the Five African Minerals palette.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              {minerals.map((m) => (
                <span key={m.name} className={`size-2 rounded-full ${m.color}`} title={m.name} />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-8 sm:gap-12">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">bundu ecosystem</span>
              <a href="https://bundu.family" target="_blank" rel="noopener noreferrer" className={footerLink}>bundu.family</a>
              <a href="https://nyuchi.com" target="_blank" rel="noopener noreferrer" className={footerLink}>nyuchi</a>
              <a href="https://bushtrade.co.zw" target="_blank" rel="noopener noreferrer" className={footerLink}>bushtrade</a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">mukoko apps</span>
              <a href="https://www.mukoko.com" target="_blank" rel="noopener noreferrer" className={footerLink}>mukoko.com</a>
              <a href="https://weather.mukoko.com" target="_blank" rel="noopener noreferrer" className={footerLink}>weather</a>
              <a href="https://news.mukoko.com" target="_blank" rel="noopener noreferrer" className={footerLink}>news</a>
              <a href="https://lingo.mukoko.com" target="_blank" rel="noopener noreferrer" className={footerLink}>lingo</a>
              <a href="https://nhimbe.com" target="_blank" rel="noopener noreferrer" className={footerLink}>nhimbe</a>
              <a href="https://shamwari.ai" target="_blank" rel="noopener noreferrer" className={footerLink}>shamwari</a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">Open Source</span>
              <a href="https://github.com/nyuchitech/design-portal" target="_blank" rel="noopener noreferrer" className={footerLink}>GitHub</a>
              <a href="https://github.com/nyuchitech" target="_blank" rel="noopener noreferrer" className={footerLink}>Nyuchi on GitHub</a>
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
              className="underline underline-offset-2 text-foreground transition-colors hover:text-muted-foreground"
            >
              Nyuchi Africa
            </a>
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">v4.0.1</span>
        </div>
      </div>
    </footer>
  )
}
