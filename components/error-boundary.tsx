"use client"

import { Component, type ReactNode } from "react"
import { log } from "@/lib/observability"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    log.error("Component error caught by boundary", {
      module: "error-boundary",
      error,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex items-center justify-center rounded-xl border border-border bg-secondary/50 px-4 py-8">
            <p className="text-xs text-muted-foreground">
              Failed to render component
            </p>
          </div>
        )
      )
    }

    return this.props.children
  }
}
