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

interface ProfileUser {
  name: string
  handle?: string
  avatar?: string
  bio?: string
  verificationTier?: string
  trustScore?: number
  stats?: { label: string; value: string | number }[]
  coverImage?: string
}
interface IndividualProfilePageProps {
  user?: ProfileUser
  tabs?: { key: string; label: string; count?: number }[]
  activeTab?: string
  onTabChange?: (key: string) => void
  isOwnProfile?: boolean
  onEdit?: () => void
  children?: React.ReactNode
  loading?: boolean
  className?: string
}

export function IndividualProfilePage({
  user,
  tabs,
  activeTab,
  onTabChange,
  isOwnProfile,
  onEdit,
  children,
  loading = false,
  className,
}: IndividualProfilePageProps) {
  const { motion } = useNyuchiHarness("individual-profile-page")
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
        data-slot="individual-profile-page"
        data-portal="https://mzizi.dev/components/individual-profile-page"
        data-loading
        role="main"
        className="animate-pulse"
      >
        <div className="h-32 bg-muted" />
        <div className="space-y-3 p-4">
          <div className="-mt-8 h-16 w-16 rounded-full bg-muted" />
          <div className="h-6 w-1/3 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      </main>
    )
  return (
    <main
      data-slot="individual-profile-page"
      role="main"
      aria-label={user?.name || "Profile"}
      style={animStyle}
      className={cn("flex flex-col", className)}
    >
      {user?.coverImage && (
        <div
          className="h-32 bg-cover bg-center sm:h-48"
          style={{ backgroundImage: `url(${user.coverImage})` }}
        />
      )}
      <div className="px-4 pb-4">
        <div className="-mt-10 flex items-end justify-between">
          <div className="size-20 overflow-hidden rounded-full border-4 border-background bg-muted">
            {user?.avatar && <img src={user.avatar} alt="" className="size-full object-cover" />}
          </div>
          {isOwnProfile && onEdit && (
            <button
              onClick={onEdit}
              className="min-h-[48px] rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              Edit Profile
            </button>
          )}
        </div>
        <div className="mt-3">
          <h1 className="text-xl font-bold">{user?.name}</h1>
          {user?.handle && <p className="text-sm text-muted-foreground">@{user.handle}</p>}
          {user?.bio && <p className="mt-2 text-sm text-foreground">{user.bio}</p>}
          {user?.verificationTier && (
            <span
              className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor:
                  "var(--tier-community, var(--status-success, var(--color-malachite, #64FFDA)))",
                color: "black",
                opacity: 0.9,
              }}
            >
              {user.verificationTier}
            </span>
          )}
        </div>
        {user?.stats && (
          <div className="mt-3 flex gap-4">
            {user.stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-sm font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {tabs && (
        <nav aria-label="Profile sections" className="flex border-b border-border px-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange?.(t.key)}
              aria-selected={activeTab === t.key}
              className={cn(
                "min-h-[48px] border-b-2 px-4 text-sm font-medium transition-colors",
                activeTab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {t.count != null && (
                <span className="ml-1 text-xs text-muted-foreground">({t.count})</span>
              )}
            </button>
          ))}
        </nav>
      )}
      <div className="p-4">{children}</div>
    </main>
  )
}
export type { ProfileUser, IndividualProfilePageProps }
