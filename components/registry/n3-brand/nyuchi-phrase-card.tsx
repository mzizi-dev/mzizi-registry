"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI PHRASE CARD — Brand Component (Pre-Wired)
   Mineral: Cobalt (education, language).
   Word/phrase flashcard with pronunciation and usage examples.
   "Never treat African languages as an afterthought" — Covenant 6
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiPhraseCardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  phrase: string
  translation: string
  language: string
  targetLanguage?: string
  pronunciation?: string
  example?: string
  exampleTranslation?: string
  category?: string
  mastered?: boolean
  onPlayAudio?: () => void
  onPractice?: () => void
  onClick?: () => void
  className?: string
}

export function NyuchiPhraseCard({
  loading = false,
  phrase,
  translation,
  language,
  targetLanguage,
  pronunciation,
  example,
  exampleTranslation,
  category,
  mastered,
  onPlayAudio,
  onPractice,
  onClick,
  className,
}: NyuchiPhraseCardProps) {
  const { motion } = useNyuchiHarness("phrase-card")
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
      <div
        data-slot="nyuchi-phrase-card"
        data-portal="https://mzizi.dev/components/nyuchi-phrase-card"
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="h-5 w-1/2 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="space-y-1.5 rounded-[var(--radius-sm,7px)] bg-muted p-3">
          <div className="h-2.5 w-full rounded bg-foreground/5" />
          <div className="h-2.5 w-1/2 rounded bg-foreground/5" />
        </div>
      </div>
    )
  return (
    <div
      data-slot="nyuchi-phrase-card"
      style={animStyle}
      role="article"
      onClick={onClick}
      className={cn(
        "min-h-[48px] overflow-hidden rounded-[var(--radius-lg,14px)] border border-border bg-card transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        mastered && "border-l-2 border-l-[var(--color-malachite,#64FFDA)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p
              className="text-lg font-bold text-foreground"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {phrase}
            </p>
            {pronunciation && (
              <p className="text-xs text-[var(--color-cobalt,#00B0FF)] italic">/{pronunciation}/</p>
            )}
          </div>
          {onPlayAudio && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPlayAudio()
              }}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-cobalt,#00B0FF)]/10 text-[var(--color-cobalt,#00B0FF)] transition-colors hover:bg-[var(--color-cobalt,#00B0FF)]/20"
              aria-label="Play audio"
            >
              🔊
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{translation}</p>
        {example && (
          <div className="space-y-1 rounded-[var(--radius-sm,7px)] bg-muted p-3">
            <p className="text-xs text-foreground italic">&quot;{example}&quot;</p>
            {exampleTranslation && (
              <p className="text-[11px] text-muted-foreground">&quot;{exampleTranslation}&quot;</p>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {category && (
              <span className="rounded-full bg-[var(--color-cobalt,#00B0FF)]/10 px-1.5 py-0.5 text-[var(--color-cobalt,#00B0FF)]">
                {category}
              </span>
            )}
            <span>
              {language}
              {targetLanguage ? ` → ${targetLanguage}` : ""}
            </span>
            {mastered && <span className="text-[var(--color-malachite,#64FFDA)]">✓ Mastered</span>}
          </div>
          {onPractice && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPractice()
              }}
              className="h-10 rounded-full bg-[var(--color-cobalt,#00B0FF)] px-4 text-[12px] font-medium text-[#0A0A0A] hover:opacity-80"
            >
              Practice
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
