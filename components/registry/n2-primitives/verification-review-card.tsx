import * as React from "react"
import { cn } from "@/lib/utils"

interface VerificationReviewCardProps extends React.ComponentProps<"div"> {
  applicantName: string
  applicantAvatar?: string
  subjectType: "person" | "place" | "organization" | "expert" | "machine"
  requestedTier: 1 | 2 | 3 | 4
  currentTier: 0 | 1 | 2 | 3
  submittedAt: string
  evidenceCount?: number
  onApprove?: () => void
  onReject?: () => void
  onRequestMore?: () => void
}

const tierNames = ["Unverified", "Community", "OTP", "Government", "Licensed"]
const tierColors = [
  "",
  "var(--color-terracotta,#D4A574)",
  "var(--color-cobalt,#00B0FF)",
  "var(--color-gold,#FFD740)",
  "var(--color-tanzanite,#B388FF)",
]

function VerificationReviewCard({
  applicantName,
  applicantAvatar,
  subjectType,
  requestedTier,
  currentTier,
  submittedAt,
  evidenceCount,
  onApprove,
  onReject,
  onRequestMore,
  className,
  ...props
}: VerificationReviewCardProps) {
  return (
    <div
      data-slot="verification-review-card"
      data-portal="https://mzizi.dev/components/verification-review-card"
      role="article"
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {applicantAvatar ? (
            <img src={applicantAvatar} alt="" className="size-full rounded-full object-cover" />
          ) : (
            applicantName.charAt(0)
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{applicantName}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {subjectType} · Submitted {submittedAt}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Tier {currentTier} → </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: `${tierColors[requestedTier]}20`,
            color: tierColors[requestedTier],
          }}
        >
          Tier {requestedTier}: {tierNames[requestedTier]}
        </span>
      </div>
      {evidenceCount !== undefined && (
        <div className="mt-2 text-xs text-muted-foreground">
          {evidenceCount} evidence documents attached
        </div>
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
        {onRequestMore && (
          <button
            onClick={onRequestMore}
            className="h-9 rounded-full bg-[var(--color-cobalt,#00B0FF)]/10 px-3 text-xs font-medium text-[var(--color-cobalt,#00B0FF)]"
          >
            More Info
          </button>
        )}
      </div>
    </div>
  )
}

export { VerificationReviewCard }
export type { VerificationReviewCardProps }
