"use client"

import Link from "next/link"
import { Search, Wrench, User } from "lucide-react"
import { NyuchiLogo } from "@/components/layout/nyuchi-logo"
import { cn } from "@/lib/utils"

/**
 * Landing / portal-wide header.
 *
 * Layout is identical from 320px through ultra-wide: logo + wordmark on the
 * left, three-icon pill group on the right. The only breakpoint-gated bit is
 * the four top-level nav links in the middle, which only appear at `md` and
 * above (below that, the footer is the full navigation map).
 *
 * Icons in the pill follow the registry's `nyuchi-header` "pill action group"
 * pattern — a rounded-full container in the brand primary colour with three
 * circular icon buttons. Search, Fundi (Wrench), and Avatar are the three
 * persistent identity anchors across every breakpoint.
 *
 * Theme toggle and all social links live in the footer (see `footer.tsx`).
 */

type NavItem = { label: string; href: string }

const NAV_ITEMS: NavItem[] = [
  { label: "Components", href: "/components" },
  { label: "Brand", href: "/brand" },
  { label: "Architecture", href: "/architecture" },
  { label: "Docs", href: "/docs" },
]

type PillAction = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
}

const PILL_ACTIONS: PillAction[] = [
  { icon: Search, label: "Search components", href: "/components" },
  { icon: Wrench, label: "Fundi — self-healing dashboard", href: "/fundi" },
  { icon: User, label: "Account", href: "/fundi" },
]

export function Header() {
  return (
    <header
      data-slot="header"
      className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="Nyuchi Design Portal home"
        >
          <NyuchiLogo size={24} showWordmark suffix="design" />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Pill action group — 3 icons, always visible */}
        <div
          data-slot="pill-actions"
          className="flex shrink-0 items-center gap-1 rounded-full bg-primary p-1"
        >
          {PILL_ACTIONS.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              aria-label={label}
              className={cn(
                "flex size-9 items-center justify-center rounded-full",
                "bg-background/10 text-primary-foreground transition-colors",
                "hover:bg-background/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background",
                "sm:size-10"
              )}
            >
              <Icon className="size-4 sm:size-[18px]" />
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
