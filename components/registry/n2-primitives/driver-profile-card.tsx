import * as React from "react"
import { cn } from "@/lib/utils"

interface DriverProfileCardProps extends React.ComponentProps<"div"> {
  name: string
  avatar?: string
  rating: number
  totalTrips: number
  vehicleName?: string
  vehicleType?: string
  verificationTier?: 0 | 1 | 2 | 3 | 4
  memberSince?: string
}

const tierLabels = ["Unverified", "Community", "OTP", "Government", "Licensed"]
const tierColors = [
  "text-muted-foreground",
  "text-[var(--color-terracotta,#D4A574)]",
  "text-[var(--color-cobalt,#00B0FF)]",
  "text-[var(--color-gold,#FFD740)]",
  "text-[var(--color-tanzanite,#B388FF)]",
]

function DriverProfileCard({
  name,
  avatar,
  rating,
  totalTrips,
  vehicleName,
  vehicleType,
  verificationTier,
  memberSince,
  className,
  ...props
}: DriverProfileCardProps) {
  return (
    <div
      data-slot="driver-profile-card"
      data-portal="https://mzizi.dev/components/driver-profile-card"
      role="article"
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg,14px)] border border-border bg-card p-4",
        className
      )}
      {...props}
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
        {avatar ? (
          <img src={avatar} alt={name} className="size-full rounded-full object-cover" />
        ) : (
          name.charAt(0)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{name}</span>
          {verificationTier !== undefined && verificationTier > 0 && (
            <span className={cn("text-[10px] font-medium", tierColors[verificationTier])}>
              ✓ {tierLabels[verificationTier]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-[var(--color-gold,#FFD740)]">
            ★ {rating.toFixed(1)}
          </span>
          <span>{totalTrips} trips</span>
          {memberSince && <span>Since {memberSince}</span>}
        </div>
        {vehicleName && (
          <div className="mt-1 text-xs text-muted-foreground">
            {vehicleName}
            {vehicleType ? ` · ${vehicleType}` : ""}
          </div>
        )}
      </div>
    </div>
  )
}

export { DriverProfileCard }
export type { DriverProfileCardProps }
