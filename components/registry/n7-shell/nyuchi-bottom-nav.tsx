"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.

import * as React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Plus } from "@/lib/icons"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI BOTTOM NAV — Brand Shell Component
   
   5-item bottom navigation with an optional center FAB.
   The center FAB is raised above the bar with a malachite
   background and glow shadow — this is the universal "create"
   entry point across all ecosystem apps.
   
   Brand identity markers:
   - Active item has top accent bar (2.5px malachite line)
   - 10px labels, Noto Sans
   - FAB rises 24px above the bar with accent glow
   - Blur background with border-top
   ═══════════════════════════════════════════════════════════════ */

export interface BottomNavItem {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Route path */
  href: string
  /** Default icon */
  icon: React.ComponentType<{ className?: string }>
  /** Active state icon (optional, falls back to icon) */
  activeIcon?: React.ComponentType<{ className?: string }>
  /** Whether this item is the center FAB */
  isFab?: boolean
  /** FAB click handler (overrides href for FAB items) */
  onFabClick?: () => void
}

interface NyuchiBottomNavProps {
  items: BottomNavItem[]
  /** Override active detection (useful for client-side routing) */
  activeId?: string
  className?: string
}

export function NyuchiBottomNav({ items, activeId, className }: NyuchiBottomNavProps) {
  const pathname = usePathname()

  function isActive(item: BottomNavItem): boolean {
    if (activeId) return activeId === item.id
    if (item.href === "/") return pathname === "/"
    return pathname === item.href || pathname.startsWith(item.href + "/")
  }

  return (
    <nav
      data-slot="nyuchi-bottom-nav"
      data-portal="https://mzizi.dev/components/nyuchi-bottom-nav"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex h-20 items-center justify-around",
        "border-t border-border bg-card/90 backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)] md:hidden [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:focus-visible:outline-primary [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-primary",
        className
      )}
    >
      {items.map((item) => {
        const active = isActive(item)

        /* ── Center FAB ─────────────────────────────────────── */
        if (item.isFab) {
          return (
            <button
              key={item.id}
              onClick={item.onFabClick}
              aria-label={item.label}
              className={cn(
                "flex size-[52px] -translate-y-6 items-center justify-center rounded-full",
                "bg-[var(--brand-accent,var(--color-primary,#00B0FF))] shadow-[0_4px_20px_var(--brand-accent-glow,rgba(100,255,218,0.3))]",
                "transition-transform active:scale-95"
              )}
            >
              <Plus className="size-[26px] text-background" strokeWidth={2.5} />
            </button>
          )
        }

        /* ── Standard nav item ──────────────────────────────── */
        const Icon = active && item.activeIcon ? item.activeIcon : item.icon
        return (
          <a
            key={item.id}
            href={item.href}
            className={cn(
              "relative flex min-w-[56px] flex-col items-center gap-[3px] py-1",
              "text-[10px] font-medium transition-colors",
              active
                ? "text-[var(--brand-accent,var(--color-primary,#00B0FF))]"
                : "text-muted-foreground"
            )}
          >
            {/* Active top accent bar — brand identity marker */}
            {active && (
              <span className="absolute -top-[9px] h-[2.5px] w-7 rounded-full bg-[var(--brand-accent,var(--color-primary,#00B0FF))]" />
            )}
            <Icon className={cn("size-[21px]", active ? "stroke-[2.2]" : "stroke-[1.8]")} />
            <span>{item.label}</span>
          </a>
        )
      })}
    </nav>
  )
}
