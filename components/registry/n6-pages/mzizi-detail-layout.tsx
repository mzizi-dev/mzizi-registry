"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.

import * as React from "react"
import { ArrowLeft, Heart, Share2 } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

/* ═══════════════════════════════════════════════════════════════
   MUKOKO DETAIL LAYOUT — Brand Listing Component
   
   The standardized detail view for any single piece of content:
   events, articles, products, bush trade items, places, profiles.
   
   Two hero modes:
   - image: Standard hero with image + gradient overlay
   - gradient: Full-bleed mineral gradient (from nhimbe mockup)
     with radial texture overlay and floating action buttons
   
   Design identity markers:
   - Floating circular action buttons (back, like, share) with
     frosted glass background on the hero
   - Pill badge for category above the title
   - Noto Serif title in hero mode, large and bold
   - Sticky bottom CTA bar slot (for RSVP, Buy, etc.)
   ═══════════════════════════════════════════════════════════════ */

interface DetailLayoutProps {
  /* ── Content ────────────────────────────────────────────── */
  title: string
  subtitle?: string
  category?: string
  metadata?: React.ReactNode
  children: React.ReactNode
  aside?: React.ReactNode

  /* ── Hero ───────────────────────────────────────────────── */
  /** Hero image URL */
  heroImage?: string
  /** Hero gradient — [from, to] hex colors. If set, uses gradient mode */
  heroGradient?: [string, string]
  /** Minimum height of hero area (default 220) */
  heroMinHeight?: number

  /* ── Actions ────────────────────────────────────────────── */
  /** Show floating action buttons on hero (back, like, share) */
  showHeroActions?: boolean
  onBack?: () => void
  onLike?: () => void
  onShare?: () => void
  liked?: boolean
  /** Right-side actions slot (desktop header) */
  actions?: React.ReactNode
  /** Sticky bottom CTA bar content */
  bottomCta?: React.ReactNode

  /* ── Navigation ─────────────────────────────────────────── */
  backHref?: string
  backLabel?: string

  className?: string
}

/* ── Floating glass button for hero overlay ─────────────────── */
function HeroButton({
  onClick,
  children,
  label,
}: {
  onClick?: () => void
  children: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-10 items-center justify-center rounded-full",
        "bg-black/25 backdrop-blur-lg transition-colors hover:bg-black/40"
      )}
    >
      {children}
    </button>
  )
}

export function DetailLayout({
  title,
  subtitle,
  category,
  metadata,
  children,
  aside,
  heroImage,
  heroGradient,
  heroMinHeight = 220,
  showHeroActions = false,
  onBack,
  onLike,
  onShare,
  liked = false,
  actions,
  bottomCta,
  backHref,
  backLabel = "Back",
  className,
}: DetailLayoutProps) {
  const hasHero = !!(heroImage || heroGradient)
  const isGradientHero = !!heroGradient

  return (
    <article
      data-slot="detail-layout"
      data-portal="https://mzizi.dev/components/detail-layout"
      className={cn("relative w-full", bottomCta && "pb-24", className)}
    >
      {/* ═══ HERO AREA ═══════════════════════════════════════ */}
      {hasHero && (
        <div
          className="relative flex flex-col justify-end overflow-hidden"
          style={{
            minHeight: heroMinHeight,
            ...(isGradientHero
              ? { background: `linear-gradient(135deg, ${heroGradient[0]}, ${heroGradient[1]})` }
              : {}),
          }}
        >
          {/* Gradient texture overlay — brand identity */}
          {isGradientHero && (
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)",
              }}
            />
          )}

          {/* Image (used as bg in gradient mode, as hero in image mode) */}
          {heroImage && !isGradientHero && (
            <>
              <img src={heroImage} alt="" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </>
          )}
          {heroImage && isGradientHero && (
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-30 mix-blend-overlay"
            />
          )}

          {/* Floating action buttons */}
          {showHeroActions && (
            <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between">
              <HeroButton onClick={onBack} label="Go back">
                <ArrowLeft className="size-5 text-white" />
              </HeroButton>
              <div className="flex gap-2">
                {onLike && (
                  <HeroButton onClick={onLike} label={liked ? "Unlike" : "Like"}>
                    <Heart
                      className="size-5"
                      color={liked ? "var(--status-error, #FF5252)" : "#fff"}
                      fill={liked ? "var(--status-error, #FF5252)" : "none"}
                    />
                  </HeroButton>
                )}
                {onShare && (
                  <HeroButton onClick={onShare} label="Share">
                    <Share2 className="size-5 text-white" />
                  </HeroButton>
                )}
              </div>
            </div>
          )}

          {/* Hero content: category badge + title */}
          <div className="relative z-10 p-5">
            {category && (
              <span className="mb-2 inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
                {category}
              </span>
            )}
            <h1 className="inherit text-2xl leading-tight font-bold text-white sm:text-3xl">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
          </div>
        </div>
      )}

      {/* ═══ NON-HERO HEADER ═════════════════════════════════ */}
      {!hasHero && (
        <div className="px-4 py-6 sm:px-6">
          {/* Back navigation */}
          {(backHref || onBack) && (
            <a
              href={backHref}
              onClick={
                onBack
                  ? (e) => {
                      e.preventDefault()
                      onBack()
                    }
                  : undefined
              }
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {backLabel}
            </a>
          )}
          <h1 className="inherit text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {/* ═══ BODY ════════════════════════════════════════════ */}
      <div className={cn("flex flex-col gap-8 px-4 py-4 sm:px-6", aside && "lg:flex-row")}>
        <div className="min-w-0 flex-1">
          {metadata && <div className="flex flex-wrap items-center gap-3">{metadata}</div>}
          {actions && (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div>
              <Separator className="my-6" />
            </>
          )}
          {!actions && metadata && <Separator className="my-6" />}
          <div>{children}</div>
        </div>
        {aside && (
          <aside className="w-full shrink-0 lg:w-72">
            <div className="sticky top-20 space-y-4">{aside}</div>
          </aside>
        )}
      </div>

      {/* ═══ STICKY BOTTOM CTA ═══════════════════════════════ */}
      {bottomCta && (
        <div
          data-slot="detail-cta"
          className={cn(
            "fixed inset-x-0 bottom-0 z-20 px-5 pt-4 pb-7",
            "bg-gradient-to-t from-background via-background/95 to-transparent"
          )}
        >
          {bottomCta}
        </div>
      )}
    </article>
  )
}
