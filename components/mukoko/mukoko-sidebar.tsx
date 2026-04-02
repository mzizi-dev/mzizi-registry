"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { MukokoLogo } from "@/components/brand/mukoko-logo"
import { MineralStrip } from "@/components/brand/mineral-strip"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

export interface SidebarItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  active?: boolean
  children?: SidebarItem[]
}

export interface SidebarSection {
  label?: string
  items: SidebarItem[]
}

interface MukokoSidebarProps {
  sections: SidebarSection[]
  appName?: string
  header?: React.ReactNode
  footer?: React.ReactNode
  collapsible?: "offcanvas" | "icon" | "none"
  variant?: "sidebar" | "floating" | "inset"
  className?: string
}

export function MukokoSidebar({
  sections,
  appName,
  header,
  footer,
  collapsible = "icon",
  variant = "sidebar",
  className,
}: MukokoSidebarProps) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <Sidebar
      data-slot="mukoko-sidebar"
      collapsible={collapsible}
      variant={variant}
      className={cn(className)}
    >
      {/* Mineral accent strip */}
      <div className="flex h-1 w-full">
        <MineralStrip
          thickness={4}
          className="h-1 w-full flex-row rounded-none"
        />
      </div>

      <SidebarHeader>
        {header ?? (
          <a href="/" className="flex items-center gap-2 px-2 py-1.5">
            <MukokoLogo size={22} suffix={appName} />
          </a>
        )}
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {sections.map((section, sectionIdx) => (
          <SidebarGroup key={section.label ?? sectionIdx}>
            {section.label && (
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = item.active ?? isActive(item.href)
                  const Icon = item.icon

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                      >
                        <a href={item.href}>
                          {Icon && <Icon className="size-4" />}
                          <span>{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                      {item.badge != null && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                      {item.children && item.children.length > 0 && (
                        <SidebarMenuSub>
                          {item.children.map((child) => {
                            const childActive =
                              child.active ?? isActive(child.href)
                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={childActive}
                                >
                                  <a href={child.href}>
                                    <span>{child.label}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {footer ?? (
          <div className="flex items-center justify-between px-2 py-1">
            <ThemeToggle />
            <span className="font-mono text-[10px] text-muted-foreground">
              v4.0.1
            </span>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
