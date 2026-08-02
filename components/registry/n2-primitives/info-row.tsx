"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   INFO ROW — Layer 2 Primitive
   Label + value row for detail pages.
   ✅ TOKENS  ✅ ARIA  ✅ LOADING
   ═══════════════════════════════════════════════════════════════ */

interface InfoRowProps {
  icon?: React.ReactNode
  label: string
  value: string | React.ReactNode
  loading?: boolean
  className?: string
}

export function InfoRow({ icon, label, value, loading = false, className }: InfoRowProps) {
  if (loading) {
    return (
      <div
        data-slot="info-row"
        data-portal="https://mzizi.dev/components/info-row"
        data-loading
        className={cn("flex animate-pulse items-center justify-between py-2.5", className)}
      >
        <div className="flex items-center gap-2">
          <div className="size-4 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
        <div className="h-3 w-16 rounded bg-muted" />
      </div>
    )
  }

  return (
    <div
      data-slot="info-row"
      className={cn(
        "flex items-center justify-between border-b border-border py-2.5 last:border-0",
        className
      )}
    >
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
