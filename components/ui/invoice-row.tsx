import * as React from "react"
import { Download } from "lucide-react"

import { cn } from "@/lib/utils"

const statusStyles = {
  paid: "bg-[var(--color-malachite)]/15 text-[var(--color-malachite)]",
  pending: "bg-[var(--color-gold)]/15 text-[var(--color-gold)]",
  overdue: "bg-destructive/10 text-destructive",
} as const

function InvoiceRow({
  id,
  date,
  amount,
  currency = "USD",
  status,
  onDownload,
  className,
  ...props
}: {
  id: string
  date: string
  amount: number
  currency?: string
  status: "paid" | "pending" | "overdue"
  onDownload?: () => void
} & React.ComponentProps<"div">) {
  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency })

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
          "inline-flex rounded-4xl px-2 py-0.5 text-xs font-medium capitalize",
          statusStyles[status]
        )}
      >
        {status}
      </span>
      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`Download invoice ${id}`}
        >
          <Download className="size-4" />
        </button>
      )}
    </div>
  )
}

export { InvoiceRow }
