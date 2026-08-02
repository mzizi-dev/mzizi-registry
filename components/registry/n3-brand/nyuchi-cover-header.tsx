"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface NyuchiCoverHeaderProps {
  coverImage?: string
  avatar?: string
  avatarShape?: "circle" | "rounded"
  name: string
  subtitle?: string
  badge?: React.ReactNode
  action?: React.ReactNode
  coverHeight?: "sm" | "md" | "lg"
  className?: string
}

const HEIGHT_MAP = { sm: "h-24 sm:h-32", md: "h-32 sm:h-48", lg: "h-40 sm:h-56" }

export function NyuchiCoverHeader({
  coverImage,
  avatar,
  avatarShape = "circle",
  name,
  subtitle,
  badge,
  action,
  coverHeight = "md",
  className,
}: NyuchiCoverHeaderProps) {
  const { motion } = useNyuchiHarness("cover-header")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  return (
    <div
      data-slot="nyuchi-cover-header"
      data-portal="https://mzizi.dev/components/nyuchi-cover-header"
      role="banner"
      style={animStyle}
      className={cn("relative", className)}
    >
      <div
        className={cn(HEIGHT_MAP[coverHeight], "bg-muted bg-cover bg-center")}
        style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}
      />
      <div className="px-4 pb-4">
        <div className="-mt-10 flex items-end justify-between">
          <div
            className={cn(
              "size-20 overflow-hidden border-4 border-background bg-muted",
              avatarShape === "circle" ? "rounded-full" : "rounded-[var(--radius-lg,14px)]"
            )}
          >
            {avatar && (
              <img src={avatar} alt="" className="size-full object-cover" loading="lazy" />
            )}
          </div>
          {action}
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {name}
            </h1>
            {badge}
          </div>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
export type { NyuchiCoverHeaderProps }
