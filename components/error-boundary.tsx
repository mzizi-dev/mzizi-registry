"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { log } from "@/lib/observability"

interface ErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback UI. If omitted, a default retry-able fallback is shown. */
  fallback?: ReactNode
  /** Section name for logging and display (e.g., "Preview", "API Tester") */
  section?: string
  /** Called when an error is caught — use for external telemetry */
  onError?: (error: Error, errorInfo: { componentStack?: string | null }) => void
  /** Additional className for the default fallback container */
  className?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Section-level error boundary for layered fault isolation.
 *
 * Wraps any section so a failure in one component does not crash the
 * entire page. Each section degrades independently with a clear error
 * message and a retry action.
 *
 * Part of the Mukoko layered architecture:
 *   Layer 4 — Error boundaries + loading states (per-section isolation)
 *
 * @example
 * <ErrorBoundary section="Preview">
 *   <ComponentPreview code={code} hasDemo={hasDemo}>
 *     <DemoRenderer name={name} />
 *   </ComponentPreview>
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const section = this.props.section ?? "unknown"
    log.error(`Component error caught by boundary in "${section}"`, {
      module: "error-boundary",
      error,
    })
    this.props.onError?.(error, {
      componentStack: errorInfo.componentStack,
    })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className={cn(
            "rounded-xl border border-border bg-muted/30 p-6",
            this.props.className
          )}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {this.props.section
                  ? `The "${this.props.section}" section encountered an error`
                  : "This section encountered an error"}
              </p>
              <p className="text-xs text-muted-foreground">
                The rest of the page continues to work normally.
              </p>
              {this.state.error && (
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <RefreshCw className="size-3" />
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Convenience wrapper for page sections that should degrade gracefully.
 *
 * @example
 * <SafeSection section="Installation">
 *   <InstallBlock url={installUrl} />
 * </SafeSection>
 */
export function SafeSection({
  children,
  section,
  className,
}: {
  children: ReactNode
  section: string
  className?: string
}) {
  return (
    <ErrorBoundary section={section} className={className}>
      {children}
    </ErrorBoundary>
  )
}
