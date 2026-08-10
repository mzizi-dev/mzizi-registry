"use client"

import * as React from "react"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI SECTION — Layer 5 Resilience (Workhorse Wrapper)
   
   Every page section gets wrapped in this.
   Error boundary + skeleton + health reporting.
   ✅ HARNESS  ✅ TOKENS  ✅ ARIA  ✅ LOADING  ✅ MOTION
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiSectionProps {
  name: string
  children: React.ReactNode
  /** Custom skeleton shown during loading */
  skeleton?: React.ReactNode
  /** Whether the section's data is still loading */
  loading?: boolean
  /** Custom error fallback */
  errorFallback?: React.ReactNode
  className?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorCount: number
}

const DEFAULT_SKELETON = (
  <div className="animate-pulse space-y-3" role="status" aria-label="Loading section">
    <div className="h-4 w-2/3 rounded bg-muted" />
    <div className="h-32 rounded-[var(--radius-lg,14px)] bg-muted" />
    <div className="h-4 w-1/2 rounded bg-muted" />
    <span className="sr-only">Loading section</span>
  </div>
)

class SectionBoundary extends React.Component<
  {
    children: React.ReactNode
    fallback: React.ReactNode
    name: string
    onError?: (error: Error) => void
  },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null, errorCount: 0 }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState((s) => ({ errorCount: s.errorCount + 1 }))
    this.props.onError?.(error)
    console.error(`[mzizi:${this.props.name}] Section error:`, error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-slot="nyuchi-section-error"
          data-portal="https://mzizi.dev/components/nyuchi-section-error"
          role="alert"
          aria-live="assertive"
          className="rounded-[var(--radius-lg,14px)] border border-destructive/20 bg-destructive/5 p-4"
        >
          <p
            className="text-sm font-medium text-destructive"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Something went wrong
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred in this section."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 min-h-[48px] rounded-full bg-destructive/10 px-4 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          >
            Retry ({this.state.errorCount})
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function NyuchiSection({
  name,
  children,
  skeleton = DEFAULT_SKELETON,
  loading = false,
  errorFallback,
  className,
}: NyuchiSectionProps) {
  const { log, motion } = useNyuchiHarness(name)
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  const handleError = React.useCallback(
    (error: Error) => {
      log.error("section_error", error)
    },
    [log]
  )

  if (loading) {
    return (
      <section
        data-slot="nyuchi-section"
        data-section={name}
        data-loading
        aria-label={name}
        className={className}
      >
        {skeleton}
      </section>
    )
  }

  const content = (
    <section
      data-slot="nyuchi-section"
      data-section={name}
      aria-label={name}
      style={animStyle}
      className={className}
    >
      <SectionBoundary
        name={name}
        fallback={errorFallback || DEFAULT_SKELETON}
        onError={handleError}
      >
        {children}
      </SectionBoundary>
    </section>
  )

  return content
}

export type { NyuchiSectionProps }
