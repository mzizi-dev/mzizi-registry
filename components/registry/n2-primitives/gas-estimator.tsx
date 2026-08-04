import * as React from "react"
import { cn } from "@/lib/utils"

interface GasEstimatorProps extends React.ComponentProps<"div"> {
  estimatedNhc: number
  fiatEquivalent?: string
  fiatCurrency?: string
  isMitHolder?: boolean
  staticPrice?: number
}

function GasEstimator({
  estimatedNhc,
  fiatEquivalent,
  fiatCurrency = "USD",
  isMitHolder = false,
  staticPrice,
  className,
  ...props
}: GasEstimatorProps) {
  return (
    <div
      data-slot="gas-estimator"
      data-portal="https://mzizi.dev/components/gas-estimator"
      role="article"
      className={cn(
        "flex items-center justify-between rounded-[var(--radius-md,12px)] border border-border bg-muted/30 px-3 py-2 text-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Est. fee</span>
        <span className="font-medium tabular-nums">{estimatedNhc.toFixed(4)} NHC</span>
        {fiatEquivalent && (
          <span className="text-xs text-muted-foreground">
            (~{fiatEquivalent} {fiatCurrency})
          </span>
        )}
      </div>
      {/* `staticPrice` was destructured and never rendered: the badge announced
          that a static price applies without ever saying what it is. */}
      {isMitHolder && (
        <span className="rounded-full bg-[var(--color-gold,#FFD740)]/10 px-2 py-0.5 text-[9px] font-medium text-[var(--color-gold,#FFD740)]">
          {staticPrice !== undefined ? `Static ${staticPrice.toFixed(4)} NHC` : "Static price"}
        </span>
      )}
    </div>
  )
}

export { GasEstimator }
export type { GasEstimatorProps }
