"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

interface TourStep {
  target: string
  title: string
  description: string
  position?: "top" | "bottom" | "left" | "right"
}

function OnboardingTour({
  steps,
  active,
  onNext,
  onSkip,
  className,
  ...props
}: {
  steps: TourStep[]
  active: number
  onNext: () => void
  onSkip: () => void
} & React.ComponentProps<"div">) {
  const [rect, setRect] = React.useState<DOMRect | null>(null)
  const step = steps[active]

  React.useEffect(() => {
    if (!step) return
    const el = document.querySelector(step.target)
    if (el) {
      const r = el.getBoundingClientRect()
      setRect(r)
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    } else {
      setRect(null)
    }
  }, [step])

  if (!step || active >= steps.length) return null

  const position = step.position ?? "bottom"
  const padding = 8

  const tooltipStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        ...(position === "bottom" && {
          top: rect.bottom + padding,
          left: rect.left + rect.width / 2,
          transform: "translateX(-50%)",
        }),
        ...(position === "top" && {
          bottom: window.innerHeight - rect.top + padding,
          left: rect.left + rect.width / 2,
          transform: "translateX(-50%)",
        }),
        ...(position === "left" && {
          top: rect.top + rect.height / 2,
          right: window.innerWidth - rect.left + padding,
          transform: "translateY(-50%)",
        }),
        ...(position === "right" && {
          top: rect.top + rect.height / 2,
          left: rect.right + padding,
          transform: "translateY(-50%)",
        }),
      }
    : { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }

  return (
    <div data-slot="onboarding-tour" className={cn("", className)} {...props}>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] bg-foreground/40" onClick={onSkip} />

      {/* Spotlight cutout */}
      {rect && (
        <div
          className="fixed z-[9999] rounded-lg ring-[9999px] ring-foreground/40"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="z-[10000] w-72 rounded-xl border border-border bg-card p-4 shadow-lg"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-foreground">{step.title}</h4>
          <button
            type="button"
            onClick={onSkip}
            className="shrink-0 p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Skip tour"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground tabular-nums">
            {active + 1} of {steps.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-4xl bg-[var(--color-cobalt)] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--color-cobalt)]/90"
            >
              {active === steps.length - 1 ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { OnboardingTour, type TourStep }
