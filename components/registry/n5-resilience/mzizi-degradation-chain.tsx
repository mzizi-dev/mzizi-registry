"use client"
import * as React from "react"
import { useNyuchiHarness } from "@/lib/harness"

interface DegradationLevel<T> {
  key: string
  label: string
  fetch: () => Promise<T>
  render: (data: T) => React.ReactNode
}

interface NyuchiDegradationChainProps<T> {
  levels: DegradationLevel<T>[]
  staticFallback: React.ReactNode
  name?: string
  className?: string
}

export function NyuchiDegradationChain<T>({
  levels,
  staticFallback,
  name = "content",
  className,
}: NyuchiDegradationChainProps<T>) {
  const { log } = useNyuchiHarness(`degradation-${name}`)
  const [state, setState] = React.useState<{
    level: number
    data: T | null
    loading: boolean
    degraded: boolean
  }>({ level: 0, data: null, loading: true, degraded: false })

  React.useEffect(() => {
    let cancelled = false
    async function tryLevels() {
      for (let i = 0; i < levels.length; i++) {
        try {
          const data = await levels[i].fetch()
          if (!cancelled) {
            setState({ level: i, data, loading: false, degraded: i > 0 })
            if (i > 0) log.info(`degraded_to: ${levels[i].key}`)
            return
          }
        } catch (e) {
          log.warn(`level_failed: ${levels[i].key}`, { error: (e as Error).message })
        }
      }
      if (!cancelled) {
        setState({ level: levels.length, data: null, loading: false, degraded: true })
        log.error("all_levels_failed")
      }
    }
    tryLevels()
    return () => {
      cancelled = true
    }
  }, [levels, log])

  if (state.loading)
    return (
      <div
        data-slot="nyuchi-degradation-chain"
        data-portal="https://mzizi.dev/components/nyuchi-degradation-chain"
        data-loading
        role="status"
        className="h-32 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )

  return (
    <div
      data-slot="nyuchi-degradation-chain"
      data-degraded={state.degraded || undefined}
      className={className}
    >
      {state.degraded && state.level < levels.length && (
        <p className="mb-2 text-xs text-[var(--status-warning,#F59E0B)]" role="status">
          Showing {levels[state.level].label} (personalized content unavailable)
        </p>
      )}
      {state.data && state.level < levels.length
        ? levels[state.level].render(state.data)
        : staticFallback}
    </div>
  )
}
export type { DegradationLevel, NyuchiDegradationChainProps }
