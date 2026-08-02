"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
interface AdminNavItem {
  key: string
  label: string
  icon?: React.ReactNode
  badge?: number
}
interface AdminPageProps {
  title?: string
  navItems?: AdminNavItem[]
  activeNav?: string
  onNavChange?: (key: string) => void
  actions?: React.ReactNode
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function AdminPage({
  title = "Admin",
  navItems,
  activeNav,
  onNavChange,
  actions,
  children,
  loading = false,
  className,
}: AdminPageProps) {
  const { motion } = useNyuchiHarness("admin-page")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  if (loading)
    return (
      <main
        data-slot="admin-page"
        data-portal="https://mzizi.dev/components/admin-page"
        data-loading
        role="main"
        className="flex h-screen animate-pulse"
      >
        <div className="w-56 bg-muted" />
        <div className="flex-1 space-y-4 p-6">
          <div className="h-8 w-1/3 rounded bg-muted" />
          <div className="h-64 rounded-[var(--radius-lg,14px)] bg-muted" />
        </div>
      </main>
    )
  return (
    <main
      data-slot="admin-page"
      role="main"
      aria-label={title}
      style={animStyle}
      className={cn("flex h-screen overflow-hidden", className)}
    >
      {navItems && (
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-border p-3">
          <p className="mb-3 px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {title}
          </p>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavChange?.(item.key)}
              className={cn(
                "flex min-h-[44px] w-full items-center justify-between rounded-[var(--radius-sm,7px)] px-3 py-2 text-sm transition-colors",
                activeNav === item.key
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge != null && item.badge > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </aside>
      )}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {actions && (
          <header className="flex items-center justify-between border-b border-border px-6 py-3">
            {actions}
          </header>
        )}
        <div className="flex-1 p-6">{children}</div>
      </div>
    </main>
  )
}
export type { AdminNavItem, AdminPageProps }
