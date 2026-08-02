import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI META TILE — 4.2.0 date/location signature pattern.

   A rounded-square chip (an icon tile OR a month/day date chip)
   paired with a bold 16px primary line and a 13px muted secondary
   line. The universal When / Where unit — used on event detail rows,
   place cards, and any listing that anchors a date or a location.

   Purely presentational and server-safe (no harness, no "use client")
   so it can render inside React Server Components. The chip tint
   defaults to the brand accent; each app swaps its own mineral via
   --brand-accent.
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiMetaTileProps {
  /** Icon chip (mutually exclusive with `date`). */
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
  /** Date chip — month abbrev over day numeral. */
  date?: { month: string; day: string | number }
  /** Small caption above the primary line. */
  caption?: string
  /** Bold primary line. */
  primary: string
  /** 13px muted secondary line. */
  secondary?: string
  /** Accent tint for the chip glyph / date numeral. Defaults to the
      brand accent (--brand-accent), falling back to the primary token. */
  tint?: string
  /** Trailing action (e.g. a small button), right-aligned. */
  trailing?: React.ReactNode
  className?: string
}

export function NyuchiMetaTile({
  icon: Icon,
  date,
  caption,
  primary,
  secondary,
  tint = "var(--brand-accent, var(--color-primary))",
  trailing,
  className,
}: NyuchiMetaTileProps) {
  const chipSurface =
    "color-mix(in srgb, var(--brand-accent, var(--color-primary)) 12%, transparent)"
  const chipBorder =
    "color-mix(in srgb, var(--brand-accent, var(--color-primary)) 18%, transparent)"
  return (
    <div data-slot="nyuchi-meta-tile" className={cn("flex items-center gap-3", className)}>
      <div
        className="flex size-12 shrink-0 flex-col items-center justify-center rounded-[var(--radius-md,12px)] border"
        style={{ borderColor: chipBorder, backgroundColor: date ? "transparent" : chipSurface }}
        aria-hidden
      >
        {date ? (
          <>
            <span className="text-[10px] leading-none font-semibold tracking-wide text-muted-foreground uppercase">
              {date.month.slice(0, 3)}
            </span>
            <span className="mt-0.5 text-xl leading-none font-bold" style={{ color: tint }}>
              {date.day}
            </span>
          </>
        ) : Icon ? (
          <span style={{ color: tint }}>
            <Icon className="size-5" strokeWidth={2.2} />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        {caption && (
          <div className="text-[13px] leading-none font-medium text-muted-foreground">
            {caption}
          </div>
        )}
        <div
          className={cn(
            "truncate text-[16px] leading-[1.25] font-semibold text-foreground",
            caption && "mt-1"
          )}
        >
          {primary}
        </div>
        {secondary && (
          <div className="mt-0.5 truncate text-[13px] text-muted-foreground">{secondary}</div>
        )}
      </div>

      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
}

export type { NyuchiMetaTileProps }
