import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface SubscriptionGateProps extends React.ComponentProps<"div"> {
  title?: string
  description?: string
  tierName?: string
  price?: string
  currency?: string
  period?: string
  features?: string[]
  onSubscribe?: () => void
  blurredPreview?: React.ReactNode
}

function SubscriptionGate({
  title = "Premium Content",
  description,
  tierName,
  price,
  currency = "MXT",
  period = "month",
  features,
  onSubscribe,
  blurredPreview,
  className,
  ...props
}: SubscriptionGateProps) {
  const { motion } = useNyuchiHarness("subscription-gate")
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
      data-slot="subscription-gate"
      data-portal="https://mzizi.dev/components/subscription-gate"
      role="alert"
      aria-live="polite"
      style={animStyle}
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-xl,17px)] border border-border",
        className
      )}
      {...props}
    >
      {blurredPreview && (
        <div className="pointer-events-none blur-sm select-none">{blurredPreview}</div>
      )}
      <div
        className={cn(
          "flex flex-col items-center p-6 text-center",
          blurredPreview ? "absolute inset-0 bg-background/80 backdrop-blur-sm" : "bg-card"
        )}
      >
        <div className="text-base font-semibold" style={{ fontFamily: "var(--font-serif, serif)" }}>
          {title}
        </div>
        {description && (
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
        )}
        {price && (
          <div className="mt-3">
            <span className="text-2xl font-bold">{price}</span>
            <span className="text-sm text-muted-foreground">
              {" "}
              {currency}/{period}
            </span>
          </div>
        )}
        {features && features.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="text-[var(--status-success, #22C55E)]">✓</span>
                {f}
              </li>
            ))}
          </ul>
        )}
        {onSubscribe && (
          <button
            onClick={onSubscribe}
            className="mt-4 h-12 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          >
            {tierName ? `Subscribe to ${tierName}` : "Subscribe"}
          </button>
        )}
      </div>
    </div>
  )
}

export { SubscriptionGate }
export type { SubscriptionGateProps }
