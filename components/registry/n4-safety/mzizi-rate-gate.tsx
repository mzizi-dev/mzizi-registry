"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface NyuchiRateGateProps {
  children: React.ReactNode
  isLimited: boolean
  cooldownSeconds?: number
  remainingAttempts?: number
  maxAttempts?: number
  onCooldownEnd?: () => void
  loading?: boolean
  className?: string
}

export function NyuchiRateGate({
  children,
  isLimited,
  cooldownSeconds = 60,
  remainingAttempts,
  maxAttempts,
  onCooldownEnd,
  loading = false,
  className,
}: NyuchiRateGateProps) {
  const { log, motion } = useNyuchiHarness("rate-gate")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  const [remaining, setRemaining] = React.useState(cooldownSeconds)

  React.useEffect(() => {
    if (!isLimited) {
      setRemaining(cooldownSeconds)
      return
    }
    log.info(`rate_limited: cooldown=${cooldownSeconds}s`)
    setRemaining(cooldownSeconds)
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval)
          onCooldownEnd?.()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isLimited, cooldownSeconds, onCooldownEnd, log])

  if (loading)
    return (
      <div
        data-slot="nyuchi-rate-gate"
        data-portal="https://mzizi.dev/components/nyuchi-rate-gate"
        data-loading
        role="status"
        className="h-24 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )
  if (!isLimited) return <>{children}</>

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div
      data-slot="nyuchi-rate-gate"
      role="alert"
      aria-live="polite"
      style={animStyle}
      className={cn(
        "flex items-center gap-4 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--status-warning,#F59E0B)]/15">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--status-warning, #F59E0B)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Too many attempts</p>
        <p className="text-xs text-muted-foreground">
          Try again in{" "}
          <strong className="font-mono text-foreground">
            {minutes > 0 ? `${minutes}m ` : ""}
            {seconds.toString().padStart(2, "0")}s
          </strong>
        </p>
        {remainingAttempts != null && maxAttempts != null && (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--status-warning,#F59E0B)] transition-all"
              style={{ width: `${(remainingAttempts / maxAttempts) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
export type { NyuchiRateGateProps }
