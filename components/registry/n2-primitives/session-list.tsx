"use client"

import * as React from "react"
import { Monitor, Smartphone, Globe } from "@/lib/icons"

import { cn } from "@/lib/utils"

interface Session {
  id: string
  device: string
  location: string
  lastActive: string
  current?: boolean
}

function getDeviceIcon(device: string) {
  const lower = device.toLowerCase()
  if (
    lower.includes("mobile") ||
    lower.includes("phone") ||
    lower.includes("android") ||
    lower.includes("ios")
  ) {
    return Smartphone
  }
  return Monitor
}

function SessionList({
  sessions,
  onRevoke,
  className,
  ...props
}: {
  sessions: Session[]
  onRevoke: (sessionId: string) => void
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="session-list"
      data-portal="https://mzizi.dev/components/session-list"
      role="list"
      aria-label="Active sessions"
      className={cn("flex flex-col divide-y divide-border", className)}
      {...props}
    >
      {sessions.map((session) => {
        const DeviceIcon = getDeviceIcon(session.device)
        return (
          <div key={session.id} className="flex items-center gap-4 py-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-lg,14px)] bg-muted">
              <DeviceIcon className="size-5 text-muted-foreground" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {session.device}
                </span>
                {session.current && (
                  <span className="bg-[var(--status-success, var(--color-malachite, #64FFDA))]/15 text-[var(--status-success, var(--color-malachite, #64FFDA))] rounded-full px-2 py-0.5 text-[10px] font-medium">
                    Current
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Globe className="size-3" />
                  {session.location}
                </span>
                <span>{session.lastActive}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRevoke(session.id)}
              disabled={session.current}
              className="shrink-0 rounded-[var(--radius-lg,14px)] px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Revoke
            </button>
          </div>
        )
      })}
    </div>
  )
}

export { SessionList, type Session }
