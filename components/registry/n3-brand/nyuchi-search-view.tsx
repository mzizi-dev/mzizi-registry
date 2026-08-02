"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI SEARCH VIEW — Universal Brand Component (Pre-Wired)
   
   Cross-app search results. Unified results from all domains:
   people, places, events, products, articles, groups.
   Each result type renders with its own brand card.
   
   Dynamic mineral accent per result category.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

type ResultCategory =
  "all" | "people" | "places" | "events" | "products" | "articles" | "groups" | "jobs"

interface SearchResult {
  id: string
  type: ResultCategory
  title: string
  subtitle?: string
  imageUrl?: string
  verified?: boolean
  mineral?: "cobalt" | "tanzanite" | "malachite" | "gold" | "terracotta"
}

interface NyuchiSearchViewProps {
  /** Current search query */
  query?: string
  /** Search handler */
  onSearch?: (query: string) => void
  /** Active category filter */
  activeCategory?: ResultCategory
  /** Category change handler */
  onCategoryChange?: (cat: ResultCategory) => void
  /** Search results */
  results?: SearchResult[]
  /** Loading state */
  loading?: boolean
  /** Result click handler */
  onResultClick?: (result: SearchResult) => void
  /** Recent searches */
  recentSearches?: string[]
  /** Trending topics */
  trending?: string[]
  className?: string
}

const categoryMinerals: Record<ResultCategory, string> = {
  all: "var(--brand-accent,var(--color-malachite,#64FFDA))",
  people: "var(--color-tanzanite,#B388FF)",
  places: "var(--color-gold,#FFD740)",
  events: "var(--color-malachite,#64FFDA)",
  products: "var(--color-gold,#FFD740)",
  articles: "var(--color-cobalt,#00B0FF)",
  groups: "var(--color-terracotta,#D4A574)",
  jobs: "var(--color-gold,#FFD740)",
}

const categories: { key: ResultCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "people", label: "People" },
  { key: "places", label: "Places" },
  { key: "events", label: "Events" },
  { key: "products", label: "Products" },
  { key: "articles", label: "Articles" },
  { key: "groups", label: "Groups" },
  { key: "jobs", label: "Jobs" },
]

export function NyuchiSearchView({
  query = "",
  onSearch,
  activeCategory = "all",
  onCategoryChange,
  results = [],
  loading = false,
  onResultClick,
  recentSearches = [],
  trending = [],
  className,
}: NyuchiSearchViewProps) {
  const { motion } = useNyuchiHarness("search-view")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  const [localQuery, setLocalQuery] = React.useState(query)

  return (
    <div
      data-slot="nyuchi-search-view"
      style={animStyle}
      data-portal="https://mzizi.dev/components/nyuchi-search-view"
      className={cn("space-y-4", className)}
    >
      {/* Search input */}
      <div className="relative">
        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">🔍</span>
        <input
          type="text"
          value={localQuery}
          onChange={(e) => {
            setLocalQuery(e.target.value)
            onSearch?.(e.target.value)
          }}
          aria-label="Search the ecosystem"
          placeholder="Search everything\u2026"
          className="h-12 w-full rounded-full border border-border bg-muted pr-4 pl-11 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-[var(--brand-accent,var(--color-malachite,#64FFDA))]"
        />
      </div>

      {/* Category filters */}
      <div className="flex scrollbar-none gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onCategoryChange?.(cat.key)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              activeCategory === cat.key
                ? "text-[#0A0A0A]"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            style={
              activeCategory === cat.key
                ? { backgroundColor: categoryMinerals[cat.key] }
                : undefined
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results or empty/recent */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-1.5">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => onResultClick?.(r)}
              className="flex min-h-[56px] w-full items-center gap-3 rounded-[var(--radius-lg,14px)] p-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm,7px)] bg-muted">
                {r.imageUrl ? (
                  <img src={r.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-sm">🔹</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {r.title}
                  {r.verified && <span className="ml-1 text-[var(--color-gold,#FFD740)]">✓</span>}
                </p>
                {r.subtitle && (
                  <p className="truncate text-[11px] text-muted-foreground">{r.subtitle}</p>
                )}
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium capitalize"
                style={{
                  backgroundColor: `color-mix(in srgb, ${categoryMinerals[r.type]} 15%, transparent)`,
                  color: categoryMinerals[r.type],
                }}
              >
                {r.type}
              </span>
            </button>
          ))}
        </div>
      ) : localQuery ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No results for &quot;{localQuery}&quot;</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentSearches.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold text-muted-foreground">Recent</p>
              <div className="space-y-1">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setLocalQuery(s)
                      onSearch?.(s)
                    }}
                    className="flex w-full items-center gap-2 rounded-[var(--radius-sm,7px)] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    🕐 {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {trending.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold text-muted-foreground">Trending</p>
              <div className="flex flex-wrap gap-1.5">
                {trending.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setLocalQuery(t)
                      onSearch?.(t)
                    }}
                    className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
