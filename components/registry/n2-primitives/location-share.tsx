import * as React from "react"
import { cn } from "@/lib/utils"

interface LocationShareProps extends React.ComponentProps<"div"> {
  latitude: number
  longitude: number
  address?: string
  label?: string
  isLive?: boolean
  liveDuration?: string
  onOpen?: () => void
}

function LocationShare({
  latitude,
  longitude,
  address,
  label,
  isLive = false,
  liveDuration,
  onOpen,
  className,
  ...props
}: LocationShareProps) {
  return (
    <div
      data-slot="location-share"
      data-portal="https://mzizi.dev/components/location-share"
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg,14px)] border border-border bg-card",
        onOpen && "cursor-pointer",
        className
      )}
      onClick={onOpen}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      {...props}
    >
      {/* Map preview placeholder */}
      <div className="relative h-32 bg-muted">
        <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-1">
            <div className="size-4 rounded-full bg-[var(--color-malachite,#64FFDA)]" />
            <span className="font-mono text-[9px]">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          </div>
        </div>
        {isLive && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-[var(--color-malachite,#64FFDA)]/20 px-2 py-0.5">
            <div className="size-1.5 animate-pulse rounded-full bg-[var(--color-malachite,#64FFDA)]" />
            <span className="text-[9px] font-medium text-[var(--color-malachite,#64FFDA)]">
              Live{liveDuration ? ` · ${liveDuration}` : ""}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        {label && <div className="text-sm font-medium">{label}</div>}
        {address && <div className="truncate text-xs text-muted-foreground">{address}</div>}
      </div>
    </div>
  )
}

export { LocationShare }
export type { LocationShareProps }
