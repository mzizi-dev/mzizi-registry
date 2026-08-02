"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI PRODUCT RESULTS — Agentic Component (UCP search, top 3–5)
   ✅ HARNESS  ✅ TOKENS  ✅ A11Y  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

export interface ProductResult {
  id: string
  name: string
  priceLabel?: string
  productType?: string
  description?: string
}

export interface NyuchiProductResultsProps {
  heading?: string
  results: ProductResult[]
  onSelect: (id: string) => void
  className?: string
}

export function NyuchiProductResults({
  heading = "Top results",
  results,
  onSelect,
  className,
}: NyuchiProductResultsProps) {
  const { log } = useNyuchiHarness("product-results")
  const top = results.slice(0, 5)

  return (
    <div
      data-slot="nyuchi-product-results"
      data-portal="https://mzizi.dev/components/nyuchi-product-results"
      className={cn(
        "w-full max-w-md rounded-[var(--radius-xl,17px)] border border-border",
        "bg-[var(--card)] p-3 text-[var(--card-foreground)] shadow-[var(--shadow-lg)]",
        className
      )}
    >
      <h3 className="px-2 py-1 text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
        {heading}
      </h3>
      <ul className="grid gap-1">
        {top.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => {
                log.info("result_select", { id: r.id })
                onSelect(r.id)
              }}
              className={cn(
                "flex min-h-[48px] w-full items-center justify-between gap-3 rounded-[var(--radius,10px)] px-3 text-left text-sm",
                "transition-colors hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:outline-none",
                "focus-visible:ring-[var(--brand-accent,var(--ring))]"
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{r.name}</span>
                {r.description && (
                  <span className="block truncate text-xs text-[var(--muted-foreground)]">
                    {r.description}
                  </span>
                )}
              </span>
              {r.priceLabel && (
                <span className="shrink-0 text-sm font-semibold text-[var(--brand-accent,var(--primary))]">
                  {r.priceLabel}
                </span>
              )}
            </button>
          </li>
        ))}
        {top.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-[var(--muted-foreground)]">
            No matches.
          </li>
        )}
      </ul>
    </div>
  )
}
