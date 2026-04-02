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
      className={cn("flex items-center gap-4 py-3 border-b border-border last:border-b-0 text-sm", className)}
      {...props}
    >
      <span className="font-mono text-xs text-muted-foreground w-24 shrink-0">{id}</span>
      <span className="text-muted-foreground w-28 shrink-0">{date}</span>
      <span className="font-medium tabular-nums text-foreground flex-1">{formatter.format(amount)}</span>
      <span className={cn("inline-flex rounded-4xl px-2 py-0.5 text-xs font-medium capitalize", statusStyles[status])}>
        {status}
      </span>
      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
          aria-label={`Download invoice ${id}`}
        >
          <Download className="size-4" />
        </button>
      )}
    </div>
  )
}

export { InvoiceRow }
