"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI CONTENT COMPOSER — Universal Brand Component (Pre-Wired)
   
   Freeform content creation for the ecosystem. The branded way
   to write posts, status updates, comments, and stories.
   Structured data creation uses nyuchi-create-listing instead.
   
   Dynamic mineral accent via --brand-accent.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiContentComposerProps {
  /** Placeholder text */
  placeholder?: string
  /** Current user avatar URL */
  avatarUrl?: string
  /** Current user name */
  userName?: string
  /** Submit button label */
  submitLabel?: string
  /** Submit handler — receives the text content */
  onSubmit?: (content: string) => void
  /** Media attachment handler */
  onAttachMedia?: () => void
  /** Mention handler */
  onMention?: () => void
  /** Whether submission is in progress */
  submitting?: boolean
  /** Show media/mention toolbar */
  showToolbar?: boolean
  /** Compact inline mode (for comment replies) */
  compact?: boolean
  className?: string
}

export function NyuchiContentComposer({
  placeholder = "What\u2019s on your mind?",
  avatarUrl,
  userName,
  submitLabel = "Post",
  onSubmit,
  onAttachMedia,
  onMention,
  submitting = false,
  showToolbar = true,
  compact = false,
  className,
}: NyuchiContentComposerProps) {
  const { motion } = useNyuchiHarness("content-composer")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  const [text, setText] = React.useState("")

  const handleSubmit = () => {
    if (!text.trim() || submitting) return
    onSubmit?.(text.trim())
    setText("")
  }

  return (
    <div
      data-slot="nyuchi-content-composer"
      style={animStyle}
      data-portal="https://mzizi.dev/components/nyuchi-content-composer"
      className={cn(
        "rounded-[var(--radius-lg,14px)] border border-border bg-card",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div className="flex gap-3">
        {!compact && (
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-bold text-muted-foreground">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName || ""} className="size-full object-cover" />
            ) : (
              userName?.charAt(0)?.toUpperCase() || "?"
            )}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-3">
          <textarea
            aria-label="Compose content"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            rows={compact ? 1 : 3}
            className={cn(
              "w-full resize-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground",
              compact ? "text-sm" : "text-sm leading-relaxed"
            )}
          />

          <div className="flex items-center justify-between">
            {showToolbar && (
              <div className="flex items-center gap-1">
                {onAttachMedia && (
                  <button
                    onClick={onAttachMedia}
                    className="flex size-9 min-h-[48px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
                    aria-label="Attach media"
                  >
                    📷
                  </button>
                )}
                {onMention && (
                  <button
                    onClick={onMention}
                    className="flex size-9 min-h-[48px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
                    aria-label="Mention someone"
                  >
                    @
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className={cn(
                "h-10 rounded-full px-5 text-[13px] font-medium transition-opacity",
                text.trim() && !submitting
                  ? "bg-[var(--brand-accent,var(--color-malachite,#64FFDA))] text-[var(--brand-accent-foreground,#0A0A0A)] hover:opacity-80"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              )}
            >
              {submitting ? "Posting\u2026" : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
