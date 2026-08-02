"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface VoteButtonsProps extends React.ComponentProps<"div"> {
  votesFor: number
  votesAgainst: number
  votesAbstain?: number
  userVote?: "for" | "against" | "abstain" | null
  onVote?: (vote: "for" | "against" | "abstain") => void
  disabled?: boolean
  compact?: boolean
}

function VoteButtons({
  votesFor,
  votesAgainst,
  votesAbstain = 0,
  userVote,
  onVote,
  disabled,
  compact,
  className,
  ...props
}: VoteButtonsProps) {
  const total = votesFor + votesAgainst + votesAbstain

  return (
    <div
      data-slot="vote-buttons"
      data-portal="https://mzizi.dev/components/vote-buttons"
      className={cn("flex gap-2", className)}
      role="group"
      aria-label="Vote"
      {...props}
    >
      {[
        {
          key: "for" as const,
          label: "For",
          count: votesFor,
          color: "var(--color-malachite,#64FFDA)",
        },
        {
          key: "against" as const,
          label: "Against",
          count: votesAgainst,
          color: "var(--status-error, #FF5252)",
        },
        {
          key: "abstain" as const,
          label: "Abstain",
          count: votesAbstain,
          color: "var(--color-gold,#FFD740)",
        },
      ].map(({ key, label, count, color }) => (
        <button
          key={key}
          disabled={disabled || !!userVote}
          onClick={() => onVote?.(key)}
          aria-pressed={userVote === key}
          className={cn(
            "flex-1 rounded-full text-xs font-medium transition-colors",
            compact ? "h-8 px-2" : "h-10 px-3",
            userVote === key ? "ring-2" : "hover:opacity-80",
            disabled && "opacity-50"
          )}
          style={{
            backgroundColor: `${color}${userVote === key ? "30" : "15"}`,
            color: color,
            ...(userVote === key ? { ringColor: color } : {}),
          }}
        >
          {label}
          {!compact && total > 0 ? ` (${count})` : ""}
        </button>
      ))}
    </div>
  )
}

export { VoteButtons }
export type { VoteButtonsProps }
