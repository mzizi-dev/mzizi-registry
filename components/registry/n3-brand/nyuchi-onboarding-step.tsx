"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI ONBOARDING STEP — Universal Brand Component (Pre-Wired)
   
   Individual onboarding step — composable into flows.
   Dynamic mineral accent. Progress dots for multi-step.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiOnboardingStepProps {
  /** Illustration or emoji */
  illustration?: React.ReactNode
  /** Step title */
  title: string
  /** Step description */
  description: string
  /** Current step index (0-based) */
  currentStep?: number
  /** Total number of steps */
  totalSteps?: number
  /** Next button label */
  nextLabel?: string
  /** Skip button label */
  skipLabel?: string
  /** Next handler */
  onNext?: () => void
  /** Skip handler */
  onSkip?: () => void
  className?: string
}

export function NyuchiOnboardingStep({
  illustration,
  title,
  description,
  currentStep = 0,
  totalSteps = 1,
  nextLabel = "Next",
  skipLabel = "Skip",
  onNext,
  onSkip,
  className,
}: NyuchiOnboardingStepProps) {
  const { motion } = useNyuchiHarness("onboarding-step")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  const isLast = currentStep >= totalSteps - 1

  return (
    <div
      data-slot="nyuchi-onboarding-step"
      style={animStyle}
      data-portal="https://mzizi.dev/components/nyuchi-onboarding-step"
      role="region"
      aria-label="Onboarding"
      className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}
    >
      {illustration && (
        <div className="mb-8 flex size-24 items-center justify-center rounded-full bg-[var(--brand-accent,var(--color-malachite,#64FFDA))]/10 text-4xl">
          {illustration}
        </div>
      )}

      <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
        {title}
      </h2>
      <p className="mt-3 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {/* Progress dots */}
      {totalSteps > 1 && (
        <div className="mt-6 flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all",
                i === currentStep
                  ? "h-2 w-6 bg-[var(--brand-accent,var(--color-malachite,#64FFDA))]"
                  : "size-2 bg-muted-foreground/20"
              )}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex w-full max-w-[280px] flex-col items-center gap-3">
        {onNext && (
          <button
            onClick={onNext}
            className="flex h-14 w-full items-center justify-center rounded-full bg-[var(--brand-accent,var(--color-malachite,#64FFDA))] text-[15px] font-semibold text-[var(--brand-accent-foreground,#0A0A0A)] transition-opacity hover:opacity-80"
          >
            {isLast ? "Get Started" : nextLabel}
          </button>
        )}
        {onSkip && !isLast && (
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          >
            {skipLabel}
          </button>
        )}
      </div>
    </div>
  )
}
