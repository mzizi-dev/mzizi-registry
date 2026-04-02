"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function SettingsLayout({
  className,
  children,
  sidebar,
  ...props
}: React.ComponentProps<"div"> & {
  sidebar: React.ReactNode
}) {
  return (
    <div
      data-slot="settings-layout"
      className={cn(
        "flex flex-col gap-6 md:flex-row md:gap-10",
        className
      )}
      {...props}
    >
      <aside
        data-slot="settings-layout-sidebar"
        className="w-full shrink-0 md:sticky md:top-20 md:w-56 md:self-start"
      >
        {sidebar}
      </aside>
      <main
        data-slot="settings-layout-content"
        className="flex-1 min-w-0"
      >
        {children}
      </main>
    </div>
  )
}

function SettingsNav({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="settings-nav"
      className={cn(
        "flex gap-1 overflow-x-auto md:flex-col md:overflow-visible",
        className
      )}
      {...props}
    />
  )
}

function SettingsNavItem({
  className,
  active = false,
  ...props
}: React.ComponentProps<"a"> & {
  active?: boolean
}) {
  return (
    <a
      data-slot="settings-nav-item"
      data-active={active}
      className={cn(
        "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SettingsSection({
  className,
  title,
  description,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  title: string
  description?: string
}) {
  return (
    <section
      data-slot="settings-section"
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <div className="ring-foreground/10 rounded-2xl bg-card p-6 ring-1">
        {children}
      </div>
    </section>
  )
}

export { SettingsLayout, SettingsNav, SettingsNavItem, SettingsSection }
