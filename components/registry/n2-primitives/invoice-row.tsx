"use client"

import * as React from "react"
import { Download } from "@/lib/icons"

import { cn } from "@/lib/utils"

const statusStyles = {
  paid: "bg-[var(--status-success,var(--color-malachite,#64FFDA))]/15 text-[var(--status-success,var(--color-malachite,#64FFDA))]",
  pending:
    "bg-[var(--status-warning,var(--color-gold,#FFD740))]/15 text-[var(--status-warning,var(--color-gold,#FFD740))]",
  overdue: "bg-destructive/10 text-destructive",
} as const

function InvoiceRow({
  loading = false,
  id,
  date,
  amount,
  currency = "USD",
  status,
  onDownload,
  className,
  ...props
}: {
  /** Render the skeleton instead of the content. */
  loading?: boolean
  id: string
  date: string
  amount: number
  currency?: string
  status: "paid" | "pending" | "overdue"
  onDownload?: () => void
} & React.ComponentProps<"div">) {
  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency })

  if (loading)
    return (
      <div
        data-slot="invoice-row"
        data-portal="https://mzizi.dev/components/invoice-row"
        data-loading
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    )

  return (
    <div
      data-slot="invoice-row"
      data-status={status}
      className={cn(
        "flex items-center gap-4 border-b border-border py-3 text-sm last:border-b-0",
        className
      )}
      {...props}
    >
      <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{id}</span>
      <span className="w-28 shrink-0 text-muted-foreground">{date}</span>
      <span className="flex-1 font-medium text-foreground tabular-nums">
        {formatter.format(amount)}
      </span>
      <span
        className={cn(
          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
          statusStyles[status]
        )}
      >
        {status}
      </span>
      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="shrink-0 rounded-[var(--radius-md,12px)] p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`Download invoice ${id}`}
        >
          <Download className="size-4" />
        </button>
      )}
    </div>
  )
}

export { InvoiceRow }
