"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface NyuchiSuccessScreenProps {
  title?: string
  message?: string
  detail?: React.ReactNode
  primaryAction?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
  icon?: React.ReactNode
  className?: string
}

export function NyuchiSuccessScreen({
  title = "Success",
  message,
  detail,
  primaryAction,
  secondaryAction,
  icon,
  className,
}: NyuchiSuccessScreenProps) {
  const { motion } = useNyuchiHarness("success-screen")
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
      data-slot="nyuchi-success-screen"
      data-portal="https://mzizi.dev/components/nyuchi-success-screen"
      role="status"
      aria-live="polite"
      style={animStyle}
      className={cn("flex flex-col items-center gap-4 px-6 py-12 text-center", className)}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-[var(--status-success,var(--color-malachite,#64FFDA))]/15">
        {icon || (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--status-success, var(--color-malachite, #64FFDA))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        )}
      </div>
      <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
        {title}
      </h2>
      {message && <p className="max-w-sm text-sm text-muted-foreground">{message}</p>}
      {detail}
      {(primaryAction || secondaryAction) && (
        <div className="mt-4 flex gap-3">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="min-h-[48px] rounded-full bg-[var(--color-cobalt,#00B0FF)] px-6 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="min-h-[48px] rounded-full bg-muted px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
export type { NyuchiSuccessScreenProps }
