import * as React from "react"
import { cn } from "@/lib/utils"

interface MapClusterProps extends React.ComponentProps<"div"> {
  count: number
  color?: string
  size?: "sm" | "md" | "lg"
  onClick?: () => void
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
}

function MapCluster({
  count,
  color = "var(--color-malachite,#64FFDA)",
  size = "md",
  onClick,
  className,
  ...props
}: MapClusterProps) {
  return (
    <div
      data-slot="map-cluster"
      data-portal="https://mzizi.dev/components/map-cluster"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Cluster of ${count} items`}
      className={cn(
        "flex items-center justify-center rounded-full font-bold shadow-lg",
        sizeClasses[size],
        onClick && "cursor-pointer transition-transform hover:scale-110",
        className
      )}
      style={{ backgroundColor: `${color}30`, color, border: `2px solid ${color}` }}
      {...props}
    >
      {count > 99 ? "99+" : count}
    </div>
  )
}

export { MapCluster }
export type { MapClusterProps }
