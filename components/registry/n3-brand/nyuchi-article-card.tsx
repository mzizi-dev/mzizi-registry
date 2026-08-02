"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { Clock, BookOpen, CheckCircle, AlertTriangle, HelpCircle } from "@/lib/icons"
import { cn } from "@/lib/utils"

type FactCheckStatus = "verified" | "disputed" | "unverified" | "false" | "pending"

const factCheckConfig: Record<
  FactCheckStatus,
  { label: string; color: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
> = {
  verified: { label: "Verified", color: "var(--status-success, #64FFDA)", icon: CheckCircle },
  disputed: { label: "Disputed", color: "var(--status-warning, #FFD740)", icon: AlertTriangle },
  unverified: { label: "Unverified", color: "var(--status-neutral, #6B6B66)", icon: HelpCircle },
  false: { label: "False", color: "var(--status-error, #FF5252)", icon: AlertTriangle },
  pending: { label: "Checking", color: "var(--color-cobalt,#00B0FF)", icon: Clock },
}

interface NyuchiArticleCardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  title: string
  excerpt?: string
  image?: string
  sourceName?: string
  sourceVerified?: boolean
  authorName?: string
  publishedAt?: string
  readTime?: string
  category?: string
  factCheckStatus?: FactCheckStatus
  variant?: "row" | "compact" | "hero"
  onClick?: () => void
  className?: string
}

function NyuchiArticleCard({
  loading = false,
  title,
  excerpt,
  image,
  sourceName,
  sourceVerified,
  authorName,
  publishedAt,
  readTime,
  category,
  factCheckStatus,
  variant = "row",
  onClick,
  className,
}: NyuchiArticleCardProps) {
  const { motion } = useNyuchiHarness("article-card")
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
        data-slot="nyuchi-article-card"
        data-portal="https://mzizi.dev/components/nyuchi-article-card"
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex gap-3">
          <div className="size-20 shrink-0 rounded-[var(--radius-md,12px)] bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-muted" />
            <div className="h-2.5 w-full rounded bg-muted" />
            <div className="h-2.5 w-1/2 rounded bg-muted" />
          </div>
        </div>
      </div>
    )

  const fcConfig = factCheckStatus ? factCheckConfig[factCheckStatus] : null
  const FcIcon = fcConfig?.icon

  if (variant === "hero") {
    return (
      <div
        data-slot="nyuchi-article-card"
        role="article"
        tabIndex={0}
        onClick={onClick}
        className={cn(
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
          "relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-[var(--radius-card,14px)] p-5",
          onClick && "cursor-pointer",
          className
        )}
      >
        {image && <img src={image} alt="" className="absolute inset-0 size-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative z-10">
          {category && (
            <span className="mb-2 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
              {category}
            </span>
          )}
          <h3 className="font-serif text-lg leading-snug font-bold text-white">{title}</h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
            {sourceName && <span>{sourceName}</span>}
            {publishedAt && <span>{publishedAt}</span>}
            {readTime && (
              <span className="flex items-center gap-1">
                <BookOpen className="size-3" />
                {readTime}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div
        data-slot="nyuchi-article-card"
        role="article"
        onClick={onClick}
        className={cn(
          "overflow-hidden rounded-[var(--radius-card,14px)] bg-card ring-1 ring-foreground/10",
          onClick && "cursor-pointer transition-shadow hover:shadow-md",
          className
        )}
      >
        {image && (
          <div className="aspect-[var(--aspect-media,1/1)] overflow-hidden bg-muted">
            <img src={image} alt="" className="size-full object-cover" />
          </div>
        )}
        <div className="p-4">
          {category && (
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {category}
            </span>
          )}
          <h4 className="mt-1 line-clamp-2 text-sm font-medium text-foreground">{title}</h4>
          {excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{excerpt}</p>}
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{sourceName || authorName}</span>
            <div className="flex items-center gap-2">
              {readTime && <span>{readTime}</span>}
              {fcConfig && FcIcon && (
                <FcIcon className="size-3" style={{ color: fcConfig.color }} />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      data-slot="nyuchi-article-card"
      style={animStyle}
      role="article"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-card,14px)] bg-card px-4 py-3 ring-1 ring-foreground/10",
        onClick && "cursor-pointer transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {category && (
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {category}
          </span>
        )}
        <h4 className="line-clamp-2 text-sm font-medium text-foreground">{title}</h4>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
          {sourceName && (
            <span className="flex items-center gap-1">
              {sourceName}
              {sourceVerified && <CheckCircle className="size-2.5 text-[var(--color-malachite)]" />}
            </span>
          )}
          {publishedAt && <span>· {publishedAt}</span>}
          {readTime && (
            <span className="flex items-center gap-1">
              <BookOpen className="size-3" />
              {readTime}
            </span>
          )}
        </div>
        {fcConfig && FcIcon && (
          <span
            className="mt-1 flex items-center gap-1 text-[10px] font-medium"
            style={{ color: fcConfig.color }}
          >
            <FcIcon className="size-3" />
            {fcConfig.label}
          </span>
        )}
      </div>
      {image && (
        <div className="size-16 shrink-0 overflow-hidden rounded-[var(--radius-inner,7px)] bg-muted">
          <img src={image} alt="" className="size-full object-cover" />
        </div>
      )}
    </div>
  )
}

export { NyuchiArticleCard }
export type { NyuchiArticleCardProps, FactCheckStatus }
