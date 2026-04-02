"use client"

import * as React from "react"
import { Monitor, Smartphone, Globe } from "lucide-react"

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
  if (lower.includes("mobile") || lower.includes("phone") || lower.includes("android") || lower.includes("ios")) {
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
      className={cn("flex flex-col divide-y divide-border", className)}
      {...props}
    >
      {sessions.map((session) => {
        const DeviceIcon = getDeviceIcon(session.device)
        return (
          <div key={session.id} className="flex items-center gap-4 py-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <DeviceIcon className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">{session.device}</span>
                {session.current && (
                  <span className="rounded-4xl bg-[var(--color-malachite)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--color-malachite)]">
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
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
