"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface MemberRowProps {
  name: string
  subtitle?: string
  avatar?: string
  role?: string
  status?: "active" | "invited" | "suspended" | "offline"
  action?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function MemberRow({
  name,
  subtitle,
  avatar,
  role,
  status,
  action,
  onClick,
  className,
}: MemberRowProps) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      data-slot="member-row"
      data-portal="https://mzizi.dev/components/member-row"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between px-4 py-3 text-left",
        onClick && "cursor-pointer transition-colors hover:bg-muted",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="size-9 shrink-0 overflow-hidden rounded-full bg-muted">
          {avatar && <img src={avatar} alt="" className="size-full object-cover" loading="lazy" />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {role && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{role}</span>}
        {status === "invited" && (
          <span className="text-xs text-[var(--status-warning,#FFD740)]">Pending</span>
        )}
        {status === "suspended" && (
          <span className="text-xs text-[var(--status-error,#FF5252)]">Suspended</span>
        )}
        {action}
      </div>
    </Comp>
  )
}
export type { MemberRowProps }
