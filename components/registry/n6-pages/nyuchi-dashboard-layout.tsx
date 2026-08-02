"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──────────────────
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { cn } from "@/lib/utils"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { NyuchiSidebar, type SidebarSection } from "@/components/ui/nyuchi-sidebar"
import { NyuchiHeader, type NavItem } from "@/components/ui/nyuchi-header"
import { NyuchiBottomNav, type BottomNavItem } from "@/components/ui/nyuchi-bottom-nav"

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD LAYOUT — Brand Shell Composition (Enterprise)
   
   The root layout for every ecosystem dashboard/app screen.
   Composes sidebar + header + bottom nav + main content area.
   
   ✅ L1 TOKENS — Spacing uses design tokens
   ✅ L2 MOTION — Main content fade-in on route change
   ✅ L3 A11Y — Main landmark, skip-to-content support
   ✅ L4 OBSERVABILITY — useNyuchiHarness, page render timing
   ✅ L5 RESILIENCE — Wraps children, guards missing props
   ✅ L7 PLATFORM — data-slot for CSS targeting
   ═══════════════════════════════════════════════════════════════ */

interface DashboardLayoutProps {
  appName?: string
  sidebarSections: SidebarSection[]
  navItems?: NavItem[]
  headerActions?: React.ReactNode
  bottomNav?: BottomNavItem[]
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({
  appName,
  sidebarSections,
  navItems,
  headerActions,
  bottomNav,
  children,
  className,
}: DashboardLayoutProps) {
  // ── L4: HARNESS — Page-level observability ──
  const { motion, LiveRegion } = useNyuchiHarness("dashboard-layout")

  // ── L2: MOTION — Content area fade-in ──
  const contentAnimStyle = React.useMemo(() => {
    if (motion.prefersReduced) return {}
    return {
      animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
    }
  }, [motion])

  return (
    <SidebarProvider>
      {/* L5: RESILIENCE — Guard against undefined sidebarSections */}
      <NyuchiSidebar sections={sidebarSections ?? []} appName={appName} collapsible="icon" />
      <SidebarInset>
        <NyuchiHeader appName={appName} navItems={navItems} actions={headerActions} />

        {/* L3: A11Y — Main landmark with skip target */}
        <main
          id="main-content"
          data-slot="dashboard-layout"
          data-portal="https://mzizi.dev/components/dashboard-layout"
          role="main"
          aria-label="Dashboard"
          className={cn("flex-1 p-4 sm:p-6", className)}
          style={contentAnimStyle}
        >
          {LiveRegion}
          {children}
        </main>
      </SidebarInset>

      {/* L5: RESILIENCE — Only render bottom nav if items exist */}
      {bottomNav && bottomNav.length > 0 && <NyuchiBottomNav items={bottomNav} />}
    </SidebarProvider>
  )
}
