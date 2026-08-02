import * as React from "react"
import { cn } from "@/lib/utils"

type TransactionType = "send" | "receive" | "purchase" | "reward" | "swap"

interface TransactionReceiptProps extends React.ComponentProps<"div"> {
  type: TransactionType
  amount: string
  currency?: string
  txId: string
  from?: string
  to?: string
  timestamp: Date | string
  status: "confirmed" | "pending" | "failed"
  memo?: string
  onShare?: () => void
}

const typeLabels: Record<TransactionType, string> = {
  send: "Sent",
  receive: "Received",
  purchase: "Purchase",
  reward: "Reward",
  swap: "Swap",
}

function TransactionReceipt({
  type,
  amount,
  currency = "MXT",
  txId,
  from,
  to,
  timestamp,
  status,
  memo,
  onShare,
  className,
  ...props
}: TransactionReceiptProps) {
  const d = new Date(timestamp)
  return (
    <div
      data-slot="transaction-receipt"
      data-portal="https://mzizi.dev/components/transaction-receipt"
      role="article"
      className={cn("rounded-[var(--radius-xl,17px)] border border-border bg-card p-5", className)}
      {...props}
    >
      <div className="flex flex-col items-center border-b border-dashed border-border pb-4">
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            status === "confirmed"
              ? "bg-[var(--color-malachite,#64FFDA)]/10 text-[var(--color-malachite,#64FFDA)]"
              : status === "pending"
                ? "bg-[var(--color-gold,#FFD740)]/10 text-[var(--color-gold,#FFD740)]"
                : "bg-destructive/10 text-destructive"
          )}
        >
          {status === "confirmed" ? "✓" : status === "pending" ? "⏳" : "✕"} {typeLabels[type]}
        </span>
        <div className="mt-3 text-3xl font-bold tabular-nums">
          {type === "send" ? "-" : "+"}
          {amount}
        </div>
        <div className="text-sm text-muted-foreground">{currency}</div>
      </div>
      <div className="mt-4 space-y-2 text-xs">
        {from && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">From</span>
            <span className="ml-2 max-w-[200px] truncate font-mono">{from}</span>
          </div>
        )}
        {to && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">To</span>
            <span className="ml-2 max-w-[200px] truncate font-mono">{to}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span>
            {d.toLocaleDateString()} {d.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Transaction ID</span>
          <span className="ml-2 max-w-[160px] truncate font-mono text-[10px]">{txId}</span>
        </div>
        {memo && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Memo</span>
            <span>{memo}</span>
          </div>
        )}
      </div>
      {onShare && (
        <button
          onClick={onShare}
          className="mt-4 h-10 w-full rounded-full border border-border text-xs font-medium transition-colors hover:bg-muted"
        >
          Share Receipt
        </button>
      )}
    </div>
  )
}

export { TransactionReceipt }
export type { TransactionReceiptProps }
