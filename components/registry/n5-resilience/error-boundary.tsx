"use client"

import { Component, type ReactNode } from "react"
import { log } from "@/lib/observability"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
  onError?: (error: Error) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    log.error("Uncaught error", { module: "error-boundary", error })
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          data-slot="error-boundary"
          data-portal="https://mzizi.dev/components/error-boundary"
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg,14px)] border border-border bg-secondary/30 px-6 py-12",
            this.props.className
          )}
          role="alert"
        >
          <p className="text-sm font-medium text-foreground">Something went wrong</p>
          <p className="max-w-xs text-center text-xs text-muted-foreground">
            {this.state.error?.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
