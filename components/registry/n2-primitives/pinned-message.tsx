"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PinnedMessageProps extends React.ComponentProps<"div"> {
  /** Message content preview */
  content: string
  /** Who pinned it */
  pinnedBy?: string
  /** When it was pinned */
  pinnedAt?: Date | string
  /** Called when user wants to scroll to the pinned message */
  onNavigate?: () => void
  /** Called when user unpins */
  onUnpin?: () => void
  /** Can the current user unpin */
  canUnpin?: boolean
}

function PinnedMessage({
  content,
  pinnedBy,
  pinnedAt,
  onNavigate,
  onUnpin,
  canUnpin = false,
  className,
  ...props
}: PinnedMessageProps) {
  return (
    <div
      data-slot="pinned-message"
      data-portal="https://mzizi.dev/components/pinned-message"
      role="status"
      aria-label="Pinned message"
      className={cn(
        "flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2 text-sm",
        onNavigate && "cursor-pointer transition-colors hover:bg-muted/50",
        className
      )}
      onClick={onNavigate}
      {...props}
    >
      {/* Pin accent line */}
      <div className="h-8 w-0.5 shrink-0 rounded-full bg-[var(--color-cobalt,#00B0FF)]" />

      <div className="min-w-0 flex-1">
        {/* `pinnedAt` was destructured and never rendered, and the guard was on
            `pinnedBy` alone — so a message pinned with only a timestamp showed
            no pin attribution line at all. */}
        {(pinnedBy || pinnedAt) && (
          <div className="text-[10px] font-medium text-[var(--color-cobalt,#00B0FF)]">
            Pinned{pinnedBy ? ` by ${pinnedBy}` : ""}
            {pinnedAt ? ` · ${new Date(pinnedAt).toLocaleDateString()}` : ""}
          </div>
        )}
        <div className="truncate text-xs text-muted-foreground">{content}</div>
      </div>

      {canUnpin && onUnpin && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onUnpin()
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Unpin message"
        >
          ×
        </button>
      )}
    </div>
  )
}

export { PinnedMessage }
export type { PinnedMessageProps }
