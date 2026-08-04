"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI SETTINGS PAGE — Layer 6 Page Orchestrator
   
   Standard settings layout. Sidebar nav on desktop, accordion
   on mobile. Consistent setting row patterns.
   ✅ HARNESS  ✅ TOKENS  ✅ RESPONSIVE  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface SettingSection {
  id: string
  label: string
  icon?: React.ReactNode
}
interface NyuchiSettingsPageProps {
  title?: string
  sections: SettingSection[]
  activeSection?: string
  onSectionChange?: (id: string) => void
  children: React.ReactNode
  className?: string
}

export function NyuchiSettingsPage({
  title = "Settings",
  sections,
  activeSection,
  onSectionChange,
  children,
  className,
}: NyuchiSettingsPageProps) {
  const [active, setActive] = React.useState(activeSection || sections[0]?.id)

  return (
    <div
      data-slot="nyuchi-settings-page"
      data-portal="https://mzizi.dev/components/nyuchi-settings-page"
      role="main"
      aria-label="Settings"
      className={cn("min-h-screen bg-background", className)}
    >
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <h1 className="mb-6 text-xl font-bold text-foreground">{title}</h1>
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Sidebar nav (desktop) / horizontal scroll (mobile) */}
          <nav className="shrink-0 md:w-48">
            <div className="flex scrollbar-none gap-1 overflow-x-auto md:flex-col md:overflow-visible">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActive(s.id)
                    onSectionChange?.(s.id)
                  }}
                  className={cn(
                    "flex min-h-[48px] shrink-0 items-center gap-2 rounded-[var(--radius-md,12px)] px-3 py-2.5 text-sm font-medium transition-colors",
                    active === s.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {s.icon && <span className="text-base">{s.icon}</span>}
                  {s.label}
                </button>
              ))}
            </div>
          </nav>
          {/* Content */}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
