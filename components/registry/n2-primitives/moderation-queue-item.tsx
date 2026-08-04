import * as React from "react"
import { cn } from "@/lib/utils"

type ReportReason =
  "spam" | "harassment" | "misinformation" | "inappropriate" | "copyright" | "other"

interface ModerationQueueItemProps extends React.ComponentProps<"div"> {
  contentPreview: string
  contentType: string
  reporterName?: string
  reason: ReportReason
  reportedAt: string
  reportCount?: number
  onApprove?: () => void
  onReject?: () => void
  onEscalate?: () => void
}

function ModerationQueueItem({
  contentPreview,
  contentType,
  reporterName,
  reason,
  reportedAt,
  reportCount = 1,
  onApprove,
  onReject,
  onEscalate,
  className,
  ...props
}: ModerationQueueItemProps) {
  return (
    <div
      data-slot="moderation-queue-item"
      data-portal="https://mzizi.dev/components/moderation-queue-item"
      role="article"
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive capitalize">
            {reason}
          </span>
          <span className="text-[10px] text-muted-foreground">{contentType}</span>
          {reportCount > 1 && (
            <span className="text-[10px] font-medium text-[var(--color-terracotta,#D4A574)]">
              {reportCount} reports
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{reportedAt}</span>
      </div>
      <div className="mt-2 line-clamp-3 rounded-[var(--radius-md,12px)] bg-muted/30 p-3 text-sm">
        {contentPreview}
      </div>
      {reporterName && (
        <div className="mt-1.5 text-[10px] text-muted-foreground">Reported by {reporterName}</div>
      )}
      <div className="mt-3 flex gap-2">
        {onApprove && (
          <button
            onClick={onApprove}
            className="h-9 flex-1 rounded-full bg-[var(--color-malachite,#64FFDA)]/15 text-xs font-medium text-[var(--color-malachite,#64FFDA)]"
          >
            Approve
          </button>
        )}
        {onReject && (
          <button
            onClick={onReject}
            className="h-9 flex-1 rounded-full bg-destructive/10 text-xs font-medium text-destructive"
          >
            Reject
          </button>
        )}
        {onEscalate && (
          <button
            onClick={onEscalate}
            className="h-9 rounded-full bg-[var(--color-gold,#FFD740)]/10 px-3 text-xs font-medium text-[var(--color-gold,#FFD740)]"
          >
            Escalate
          </button>
        )}
      </div>
    </div>
  )
}

export { ModerationQueueItem }
export type { ModerationQueueItemProps }
