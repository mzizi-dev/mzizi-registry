/* ═══════════════════════════════════════════════════════════════
   PROFILE PAGE — Layer 6 (Page Composition)
   
   COMPOSITION: Should compose nyuchi-cover-header (L3) for the
   cover image + avatar section instead of rendering inline.
   COMPOSITION: Should compose nyuchi-profile-block (L3) for the
   name + badge + stats section.
   
   Currently approved for use as-is. Refactor tracked.
   ═══════════════════════════════════════════════════════════════ */
"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
// COMPOSITION: Uses NyuchiCoverHeader from @/components/brand/nyuchi-cover-header
// import { NyuchiCoverHeader } from "@/components/brand/nyuchi-cover-header"

interface OrgProfile {
  name: string
  logo?: string
  cover?: string
  description?: string
  category?: string
  verified?: boolean
  location?: string
  memberCount?: number
  website?: string
}
interface OrgProfilePageProps {
  org?: OrgProfile
  tabs?: { key: string; label: string }[]
  activeTab?: string
  onTabChange?: (key: string) => void
  isAdmin?: boolean
  onManage?: () => void
  children?: React.ReactNode
  loading?: boolean
  className?: string
}

export function OrgProfilePage({
  org,
  tabs,
  activeTab,
  onTabChange,
  isAdmin,
  onManage,
  children,
  loading = false,
  className,
}: OrgProfilePageProps) {
  const { motion } = useNyuchiHarness("org-profile-page")
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
        data-slot="org-profile-page"
        data-portal="https://mzizi.dev/components/org-profile-page"
        data-loading
        role="main"
        className="animate-pulse"
      >
        <div className="h-40 bg-muted" />
        <div className="space-y-3 p-4">
          <div className="h-8 w-1/2 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
        </div>
      </main>
    )
  return (
    <main
      data-slot="org-profile-page"
      role="main"
      aria-label={org?.name || "Organization"}
      style={animStyle}
      className={cn("flex flex-col", className)}
    >
      {org?.cover && (
        <div
          className="h-40 bg-cover bg-center sm:h-56"
          style={{ backgroundImage: `url(${org.cover})` }}
        />
      )}
      <div className="px-4 pb-4">
        <div className="-mt-8 flex items-end justify-between">
          <div className="size-16 overflow-hidden rounded-[var(--radius-lg,14px)] border border-4 border-background border-border bg-card">
            {org?.logo && <img src={org.logo} alt="" className="size-full object-cover" />}
          </div>
          {isAdmin && onManage && (
            <button
              onClick={onManage}
              className="min-h-[48px] rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              Manage
            </button>
          )}
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{org?.name}</h1>
            {org?.verified && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="var(--tier-licensed, var(--status-warning, var(--color-gold, #FFD740)))"
                aria-label="Verified"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          {org?.category && <p className="text-sm text-muted-foreground">{org.category}</p>}
          {org?.description && <p className="mt-2 text-sm text-foreground">{org.description}</p>}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {org?.location && <span>{org.location}</span>}
            {org?.memberCount && <span>{org.memberCount} members</span>}
            {org?.website && (
              <a href={org.website} className="text-primary hover:underline">
                {org.website}
              </a>
            )}
          </div>
        </div>
      </div>
      {tabs && (
        <nav
          aria-label="Organization sections"
          className="flex overflow-x-auto border-b border-border px-4"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange?.(t.key)}
              aria-selected={activeTab === t.key}
              className={cn(
                "min-h-[48px] shrink-0 border-b-2 px-4 text-sm font-medium transition-colors",
                activeTab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}
      <div className="p-4">{children}</div>
    </main>
  )
}
export type { OrgProfile, OrgProfilePageProps }
