"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
interface TeamMember {
  name: string
  email: string
  role: string
  avatar?: string
  status?: "active" | "invited" | "suspended"
}
interface TeamManagementPageProps {
  teamName?: string
  members?: TeamMember[]
  inviteAction?: () => void
  tabs?: { key: string; label: string }[]
  activeTab?: string
  onTabChange?: (key: string) => void
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function TeamManagementPage({
  teamName,
  members,
  inviteAction,
  tabs,
  activeTab,
  onTabChange,
  children,
  loading = false,
  className,
}: TeamManagementPageProps) {
  const { motion } = useNyuchiHarness("team-management-page")
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
        data-slot="team-management-page"
        data-portal="https://mzizi.dev/components/team-management-page"
        data-loading
        role="main"
        className="animate-pulse space-y-4 p-6"
      >
        <div className="h-8 w-1/3 rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-[var(--radius-lg,14px)] bg-muted" />
        ))}
      </main>
    )
  return (
    <main
      data-slot="team-management-page"
      role="main"
      aria-label={teamName ? `${teamName} Team` : "Team"}
      style={animStyle}
      className={cn("flex flex-col gap-6 p-6", className)}
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{teamName || "Team"}</h1>
          {members && (
            <p className="text-sm text-muted-foreground">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {inviteAction && (
          <button
            onClick={inviteAction}
            className="min-h-[48px] rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          >
            Invite Member
          </button>
        )}
      </header>
      {tabs && (
        <nav aria-label="Team sections" className="flex border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange?.(t.key)}
              className={cn(
                "min-h-[48px] border-b-2 px-4 text-sm font-medium transition-colors",
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
      {members && (
        <section
          aria-label="Members"
          className="divide-y divide-border rounded-[var(--radius-lg,14px)] border border-border bg-card"
        >
          {members.map((m, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="size-9 overflow-hidden rounded-full bg-muted">
                  {m.avatar && <img src={m.avatar} alt="" className="size-full object-cover" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{m.role}</span>
                {m.status === "invited" && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--status-warning, var(--color-gold, #FFD740))" }}
                  >
                    Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
      {children}
    </main>
  )
}
export type { TeamMember, TeamManagementPageProps }
