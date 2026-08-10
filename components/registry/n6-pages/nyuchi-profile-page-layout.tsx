"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI PROFILE PAGE LAYOUT — Layer 6 Page Orchestrator
   
   Standard profile screen. Cover + avatar + stats + tabs.
   Used for users, businesses, organisations, groups, creators.
   ✅ HARNESS  ✅ TOKENS  ✅ RESPONSIVE  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface ProfileTab {
  id: string
  label: string
  count?: number
}
interface ProfileStat {
  label: string
  value: string | number
}

interface NyuchiProfilePageLayoutProps {
  coverUrl?: string
  avatarUrl?: string
  name: string
  subtitle?: string
  verified?: boolean
  verificationTier?: 0 | 1 | 2 | 3 | 4
  stats?: ProfileStat[]
  tabs: ProfileTab[]
  activeTab?: string
  onTabChange?: (id: string) => void
  /** Primary action (Follow, Edit, Contact) */
  primaryAction?: { label: string; onClick: () => void }
  /** Secondary action (Message, Share) */
  secondaryAction?: { label: string; onClick: () => void }
  /** Back navigation */
  onBack?: () => void
  /** Tab content */
  children: React.ReactNode
  className?: string
}

const tierBadge = ["", "🟤", "🔵", "🟡", "🟣"] as const

export function NyuchiProfilePageLayout({
  coverUrl,
  avatarUrl,
  name,
  subtitle,
  verified,
  verificationTier = 0,
  stats,
  tabs,
  activeTab,
  onTabChange,
  primaryAction,
  secondaryAction,
  onBack,
  children,
  className,
}: NyuchiProfilePageLayoutProps) {
  const [active, setActive] = React.useState(activeTab || tabs[0]?.id)

  return (
    <div
      data-slot="nyuchi-profile-page-layout"
      data-portal="https://mzizi.dev/components/nyuchi-profile-page-layout"
      className={cn("min-h-screen bg-background", className)}
    >
      {/* Cover */}
      <div
        className="relative h-40 bg-gradient-to-br from-[var(--brand-accent,var(--status-success,var(--color-malachite,#64FFDA)))]/20 to-muted sm:h-52"
        style={
          coverUrl
            ? {
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 flex size-10 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm"
            aria-label="Go back"
          >
            ←
          </button>
        )}
      </div>

      {/* Avatar + name block — overlapping cover */}
      <div className="relative -mt-12 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted text-2xl font-bold text-muted-foreground sm:size-24">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="size-full object-cover" />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-lg font-bold text-foreground">{name}</h1>
                {verified && verificationTier > 0 && <span>{tierBadge[verificationTier]}</span>}
              </div>
              {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>

          {/* Stats */}
          {stats && stats.length > 0 && (
            <div className="mt-4 flex gap-6">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-base font-bold text-foreground">
                    {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {(primaryAction || secondaryAction) && (
            <div className="mt-4 flex gap-2">
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  className="h-12 flex-1 rounded-full bg-[var(--brand-accent,var(--status-success,var(--color-malachite,#64FFDA)))] text-[13px] font-medium text-[var(--brand-accent-foreground,#0A0A0A)] transition-opacity hover:opacity-80"
                >
                  {primaryAction.label}
                </button>
              )}
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className="h-12 flex-1 rounded-full border border-border bg-muted text-[13px] font-medium text-foreground transition-opacity hover:opacity-80"
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="mt-6 flex scrollbar-none gap-0 overflow-x-auto border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActive(t.id)
                  onTabChange?.(t.id)
                }}
                className={cn(
                  "min-h-[48px] shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  active === t.id
                    ? "border-[var(--brand-accent,var(--status-success,var(--color-malachite,#64FFDA)))] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                {t.count != null && (
                  <span className="ml-1.5 text-xs text-muted-foreground">{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  )
}
