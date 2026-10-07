"use client"

import * as React from "react"
import { useMziziHarness } from "@/lib/harness"
import { errorCode, healthMonitor, type HealthMonitor } from "@/lib/mzizi-resilience"

/* ═══════════════════════════════════════════════════════════════
   MZIZI SECTION — N5 Resilience (workhorse wrapper)

   Every page section gets wrapped in this: an error boundary, a
   loading skeleton and health reporting to the shared HealthMonitor
   (mzizi-resilience). One failing section shows its fallback; the
   rest of the page keeps working.

   Health: `loading` while loading, `healthy` once rendered, `error`
   (with the error's CODE, never its message) when the boundary
   catches, `healthy` again after a retry. The React health panel is
   mzizi-health-panel.
   ═══════════════════════════════════════════════════════════════ */

interface MziziSectionProps {
  /** Unique section name: the health report's name and the aria-label. */
  name: string
  children: React.ReactNode
  /** Custom skeleton shown while loading. */
  skeleton?: React.ReactNode
  /** Whether the section's data is still loading. */
  loading?: boolean
  /** Custom error fallback (shown instead of the default error card). */
  fallback?: React.ReactNode
  /** @deprecated Use `fallback`. */
  errorFallback?: React.ReactNode
  /** A critical section rethrows to the boundary above it instead of containing the error. */
  critical?: boolean
  /** Called when the boundary catches an error. */
  onError?: (error: Error) => void
  /** Called when the reader retries after an error. */
  onRecovery?: () => void
  /** Where health is reported (default the shared `healthMonitor`). */
  monitor?: HealthMonitor
  className?: string
}

interface ErrorBoundaryState {
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
    fallback?: React.ReactNode
    name: string
    critical: boolean
    monitor: HealthMonitor
    onError?: (error: Error) => void
    onRecovery?: () => void
  },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null, errorCount: 0 }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error) {
    this.setState((s) => ({ errorCount: s.errorCount + 1 }))
    this.props.monitor.recordError(this.props.name, error)
    this.props.onError?.(error)
  }

  private retry = () => {
    this.props.monitor.recordRecovery(this.props.name)
    this.props.onRecovery?.()
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (error) {
      if (this.props.critical) throw error
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          data-slot="mzizi-section-error"
          data-portal="https://mzizi.dev/components/mzizi-section-error"
          data-error-code={errorCode(error)}
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
            This section could not load. The rest of the page still works.
          </p>
          <button
            type="button"
            onClick={this.retry}
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

export function MziziSection({
  name,
  children,
  skeleton = DEFAULT_SKELETON,
  loading = false,
  fallback,
  errorFallback,
  critical = false,
  onError,
  onRecovery,
  monitor = healthMonitor,
  className,
}: MziziSectionProps) {
  const { log, motion } = useMziziHarness(name)
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  // Whether this section's boundary is showing an error right now.
  const errored = React.useRef(false)

  // Report in an effect, never during render. `loading` and `healthy` are reported when
  // they change; an error caught below is reported by the boundary and is not overwritten.
  React.useEffect(() => {
    if (loading) monitor.report(name, { status: "loading", source: "none" })
    else if (!errored.current) monitor.report(name, { status: "healthy", source: "primary" })
  }, [loading, monitor, name])

  const handleError = React.useCallback(
    (error: Error) => {
      errored.current = true
      // The code only: an error message can carry personal data.
      log.error("section_error", undefined, { code: errorCode(error) })
      onError?.(error)
    },
    [log, onError]
  )

  const handleRecovery = React.useCallback(() => {
    errored.current = false
    onRecovery?.()
  }, [onRecovery])

  if (loading) {
    return (
      <section
        data-slot="mzizi-section"
        data-section={name}
        data-status="loading"
        data-loading
        aria-busy="true"
        aria-label={name}
        className={className}
      >
        {skeleton}
      </section>
    )
  }

  return (
    <section
      data-slot="mzizi-section"
      data-section={name}
      aria-label={name}
      style={animStyle}
      className={className}
    >
      <SectionBoundary
        name={name}
        fallback={fallback ?? errorFallback}
        critical={critical}
        monitor={monitor}
        onError={handleError}
        onRecovery={handleRecovery}
      >
        {children}
      </SectionBoundary>
    </section>
  )
}

export type { MziziSectionProps }
