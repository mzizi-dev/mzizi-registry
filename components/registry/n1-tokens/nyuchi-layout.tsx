"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI LAYOUT SYSTEM
   
   Responsive infrastructure ensuring every Nyuchi app responds
   to screen size, device type, and user density preference
   in exactly the same way.
   
   BREAKPOINTS:
     mobile:  0–639px    (1 column, bottom nav, full-bleed cards)
     tablet:  640–1023px (2 columns, bottom nav or sidebar)
     desktop: 1024–1439px (sidebar + content, max-width container)
     wide:    1440px+     (sidebar + content + aside)
   
   CANONICAL LAYOUTS (the five page archetypes):
     feed:      listing card stream with filters
     detail:    hero + content + aside
     create:    form flow with sticky CTA
     profile:   header + tabs + content
     dashboard: stats + charts + tables
   
   ADAPTIVE DENSITY:
     comfortable: spacious, large touch targets (default mobile)
     compact:     information-dense (power users, desktop default)
   ═══════════════════════════════════════════════════════════════ */

// ─── Breakpoint Tokens ─────────────────────────────────────
export const breakpoints = {
  mobile: 0,
  tablet: 640,
  desktop: 1024,
  wide: 1440,
} as const

export type Breakpoint = keyof typeof breakpoints

// ─── useBreakpoint Hook ────────────────────────────────────
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = React.useState<Breakpoint>("mobile")

  React.useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      if (w >= breakpoints.wide) setBp("wide")
      else if (w >= breakpoints.desktop) setBp("desktop")
      else if (w >= breakpoints.tablet) setBp("tablet")
      else setBp("mobile")
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return bp
}

export function useIsMobile(): boolean {
  return useBreakpoint() === "mobile"
}

// ─── Density System ────────────────────────────────────────
export type Density = "comfortable" | "compact"

const DensityContext = React.createContext<{ density: Density; setDensity: (d: Density) => void }>({
  density: "comfortable",
  setDensity: () => {},
})

export function useDensity() {
  return React.useContext(DensityContext)
}

export function DensityProvider({
  children,
  defaultDensity = "comfortable",
}: {
  children: React.ReactNode
  defaultDensity?: Density
}) {
  const [density, setDensity] = React.useState<Density>(defaultDensity)
  React.useEffect(() => {
    document.documentElement.setAttribute("data-density", density)
  }, [density])
  return (
    <DensityContext.Provider value={{ density, setDensity }}>{children}</DensityContext.Provider>
  )
}

// ─── Canonical Layout Specs ────────────────────────────────
export const canonicalLayouts = {
  feed: {
    mobile: { columns: 1, cardVariant: "row" as const, showSidebar: false, showAside: false },
    tablet: { columns: 2, cardVariant: "compact" as const, showSidebar: false, showAside: false },
    desktop: { columns: 1, cardVariant: "row" as const, showSidebar: true, showAside: false },
    wide: { columns: 1, cardVariant: "row" as const, showSidebar: true, showAside: true },
  },
  detail: {
    mobile: { contentWidth: "100%", showAside: false, heroFullBleed: true },
    tablet: { contentWidth: "100%", showAside: false, heroFullBleed: true },
    desktop: { contentWidth: "auto", showAside: true, heroFullBleed: false },
    wide: { contentWidth: "auto", showAside: true, heroFullBleed: false },
  },
  create: {
    mobile: { maxWidth: "100%", stickyCtaBottom: true },
    tablet: { maxWidth: "640px", stickyCtaBottom: true },
    desktop: { maxWidth: "640px", stickyCtaBottom: false },
    wide: { maxWidth: "640px", stickyCtaBottom: false },
  },
  profile: {
    mobile: { headerLayout: "stacked", tabsVariant: "scrollable" },
    tablet: { headerLayout: "stacked", tabsVariant: "fixed" },
    desktop: { headerLayout: "inline", tabsVariant: "fixed" },
    wide: { headerLayout: "inline", tabsVariant: "fixed" },
  },
  dashboard: {
    mobile: { statsColumns: 2, chartFullWidth: true },
    tablet: { statsColumns: 2, chartFullWidth: false },
    desktop: { statsColumns: 4, chartFullWidth: false },
    wide: { statsColumns: 4, chartFullWidth: false },
  },
} as const

// ─── NyuchiGrid Component ──────────────────────────────────
// The responsive grid for content areas. Adapts columns based
// on breakpoint and respects density preference.

interface NyuchiGridProps {
  children: React.ReactNode
  /** Override column count (otherwise auto from breakpoint) */
  columns?: 1 | 2 | 3 | 4
  /** Gap between items */
  gap?: "sm" | "md" | "lg"
  /** Max width constraint */
  maxWidth?: string
  className?: string
}

const gapMap = { sm: "gap-2", md: "gap-3 sm:gap-4", lg: "gap-4 sm:gap-6" }
const colMap = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
}

export function NyuchiGrid({
  children,
  columns = 1,
  gap = "md",
  maxWidth,
  className,
}: NyuchiGridProps) {
  return (
    <div
      data-slot="nyuchi-grid"
      data-portal="https://mzizi.dev/components/nyuchi-grid"
      className={cn("grid w-full", colMap[columns], gapMap[gap], className)}
      style={maxWidth ? { maxWidth } : undefined}
    >
      {children}
    </div>
  )
}

// ─── NyuchiPage Container ──────────────────────────────────
// Standard page wrapper with responsive padding and max-width.

interface NyuchiPageProps {
  children: React.ReactNode
  /** Page layout type */
  layout?: keyof typeof canonicalLayouts
  className?: string
}

export function NyuchiPage({ children, layout, className }: NyuchiPageProps) {
  return (
    <main
      id="main-content"
      data-slot="nyuchi-page"
      data-layout={layout}
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        "max-w-[var(--page-maxWidth,1280px)]",
        className
      )}
    >
      {children}
    </main>
  )
}

export type { NyuchiGridProps, NyuchiPageProps }
