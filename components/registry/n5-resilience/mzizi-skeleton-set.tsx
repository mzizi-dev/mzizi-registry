"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   MUKOKO SKELETON SET — Brand Loading States
   
   The 7-layer architecture means data arrives at different
   speeds from different sources (local SQLite, edge D1,
   cloud Supabase). Every brand component needs a skeleton
   that mirrors its exact layout proportions.
   
   Strategy: skeletons ARE the components in loading state.
   Same radius, same spacing, same visual weight — just
   pulsing placeholders instead of real content.
   
   Design identity markers maintained in loading state:
   - 14px card radius
   - 7px inner element radius
   - Correct spacing (20px margins, 16px padding)
   - Mineral accent dot on applicable skeletons
   ═══════════════════════════════════════════════════════════════ */

/* ── Base shimmer block ─────────────────────────────────────── */
function Bone({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-inner,7px)] bg-foreground/[0.06]",
        className
      )}
      {...props}
    />
  )
}

/* ── 1. LISTING SKELETON ────────────────────────────────────── */
function ListingSkeleton({
  variant = "row",
  className,
}: {
  variant?: "row" | "compact" | "hero"
  className?: string
}) {
  if (variant === "hero") {
    return (
      <div
        className={cn(
          "min-h-[200px] animate-pulse rounded-[var(--radius-card,14px)] bg-foreground/[0.04] p-5",
          className
        )}
      >
        <div className="flex h-full flex-col justify-end gap-2">
          <Bone className="h-4 w-16 rounded-full" />
          <Bone className="h-6 w-3/4" />
          <Bone className="h-3 w-1/2" />
        </div>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-[var(--radius-card,14px)] bg-card ring-1 ring-foreground/10",
          className
        )}
      >
        <Bone className="aspect-video w-full rounded-none" />
        <div className="flex flex-col gap-2 p-4">
          <Bone className="h-4 w-3/4" />
          <Bone className="h-3 w-full" />
          <div className="flex gap-2">
            <Bone className="h-5 w-14 rounded-full" />
            <Bone className="h-5 w-10 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  /* Row variant */
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-card,14px)] border-l-4 border-l-foreground/[0.06] bg-card py-3 pr-4 pl-3 ring-1 ring-foreground/10",
        className
      )}
    >
      <Bone className="size-12 shrink-0" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Bone className="h-4 w-2/3" />
        <Bone className="h-3 w-full" />
      </div>
      <Bone className="h-5 w-10 shrink-0 rounded-full" />
    </div>
  )
}

/* ── 2. PROFILE SKELETON ────────────────────────────────────── */
function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex animate-pulse flex-col items-center px-5 py-3", className)}>
      <Bone className="size-20 rounded-full" />
      <Bone className="mt-3.5 h-6 w-40" />
      <Bone className="mt-2 h-3 w-28" />
      {/* Trust indicators */}
      <div className="mt-4 flex gap-3">
        <Bone className="h-6 w-28 rounded-full" />
        <Bone className="h-6 w-16 rounded-full" />
      </div>
      {/* Trust meter */}
      <div className="mt-3 w-full max-w-xs">
        <Bone className="h-1.5 w-full rounded-full" />
      </div>
      {/* Stats row */}
      <div className="mt-5 flex gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Bone className="h-6 w-8" />
            <Bone className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 3. STATS SKELETON ──────────────────────────────────────── */
function StatsSkeleton({
  layout = "inline",
  count = 4,
  className,
}: {
  layout?: "inline" | "grid"
  count?: number
  className?: string
}) {
  if (layout === "grid") {
    return (
      <div className={cn("grid grid-cols-2 gap-3", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse flex-col gap-2 rounded-[var(--radius-card,14px)] bg-card p-4 ring-1 ring-foreground/10"
          >
            <Bone className="size-8 rounded-[var(--radius-inner,7px)]" />
            <Bone className="h-7 w-16" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div
      className={cn(
        "flex animate-pulse gap-4 rounded-[var(--radius-card,14px)] bg-card p-3 ring-1 ring-foreground/10",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex min-w-[120px] items-center gap-2">
          <Bone className="size-8 shrink-0 rounded-[var(--radius-inner,7px)]" />
          <div className="flex flex-col gap-1">
            <Bone className="h-2.5 w-16" />
            <Bone className="h-3.5 w-10" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── 4. FEED SKELETON (stack of listing skeletons) ──────────── */
function FeedSkeleton({
  count = 4,
  variant = "row",
  className,
}: {
  count?: number
  variant?: "row" | "compact" | "hero"
  className?: string
}) {
  if (variant === "compact") {
    return (
      <div className={cn("grid grid-cols-2 gap-3", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <ListingSkeleton key={i} variant="compact" />
        ))}
      </div>
    )
  }
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {variant === "hero" && <ListingSkeleton variant="hero" />}
      {Array.from({ length: count }).map((_, i) => (
        <ListingSkeleton key={i} variant="row" />
      ))}
    </div>
  )
}

/* ── 5. DETAIL SKELETON ─────────────────────────────────────── */
function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      {/* Hero area */}
      <Bone className="min-h-[220px] rounded-none" />
      {/* Info card */}
      <div className="p-5">
        <div className="flex flex-col gap-3 rounded-[var(--radius-card,14px)] bg-card p-4 ring-1 ring-foreground/10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="size-9 rounded-[var(--radius-inner,7px)]" />
              <div className="flex flex-1 flex-col gap-1">
                <Bone className="h-4 w-1/2" />
                <Bone className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
        {/* Description block */}
        <div className="mt-4 rounded-[var(--radius-card,14px)] bg-card p-4 ring-1 ring-foreground/10">
          <Bone className="mb-2 h-3 w-full" />
          <Bone className="mb-2 h-3 w-full" />
          <Bone className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  )
}

/* ── 6. CALENDAR SKELETON ───────────────────────────────────── */
function CalendarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <Bone className="size-5 rounded-full" />
        <Bone className="h-5 w-28" />
        <Bone className="size-5 rounded-full" />
      </div>
      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Bone key={i} className="mx-auto h-3 w-6" />
        ))}
      </div>
      {/* Calendar grid */}
      <div className="rounded-[var(--radius-card,14px)] bg-card p-2 ring-1 ring-foreground/10">
        <div className="grid grid-cols-7 gap-[2px]">
          {Array.from({ length: 35 }).map((_, i) => (
            <Bone key={i} className="h-11 rounded-[var(--radius-inner,7px)]" />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── 7. CHAT SKELETON ───────────────────────────────────────── */
function ChatSkeleton({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("flex animate-pulse flex-col gap-3 p-4", className)}>
      {Array.from({ length: count }).map((_, i) => {
        const isReceived = i % 3 !== 1
        return (
          <div key={i} className={cn("flex gap-2", isReceived ? "justify-start" : "justify-end")}>
            {isReceived && <Bone className="size-8 shrink-0 rounded-full" />}
            <Bone
              className={cn("rounded-2xl px-4 py-3", isReceived ? "w-3/5" : "w-2/5")}
              style={{ height: 20 + Math.random() * 30 }}
            />
          </div>
        )
      })}
    </div>
  )
}

export {
  Bone,
  ListingSkeleton,
  ProfileSkeleton,
  StatsSkeleton,
  FeedSkeleton,
  DetailSkeleton,
  CalendarSkeleton,
  ChatSkeleton,
}
