import * as React from "react"
import { cn } from "@/lib/utils"

type NodeType = "consumer" | "business" | "infrastructure"

interface NodeStatusCardProps extends React.ComponentProps<"div"> {
  nodeId: string
  type: NodeType
  status: "online" | "syncing" | "offline"
  uptime: number
  storageUsedGB: number
  storageTotalGB: number
  nhcEarned: number
  peerCount: number
}

const statusStyles = {
  online: { dot: "bg-[var(--color-malachite,#64FFDA)]", label: "Online" },
  syncing: { dot: "bg-[var(--color-gold,#FFD740)]", label: "Syncing" },
  offline: { dot: "bg-destructive", label: "Offline" },
}

function NodeStatusCard({
  nodeId,
  type,
  status,
  uptime,
  storageUsedGB,
  storageTotalGB,
  nhcEarned,
  peerCount,
  className,
  ...props
}: NodeStatusCardProps) {
  const storagePct = (storageUsedGB / storageTotalGB) * 100

  return (
    <div
      data-slot="node-status-card"
      data-portal="https://mzizi.dev/components/node-status-card"
      role="article"
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("size-2 rounded-full", statusStyles[status].dot)} />
          <span className="text-sm font-medium capitalize">{type} Node</span>
        </div>
        <span className="text-xs text-muted-foreground">{statusStyles[status].label}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-muted-foreground">Uptime</div>
          <div className="text-sm font-medium tabular-nums">{uptime.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Peers</div>
          <div className="text-sm font-medium tabular-nums">{peerCount}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Storage</div>
          <div className="text-sm font-medium tabular-nums">
            {storageUsedGB}/{storageTotalGB} GB
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--color-cobalt,#00B0FF)]"
              style={{ width: `${storagePct}%` }}
            />
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">NHC Earned</div>
          <div className="text-sm font-medium text-[var(--color-gold,#FFD740)] tabular-nums">
            {nhcEarned.toLocaleString()}
          </div>
        </div>
      </div>
      <div className="mt-2 truncate font-mono text-[9px] text-muted-foreground">{nodeId}</div>
    </div>
  )
}

export { NodeStatusCard }
export type { NodeStatusCardProps }
