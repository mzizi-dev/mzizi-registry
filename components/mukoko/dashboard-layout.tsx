"use client"

import { cn } from "@/lib/utils"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import {
  MukokoSidebar,
  type SidebarSection,
} from "@/components/mukoko/mukoko-sidebar"
import { MukokoHeader, type NavItem } from "@/components/mukoko/mukoko-header"
import {
  MukokoBottomNav,
  type BottomNavItem,
} from "@/components/mukoko/mukoko-bottom-nav"

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
  return (
    <SidebarProvider>
      <MukokoSidebar
        sections={sidebarSections}
        appName={appName}
        collapsible="icon"
      />
      <SidebarInset>
        <MukokoHeader
          appName={appName}
          navItems={navItems}
          actions={headerActions}
        />
        <main
          data-slot="dashboard-layout"
          className={cn("flex-1 p-4 sm:p-6", className)}
        >
          {children}
        </main>
      </SidebarInset>
      {bottomNav && bottomNav.length > 0 && (
        <MukokoBottomNav items={bottomNav} />
      )}
    </SidebarProvider>
  )
}
