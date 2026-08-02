"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

type VerificationStep =
  "phone" | "otp" | "id-upload" | "selfie" | "biometric" | "review" | "complete"
interface VerificationTier {
  key: string
  label: string
  color: string
  unlocks: string[]
  completed: boolean
}
interface VerificationPageProps {
  currentStep?: VerificationStep
  tiers?: VerificationTier[]
  currentTier?: string
  children?: React.ReactNode
  loading?: boolean
  className?: string
}

export function VerificationPage({
  tiers,
  currentTier,
  children,
  loading = false,
  className,
}: VerificationPageProps) {
  const { motion } = useNyuchiHarness("verification-page")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  if (loading)
    return (
      <main
        data-slot="verification-page"
        data-portal="https://mzizi.dev/components/verification-page"
        data-loading
        role="main"
        className="mx-auto max-w-md animate-pulse space-y-4 p-4"
      >
        <div className="h-8 w-1/2 rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-[var(--radius-lg,14px)] bg-muted" />
        ))}
      </main>
    )
  return (
    <main
      data-slot="verification-page"
      role="main"
      aria-label="Verification"
      style={animStyle}
      className={cn("mx-auto flex max-w-md flex-col gap-6 p-4", className)}
    >
      <div>
        <h1 className="text-xl font-bold">Verify Your Identity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unlock more features with higher verification
        </p>
      </div>
      {tiers && (
        <section aria-label="Verification tiers" className="flex flex-col gap-2">
          {tiers.map((t) => (
            <div
              key={t.key}
              className={cn(
                "rounded-[var(--radius-lg,14px)] p-4 ring-1 transition-colors",
                t.key === currentTier
                  ? "bg-card ring-2"
                  : t.completed
                    ? "bg-card/50 ring-foreground/10"
                    : "bg-muted/50 ring-foreground/5"
              )}
              style={t.key === currentTier ? { borderColor: t.color } : undefined}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-sm font-medium">{t.label}</span>
                </div>
                {t.completed && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--status-success,var(--color-malachite,#64FFDA))"
                    strokeWidth="2"
                    aria-label="Completed"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {t.unlocks.map((u, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {u}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      <section aria-label="Current step">{children}</section>
    </main>
  )
}
export type { VerificationStep, VerificationTier, VerificationPageProps }
