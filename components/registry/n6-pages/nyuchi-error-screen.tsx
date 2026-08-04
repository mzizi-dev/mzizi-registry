"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface NyuchiErrorScreenProps {
  code?: 404 | 500 | 503 | number
  title?: string
  description?: string
  showRetry?: boolean
  showHome?: boolean
  onRetry?: () => void
  onHome?: () => void
  className?: string
}

const ERROR_DEFAULTS: Record<number, { title: string; description: string }> = {
  404: {
    title: "Page not found",
    description: "The page you are looking for does not exist or has been moved.",
  },
  500: {
    title: "Something went wrong",
    description: "We are experiencing technical difficulties. Please try again later.",
  },
  503: {
    title: "Under maintenance",
    description: "We are improving Mukoko. We will be back shortly.",
  },
}

export function NyuchiErrorScreen({
  code = 500,
  title,
  description,
  showRetry = true,
  showHome = true,
  onRetry,
  onHome,
  className,
}: NyuchiErrorScreenProps) {
  const { log, motion } = useNyuchiHarness("error-screen")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  const defaults = ERROR_DEFAULTS[code] || ERROR_DEFAULTS[500]

  React.useEffect(() => {
    log.error(`error_screen: ${code}`)
  }, [code, log])

  return (
    <div
      data-slot="nyuchi-error-screen"
      data-portal="https://mzizi.dev/components/nyuchi-error-screen"
      role="alert"
      style={animStyle}
      className={cn(
        "flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-6 text-center",
        className
      )}
    >
      <p className="font-mono text-7xl font-bold text-foreground/10">{code}</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">{title || defaults.title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description || defaults.description}
      </p>
      <div className="mt-8 flex gap-3">
        {showRetry && (
          <button
            onClick={onRetry || (() => window.location.reload())}
            className="min-h-[48px] rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          >
            Try Again
          </button>
        )}
        {showHome && (
          <button
            onClick={
              onHome ||
              (() => {
                window.location.href = "/"
              })
            }
            className="min-h-[48px] rounded-full bg-muted px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          >
            Go Home
          </button>
        )}
      </div>
    </div>
  )
}

export type { NyuchiErrorScreenProps }
