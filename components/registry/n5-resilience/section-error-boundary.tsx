"use client"

import { Component, type ReactNode } from "react"
import { log } from "@/lib/observability"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SectionErrorBoundaryProps {
  children: ReactNode
  section: string
  fallback?: ReactNode
  className?: string
  onError?: (error: Error, section: string) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, State> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    const { section, onError } = this.props
    log.error(`Section "${section}" crashed`, {
      module: "error-boundary",
      data: { section, componentStack: error.stack?.split("\n").slice(0, 5) },
      error,
    })
    onError?.(error, section)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          data-slot="section-error-boundary"
          data-portal="https://mzizi.dev/components/section-error-boundary"
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg,14px)] border border-border bg-secondary/30 px-6 py-12",
            this.props.className
          )}
          role="alert"
          aria-label={`Error in ${this.props.section}`}
        >
          <div className="flex size-10 items-center justify-center rounded-[var(--radius-xl,17px)] bg-destructive/10">
            <span className="text-sm text-destructive" aria-hidden="true">
              !
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-sm font-medium text-foreground">
              {this.props.section} failed to load
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              This section encountered an error. The rest of the page is unaffected.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleRetry}>
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
