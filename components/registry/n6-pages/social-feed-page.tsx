"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface SocialFeedPageProps {
  stories?: React.ReactNode
  createAction?: () => void
  filters?: React.ReactNode
  children?: React.ReactNode
  loading?: boolean
  className?: string
}

export function SocialFeedPage({
  stories,
  createAction,
  filters,
  children,
  loading = false,
  className,
}: SocialFeedPageProps) {
  const { motion } = useNyuchiHarness("social-feed-page")
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
        data-slot="social-feed-page"
        data-portal="https://mzizi.dev/components/social-feed-page"
        data-loading
        role="main"
        className="animate-pulse space-y-4 p-4"
      >
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="size-16 shrink-0 rounded-full bg-muted" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-[var(--radius-lg,14px)] bg-muted" />
        ))}
      </main>
    )
  return (
    <main
      data-slot="social-feed-page"
      role="main"
      aria-label="Feed"
      style={animStyle}
      className={cn("flex flex-col", className)}
    >
      {stories && (
        <section aria-label="Stories" className="border-b border-border px-4 py-3">
          {stories}
        </section>
      )}
      {filters && (
        <section aria-label="Feed filters" className="border-b border-border px-4 py-2">
          {filters}
        </section>
      )}
      <section aria-label="Posts" className="flex flex-col gap-4 p-4">
        {children}
      </section>
      {createAction && (
        <button
          onClick={createAction}
          aria-label="Create post"
          className="fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
    </main>
  )
}
export type { SocialFeedPageProps }
