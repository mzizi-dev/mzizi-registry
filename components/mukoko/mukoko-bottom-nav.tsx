"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export interface BottomNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon?: React.ComponentType<{ className?: string }>
}

interface MukokoBottomNavProps {
  items: BottomNavItem[]
  className?: string
}

export function MukokoBottomNav({ items, className }: MukokoBottomNavProps) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <nav
      data-slot="mukoko-bottom-nav"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl md:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="flex items-center justify-around px-2">
        {items.map((item) => {
          const active = isActive(item.href)
          const Icon = active && item.activeIcon ? item.activeIcon : item.icon

          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                active
                  ? "text-[var(--color-cobalt)] dark:text-[var(--color-malachite)]"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="font-medium">{item.label}</span>
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[var(--color-cobalt)] dark:bg-[var(--color-malachite)]" />
              )}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
