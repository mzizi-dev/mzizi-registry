"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Github, ExternalLink, Menu, X } from "lucide-react"
import { MukokoLogo } from "@/components/brand/mukoko-logo"
import { ThemeToggle } from "@/components/theme-toggle"

const products = [
  { label: "mukoko.com", href: "https://www.mukoko.com" },
  { label: "lingo", href: "https://lingo.mukoko.com" },
  { label: "nhimbe", href: "https://nhimbe.com" },
  { label: "bushtrade", href: "https://bushtrade.co.zw" },
  { label: "bundu", href: "https://bundu.family" },
  { label: "news", href: "https://news.mukoko.com" },
  { label: "weather", href: "https://weather.mukoko.com" },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center">
          <MukokoLogo size={26} suffix="registry" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <a
            href="#components"
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Components
          </a>
          <a
            href="#catalog"
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Catalog
          </a>
          <a
            href="/api/r"
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            API
          </a>
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <a
              href="https://github.com/nyuchitech/mukoko-registry"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <Github className="size-4" />
              <span className="text-sm">GitHub</span>
            </a>
          </Button>
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          <a
            href="#components"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Components
          </a>
          <a
            href="#catalog"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Catalog
          </a>
          <a
            href="/api/r"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            API
          </a>

          <div className="my-1 h-px bg-border" />
          <span className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Products
          </span>
          {products.map((p) => (
            <a
              key={p.label}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {p.label}
              <ExternalLink className="size-3 opacity-50" />
            </a>
          ))}

          <div className="my-1 h-px bg-border" />
          <a
            href="https://github.com/nyuchitech/mukoko-registry"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Github className="size-4" />
            GitHub
          </a>
        </nav>
      )}
    </header>
  )
}
