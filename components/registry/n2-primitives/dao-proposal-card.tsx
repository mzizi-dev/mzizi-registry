"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ProposalStatus = "active" | "passed" | "rejected" | "pending" | "executed"

interface DaoProposalCardProps extends React.ComponentProps<"div"> {
  title: string
  description?: string
  proposerName: string
  proposerAvatar?: string
  status: ProposalStatus
  votesFor: number
  votesAgainst: number
  votesAbstain?: number
  quorumPct?: number
  currentQuorumPct?: number
  deadline?: Date | string
  onVote?: (vote: "for" | "against" | "abstain") => void
  userVote?: "for" | "against" | "abstain" | null
}

const statusStyles: Record<ProposalStatus, string> = {
  active: "bg-[var(--color-malachite,#64FFDA)]/10 text-[var(--color-malachite,#64FFDA)]",
  passed: "bg-[var(--color-cobalt,#00B0FF)]/10 text-[var(--color-cobalt,#00B0FF)]",
  rejected: "bg-destructive/10 text-destructive",
  pending: "bg-[var(--color-gold,#FFD740)]/10 text-[var(--color-gold,#FFD740)]",
  executed: "bg-muted text-muted-foreground",
}

function DaoProposalCard({
  title,
  description,
  proposerName,
  proposerAvatar,
  status,
  votesFor,
  votesAgainst,
  votesAbstain = 0,
  quorumPct,
  currentQuorumPct,
  deadline,
  onVote,
  userVote,
  className,
  ...props
}: DaoProposalCardProps) {
  const totalVotes = votesFor + votesAgainst + votesAbstain
  const forPct = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0
  const againstPct = totalVotes > 0 ? (votesAgainst / totalVotes) * 100 : 0

  return (
    <div
      data-slot="dao-proposal-card"
      data-portal="https://mzizi.dev/components/dao-proposal-card"
      role="article"
      className={cn("rounded-[var(--radius-xl,17px)] border border-border bg-card p-5", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif, serif)" }}>
          {title}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
            statusStyles[status]
          )}
        >
          {status}
        </span>
      </div>
      {description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{description}</p>
      )}

      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[8px] font-medium">
          {proposerAvatar ? (
            <img src={proposerAvatar} alt="" className="size-full rounded-full object-cover" />
          ) : (
            proposerName.charAt(0)
          )}
        </div>
        <span>{proposerName}</span>
        {deadline && <span>· Ends {new Date(deadline).toLocaleDateString()}</span>}
      </div>

      {/* Vote bar */}
      <div className="mt-4">
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-[var(--color-malachite,#64FFDA)]"
            style={{ width: `${forPct}%` }}
          />
          <div className="h-full bg-destructive" style={{ width: `${againstPct}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px]">
          <span className="text-[var(--color-malachite,#64FFDA)]">
            For {votesFor.toLocaleString()} ({forPct.toFixed(0)}%)
          </span>
          <span className="text-destructive">
            Against {votesAgainst.toLocaleString()} ({againstPct.toFixed(0)}%)
          </span>
        </div>
        {quorumPct !== undefined && currentQuorumPct !== undefined && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            Quorum: {currentQuorumPct.toFixed(0)}% / {quorumPct}% required
          </div>
        )}
      </div>

      {/* Vote actions */}
      {onVote && status === "active" && !userVote && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onVote("for")}
            className="h-9 flex-1 rounded-full bg-[var(--color-malachite,#64FFDA)]/15 text-xs font-medium text-[var(--color-malachite,#64FFDA)]"
          >
            For
          </button>
          <button
            onClick={() => onVote("against")}
            className="h-9 flex-1 rounded-full bg-destructive/10 text-xs font-medium text-destructive"
          >
            Against
          </button>
          <button
            onClick={() => onVote("abstain")}
            className="h-9 flex-1 rounded-full bg-muted text-xs font-medium text-muted-foreground"
          >
            Abstain
          </button>
        </div>
      )}
      {userVote && (
        <div className="mt-3 text-xs text-muted-foreground">
          You voted: <span className="font-medium capitalize">{userVote}</span>
        </div>
      )}
    </div>
  )
}

export { DaoProposalCard }
export type { DaoProposalCardProps }
