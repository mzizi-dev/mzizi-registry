"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface ChatPageProps {
  variant?: "list" | "conversation"
  title?: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  inputArea?: React.ReactNode
  children?: React.ReactNode
  loading?: boolean
  className?: string
}

export function ChatPage({
  variant = "list",
  title,
  subtitle,
  showBack,
  onBack,
  inputArea,
  children,
  loading = false,
  className,
}: ChatPageProps) {
  const { motion } = useNyuchiHarness("chat-page")
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
        data-slot="chat-page"
        data-portal="https://mzizi.dev/components/chat-page"
        data-loading
        role="main"
        className="flex h-full animate-pulse flex-col"
      >
        <div className="h-14 bg-muted" />
        <div className="flex-1 space-y-3 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-[var(--radius-lg,14px)] bg-muted" />
          ))}
        </div>
      </main>
    )
  return (
    <main
      data-slot="chat-page"
      data-variant={variant}
      role="main"
      aria-label={title || "Messages"}
      style={animStyle}
      className={cn("flex h-full flex-col", className)}
    >
      {(title || showBack) && (
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          {showBack && (
            <button
              onClick={onBack}
              aria-label="Back"
              className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{title}</p>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </header>
      )}
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
      {variant === "conversation" && inputArea && (
        <footer className="border-t border-border p-3">{inputArea}</footer>
      )}
    </main>
  )
}
export type { ChatPageProps }
