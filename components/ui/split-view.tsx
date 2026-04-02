"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface SplitViewProps extends React.ComponentProps<"div"> {
  sidebar: React.ReactNode
  content: React.ReactNode
  sidebarWidth?: string
  sidebarPosition?: "left" | "right"
}

function SplitView({
  className,
  sidebar,
  content,
  sidebarWidth = "320px",
  sidebarPosition = "left",
  ...props
}: SplitViewProps) {
  return (
    <div
      data-slot="split-view"
      className={cn(
        "flex min-h-0 w-full flex-col md:flex-row",
        sidebarPosition === "right" && "md:flex-row-reverse",
        className
      )}
      {...props}
    >
      <aside
        data-slot="split-view-sidebar"
        className={cn(
          "border-border w-full shrink-0 overflow-y-auto",
          sidebarPosition === "left"
            ? "border-b md:border-b-0 md:border-r"
            : "border-b md:border-b-0 md:border-l"
        )}
        style={{ maxWidth: undefined }}
      >
        <div className="md:sticky md:top-0" style={{ width: "100%", maxWidth: sidebarWidth }}>
          {sidebar}
        </div>
      </aside>
      <main
        data-slot="split-view-content"
        className="min-w-0 flex-1 overflow-y-auto"
      >
        {content}
      </main>
    </div>
  )
}

export { SplitView, type SplitViewProps }
