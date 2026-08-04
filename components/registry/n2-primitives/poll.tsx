"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PollOption {
  id: string
  text: string
  votes: number
}

interface PollProps extends React.ComponentProps<"div"> {
  question: string
  options: PollOption[]
  totalVotes: number
  multiSelect?: boolean
  userVotes?: string[]
  onVote?: (optionId: string) => void
  closed?: boolean
  creatorName?: string
}

function Poll({
  question,
  options,
  totalVotes,
  multiSelect = false,
  userVotes = [],
  onVote,
  closed = false,
  creatorName,
  className,
  ...props
}: PollProps) {
  const hasVoted = userVotes.length > 0

  return (
    <div
      data-slot="poll"
      data-portal="https://mzizi.dev/components/poll"
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      role="group"
      aria-label={`Poll: ${question}`}
      {...props}
    >
      <div className="text-sm font-medium">{question}</div>
      {creatorName && (
        <div className="mt-0.5 text-[10px] text-muted-foreground">
          by {creatorName}
          {multiSelect ? " · Select multiple" : ""}
        </div>
      )}
      <div className="mt-3 space-y-2">
        {options.map((opt) => {
          const pct = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0
          const isSelected = userVotes.includes(opt.id)
          return (
            <button
              key={opt.id}
              disabled={closed || (hasVoted && !multiSelect)}
              onClick={() => onVote?.(opt.id)}
              className={cn(
                "relative flex w-full items-center justify-between overflow-hidden rounded-[var(--radius-md,12px)] border px-3 py-2.5 text-left text-sm transition-colors",
                isSelected
                  ? "border-[var(--color-malachite,#64FFDA)] bg-[var(--color-malachite,#64FFDA)]/5"
                  : "border-border hover:bg-muted/30",
                (closed || (hasVoted && !multiSelect)) && "cursor-default"
              )}
            >
              {(hasVoted || closed) && (
                <div
                  className="absolute inset-y-0 left-0 bg-[var(--color-malachite,#64FFDA)]/10 transition-all"
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="relative z-10">{opt.text}</span>
              {(hasVoted || closed) && (
                <span className="relative z-10 text-xs font-medium text-muted-foreground tabular-nums">
                  {pct.toFixed(0)}%
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-2 text-[10px] text-muted-foreground">
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        {closed ? " · Closed" : ""}
      </div>
    </div>
  )
}

export { Poll }
export type { PollProps }
