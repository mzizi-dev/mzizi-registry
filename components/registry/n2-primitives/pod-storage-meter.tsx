import * as React from "react"
import { cn } from "@/lib/utils"

interface StorageCategory {
  label: string
  sizeGB: number
  color: string
}

interface PodStorageMeterProps extends React.ComponentProps<"div"> {
  totalGB: number
  categories: StorageCategory[]
  nstAllocation?: number
}

function PodStorageMeter({
  totalGB,
  categories,
  nstAllocation,
  className,
  ...props
}: PodStorageMeterProps) {
  const usedGB = categories.reduce((sum, c) => sum + c.sizeGB, 0)
  const usedPct = (usedGB / totalGB) * 100

  return (
    <div
      data-slot="pod-storage-meter"
      data-portal="https://mzizi.dev/components/pod-storage-meter"
      role="meter"
      aria-valuenow={usedGB}
      aria-valuemin={0}
      aria-valuemax={totalGB}
      aria-label={`Pod storage: ${usedGB.toFixed(1)} of ${totalGB} GB used`}
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Sovereign Pod</span>
        {/* `usedPct` was computed and then never rendered. The absolute figures
            alone make "38.2 / 512 GB" a division problem for the reader; the
            percentage is the number a capacity meter exists to communicate. */}
        <span className="text-xs text-muted-foreground tabular-nums">
          {usedGB.toFixed(1)} / {totalGB} GB · {usedPct.toFixed(0)}%
        </span>
      </div>
      {/* Stacked bar */}
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
        {categories.map((cat, i) => (
          <div
            key={i}
            className="h-full"
            style={{ width: `${(cat.sizeGB / totalGB) * 100}%`, backgroundColor: cat.color }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <div className="size-2 rounded-full" style={{ backgroundColor: cat.color }} />
            <span>
              {cat.label} ({cat.sizeGB.toFixed(1)} GB)
            </span>
          </div>
        ))}
      </div>
      {nstAllocation !== undefined && (
        <div className="mt-2 text-[10px] text-muted-foreground">
          NST Allocation: {nstAllocation.toLocaleString()} tokens
        </div>
      )}
    </div>
  )
}

export { PodStorageMeter }
export type { PodStorageMeterProps }
