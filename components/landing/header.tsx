"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, Menu, X } from "lucide-react"

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}
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

const navLinks = [
  { label: "Docs", href: "/docs" },
  { label: "Components", href: "/components" },
  { label: "Blocks", href: "/blocks" },
  { label: "Charts", href: "/charts" },
  { label: "Brand", href: "/brand" },
  { label: "Foundations", href: "/foundations" },
  { label: "Patterns", href: "/patterns" },
  { label: "Architecture", href: "/architecture" },
]

const mobileMoreLinks = [
  { label: "Design", href: "/design" },
  { label: "Content", href: "/content" },
  { label: "Registry", href: "/registry" },
  { label: "API", href: "/api/v1" },
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
        <nav className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
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
              <GithubIcon className="size-4" />
              <span className="text-sm">GitHub</span>
            </a>
          </Button>
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-border bg-background px-4 pb-4 pt-2 lg:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </a>
          ))}

          <div className="my-1 h-px bg-border" />
          <span className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            More
          </span>
          {mobileMoreLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </a>
          ))}

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
            <GithubIcon className="size-4" />
            GitHub
          </a>
        </nav>
      )}
    </header>
  )
}
