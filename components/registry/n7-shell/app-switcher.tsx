"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──────────────────
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import {
  CloudSunIcon,
  NewspaperIcon,
  CalendarIcon,
  LayoutGridIcon,
  GlobeIcon,
  type LucideIcon,
} from "@/lib/icons"
import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

/* ═══════════════════════════════════════════════════════════════
   APP SWITCHER — Brand Shell Component (Enterprise)
   
   The ecosystem navigation hub. Lets users switch between
   ecosystem products (nhimbe, Bush Trade, Shamwari, etc.)
   
   ✅ L1 TOKENS — Active state uses brand accent tokens
   ✅ L2 MOTION — Grid items stagger on popover open
   ✅ L3 A11Y — Focus ring tokens, ARIA labels, 48px targets
   ✅ L4 OBSERVABILITY — useNyuchiHarness, scoped logging
   ✅ L5 RESILIENCE — Guards against empty app list
   ✅ L7 PLATFORM — data-slot for CSS targeting
   ═══════════════════════════════════════════════════════════════ */

interface AppItem {
  name: string
  icon?: LucideIcon
  href: string
  active?: boolean
  /** Mineral accent color for this app */
  mineral?: "malachite" | "cobalt" | "gold" | "tanzanite" | "terracotta"
}

interface AppSwitcherProps {
  apps?: AppItem[]
  currentApp?: string
  className?: string
}

const DEFAULT_APPS: AppItem[] = [
  { name: "mukoko", icon: LayoutGridIcon, href: "https://mukoko.com", mineral: "malachite" },
  { name: "weather", icon: CloudSunIcon, href: "https://weather.mukoko.com", mineral: "cobalt" },
  { name: "news", icon: NewspaperIcon, href: "https://news.mukoko.com", mineral: "tanzanite" },
  { name: "nhimbe", icon: CalendarIcon, href: "https://events.mukoko.com", mineral: "malachite" },
  { name: "registry", icon: GlobeIcon, href: "https://mzizi.dev", mineral: "gold" },
]

function AppSwitcher({ apps = DEFAULT_APPS, currentApp, className }: AppSwitcherProps) {
  // ── L4: HARNESS — Observability + motion + a11y ──
  const { motion, LiveRegion } = useNyuchiHarness("app-switcher")

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          data-slot="app-switcher"
          data-portal="https://mzizi.dev/components/app-switcher"
          variant="ghost"
          size="icon"
          aria-label="Switch between ecosystem apps"
          className={cn(
            /* L3: A11Y — Min touch target + focus ring tokens */
            "min-h-[48px] min-w-[44px]",
            "focus-visible:outline-[length:var(--focusRing-width,2px)]",
            "focus-visible:outline-[var(--color-primary)]",
            "focus-visible:outline-offset-[var(--focusRing-offset,2px)]",
            className
          )}
        >
          <LayoutGridIcon />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 rounded-[var(--radius-card,14px)] p-2" align="end">
        {LiveRegion}

        <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">Mukoko Ecosystem</div>

        <div className="grid grid-cols-3 gap-1" role="menu" aria-label="ecosystem apps">
          {/* L5: RESILIENCE — Guard against empty/undefined apps */}
          {(apps ?? []).map((app, index) => {
            const Icon = app.icon ?? GlobeIcon
            const isCurrent = app.name === currentApp

            // ── L2: MOTION — Stagger animation per grid item ──
            const itemStyle = motion.prefersReduced
              ? {}
              : {
                  animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
                  animationDelay: `${motion.staggerDelay(index)}ms`,
                }

            return (
              <a
                key={app.name}
                href={app.href}
                role="menuitem"
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2.5 text-xs transition-colors",
                  /* L1: TOKENS — Radius + hover using brand tokens */
                  "rounded-[var(--radius-inner,7px)]",
                  "hover:bg-muted",
                  isCurrent &&
                    "bg-[var(--brand-accent,var(--color-primary, #00B0FF))]/10 font-medium",
                  /* L3: A11Y — Min touch target + focus ring */
                  "min-h-[48px]",
                  "focus-visible:outline-[length:var(--focusRing-width,2px)]",
                  "focus-visible:outline-[var(--color-primary)]",
                  "focus-visible:outline-offset-[var(--focusRing-offset,2px)]"
                )}
                style={itemStyle}
              >
                <Icon
                  className="size-5"
                  style={{
                    /* L1: TOKENS — Active icon uses mineral accent */
                    color: isCurrent ? `var(--color-${app.mineral || "malachite"})` : undefined,
                  }}
                />
                <span className="truncate">{app.name}</span>
              </a>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { AppSwitcher }
export type { AppSwitcherProps, AppItem }
