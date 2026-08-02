"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface NavItem {
  key: string
  label: string
  icon?: React.ReactNode
  badge?: number
  section?: string
}

interface NyuchiSidebarNavProps {
  items: NavItem[]
  activeKey?: string
  onSelect?: (key: string) => void
  title?: string
  width?: string
  className?: string
}

export function NyuchiSidebarNav({
  items,
  activeKey,
  onSelect,
  title,
  width = "w-56",
  className,
}: NyuchiSidebarNavProps) {
  const { motion } = useNyuchiHarness("sidebar-nav")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  const sections = React.useMemo(() => {
    const grouped: Record<string, NavItem[]> = {}
    items.forEach((item) => {
      const s = item.section || "_default"
      ;(grouped[s] ||= []).push(item)
    })
    return grouped
  }, [items])

  return (
    <aside
      data-slot="nyuchi-sidebar-nav"
      data-portal="https://mzizi.dev/components/nyuchi-sidebar-nav"
      role="navigation"
      aria-label={title || "Sidebar"}
      style={animStyle}
      className={cn(width, "shrink-0 overflow-y-auto border-r border-border p-3", className)}
    >
      {title && (
        <p
          className="mb-3 px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {title}
        </p>
      )}
      {Object.entries(sections).map(([section, sectionItems]) => (
        <div key={section} className="mb-2">
          {section !== "_default" && (
            <p className="mb-1 px-2 pt-2 text-[10px] font-medium tracking-wider text-muted-foreground/60 uppercase">
              {section}
            </p>
          )}
          {sectionItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onSelect?.(item.key)}
              className={cn(
                "flex min-h-[48px] w-full items-center justify-between rounded-[var(--radius-sm,7px)] px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                activeKey === item.key
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge != null && item.badge > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      ))}
    </aside>
  )
}
export type { NavItem, NyuchiSidebarNavProps }
