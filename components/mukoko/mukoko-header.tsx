"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MukokoLogo } from "@/components/brand/mukoko-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ExternalLink } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  external?: boolean
}

interface MukokoHeaderProps {
  appName?: string
  navItems?: NavItem[]
  actions?: React.ReactNode
  showSearch?: boolean
  className?: string
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Components", href: "/components" },
  { label: "Brand", href: "/brand" },
  { label: "Architecture", href: "/architecture" },
  { label: "API", href: "/api-docs" },
]

export function MukokoHeader({
  appName,
  navItems = DEFAULT_NAV_ITEMS,
  actions,
  className,
}: MukokoHeaderProps) {
  return (
    <header
      data-slot="mukoko-header"
      className={cn(
        "sticky top-0 z-50 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-xl",
        className
      )}
    >
      {/* Mobile sidebar trigger */}
      <SidebarTrigger className="md:hidden" />

      {/* Logo */}
      <a href="/" className="flex items-center">
        <MukokoLogo size={24} suffix={appName} />
      </a>

      {/* Desktop navigation */}
      <nav className="ml-6 hidden items-center gap-1 md:flex">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {item.label}
            {item.external && <ExternalLink className="size-3 opacity-50" />}
          </a>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions area */}
      <div className="flex items-center gap-1">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  )
}
