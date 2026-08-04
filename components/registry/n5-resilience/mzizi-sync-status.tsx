"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

type SyncState = "synced" | "syncing" | "conflicts" | "error" | "queued" | "offline"

interface SyncInfo {
  state: SyncState
  progress?: number
  pendingChanges?: number
  conflicts?: number
  lastSynced?: string
  error?: string
}

interface NyuchiSyncStatusProps {
  sync: SyncInfo
  compact?: boolean
  onResolveConflicts?: () => void
  onRetry?: () => void
  className?: string
}

const STATE_CONFIG: Record<SyncState, { color: string; label: string; icon: string }> = {
  synced: { color: "var(--connection-online, #22C55E)", label: "Synced", icon: "M5 12l5 5L20 7" },
  syncing: {
    color: "var(--connection-syncing, #3B82F6)",
    label: "Syncing",
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  },
  conflicts: {
    color: "var(--status-warning, #F59E0B)",
    label: "Conflicts",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
  error: {
    color: "var(--status-error, #EF4444)",
    label: "Sync Error",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636",
  },
  queued: {
    color: "var(--status-info, #3B82F6)",
    label: "Changes Queued",
    icon: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z",
  },
  offline: {
    color: "var(--connection-offline, #EF4444)",
    label: "Offline",
    icon: "M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39",
  },
}

export function NyuchiSyncStatus({
  sync,
  compact = false,
  onResolveConflicts,
  onRetry,
  className,
}: NyuchiSyncStatusProps) {
  const config = STATE_CONFIG[sync.state]

  if (compact) {
    return (
      <div
        data-slot="nyuchi-sync-status"
        data-portal="https://mzizi.dev/components/nyuchi-sync-status"
        role="status"
        aria-label={config.label}
        className={cn("flex items-center gap-1.5", className)}
      >
        <div className="size-2 rounded-full" style={{ backgroundColor: config.color }} />
        <span className="text-xs text-muted-foreground">
          {config.label}
          {sync.pendingChanges ? ` (${sync.pendingChanges})` : ""}
        </span>
      </div>
    )
  }

  return (
    <div
      data-slot="nyuchi-sync-status"
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-3 ring-1 ring-foreground/10",
        className
      )}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={config.color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={sync.state === "syncing" ? "animate-spin" : ""}
      >
        <path d={config.icon} />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium" style={{ color: config.color }}>
          {config.label}
        </p>
        {sync.state === "syncing" && sync.progress != null && (
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${sync.progress}%`, backgroundColor: config.color }}
            />
          </div>
        )}
        {sync.conflicts != null && sync.conflicts > 0 && (
          <p className="text-xs text-muted-foreground">
            {sync.conflicts} conflict{sync.conflicts > 1 ? "s" : ""} to resolve
          </p>
        )}
        {sync.lastSynced && (
          <p className="text-xs text-muted-foreground/60">Last synced: {sync.lastSynced}</p>
        )}
        {sync.error && <p className="text-xs text-destructive">{sync.error}</p>}
      </div>
      {sync.state === "conflicts" && onResolveConflicts && (
        <button
          onClick={onResolveConflicts}
          className="min-h-[48px] px-2 text-xs font-medium transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          style={{ color: config.color }}
        >
          Resolve
        </button>
      )}
      {sync.state === "error" && onRetry && (
        <button
          onClick={onRetry}
          className="min-h-[48px] px-2 text-xs font-medium text-destructive transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
        >
          Retry
        </button>
      )}
    </div>
  )
}
export type { SyncState, SyncInfo, NyuchiSyncStatusProps }
