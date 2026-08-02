"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
interface APIEndpoint {
  method: HTTPMethod
  path: string
  description?: string
}
interface APIExplorerPageProps {
  endpoints?: APIEndpoint[]
  selectedEndpoint?: APIEndpoint
  requestBuilder?: React.ReactNode
  responseViewer?: React.ReactNode
  authInput?: React.ReactNode
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
const METHOD_COLORS: Record<HTTPMethod, string> = {
  GET: "var(--status-success, var(--color-malachite, #64FFDA))",
  POST: "var(--status-info, var(--color-cobalt, #00B0FF))",
  PUT: "var(--status-warning, var(--color-gold, #FFD740))",
  PATCH: "var(--status-warning, var(--color-gold, #FFD740))",
  DELETE: "var(--status-error, var(--destructive, #FF5252))",
}
export function APIExplorerPage({
  endpoints,
  selectedEndpoint,
  requestBuilder,
  responseViewer,
  authInput,
  children,
  loading = false,
  className,
}: APIExplorerPageProps) {
  const { motion } = useNyuchiHarness("api-explorer-page")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  if (loading)
    return (
      <main
        data-slot="api-explorer-page"
        data-portal="https://mzizi.dev/components/api-explorer-page"
        data-loading
        role="main"
        className="flex h-screen animate-pulse"
      >
        <div className="w-64 bg-muted" />
        <div className="flex-1 space-y-4 p-4">
          <div className="h-12 rounded bg-muted" />
          <div className="h-96 rounded bg-muted" />
        </div>
      </main>
    )
  return (
    <main
      data-slot="api-explorer-page"
      role="main"
      aria-label="API Explorer"
      style={animStyle}
      className={cn("flex h-screen overflow-hidden", className)}
    >
      {endpoints && (
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-border p-3">
          <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Endpoints
          </p>
          {endpoints.map((ep, i) => (
            <button
              key={i}
              className={cn(
                "flex min-h-[44px] w-full items-center gap-2 rounded-[var(--radius-sm,7px)] px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                selectedEndpoint?.path === ep.path && "bg-muted"
              )}
            >
              <span
                className="shrink-0 rounded px-1 py-0.5 font-mono text-[10px] font-bold"
                style={{ color: METHOD_COLORS[ep.method] }}
              >
                {ep.method}
              </span>
              <span className="truncate font-mono text-xs">{ep.path}</span>
            </button>
          ))}
        </aside>
      )}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {authInput && (
          <section aria-label="Authentication" className="border-b border-border p-3">
            {authInput}
          </section>
        )}
        {requestBuilder && (
          <section aria-label="Request" className="border-b border-border p-4">
            {requestBuilder}
          </section>
        )}
        {responseViewer && (
          <section aria-label="Response" className="flex-1 bg-muted/30 p-4">
            {responseViewer}
          </section>
        )}
        {children}
      </div>
    </main>
  )
}
export type { HTTPMethod, APIEndpoint, APIExplorerPageProps }
