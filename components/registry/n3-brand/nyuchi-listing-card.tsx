"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI LISTING CARD — Universal Brand Component (Pre-Wired)
   
   This component is FULLY WIRED into the Mukoko infrastructure:
   
   ✅ OBSERVABILITY — Render timing, mount/unmount logging via harness
   ✅ MOTION — Entry animation using motion tokens, reduced-motion safe
   ✅ A11Y — Screen reader announcements for dynamic content, focus ring
   ✅ TOKENS — Uses CSS custom properties (--color-*, --radius-*)
   ✅ HEALTH — Reports to global health monitor
   ✅ TOKEN CHECK — Dev warning if MukokoThemeProvider is missing
   
   No manual configuration needed. Install and use:
   npx shadcn@latest add https://mzizi.dev/api/v1/ui/nyuchi-listing-card
   ═══════════════════════════════════════════════════════════════ */

const mineralAccents = {
  cobalt: "border-l-[var(--color-cobalt)]",
  tanzanite: "border-l-[var(--color-tanzanite)]",
  malachite: "border-l-[var(--color-malachite)]",
  gold: "border-l-[var(--color-gold)]",
  terracotta: "border-l-[var(--color-terracotta)]",
} as const

const mineralBadgeBg = {
  cobalt: "bg-[var(--color-cobalt)]/15 text-[var(--color-cobalt)]",
  tanzanite: "bg-[var(--color-tanzanite)]/15 text-[var(--color-tanzanite)]",
  malachite: "bg-[var(--color-malachite)]/15 text-[var(--color-malachite)]",
  gold: "bg-[var(--color-gold)]/15 text-[var(--color-gold)]",
  terracotta: "bg-[var(--color-terracotta)]/15 text-[var(--color-terracotta)]",
} as const

const listingCardVariants = cva(
  "group/listing bg-card text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:outline-[length:var(--focusRing-width,2px)] focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-[var(--focusRing-offset,2px)]",
  {
    variants: {
      variant: {
        row: "flex items-center gap-3 rounded-[var(--radius-card,14px)] border-l-4 py-3 pr-4 pl-3",
        compact: "flex flex-col overflow-hidden rounded-[var(--radius-card,14px)]",
        hero: "relative flex flex-col justify-end overflow-hidden rounded-[var(--radius-card,14px)] min-h-[200px] p-5",
      },
    },
    defaultVariants: { variant: "row" },
  }
)

type Mineral = keyof typeof mineralAccents

interface MukokoListingMeta {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  value: string
}

interface NyuchiListingCardProps extends VariantProps<typeof listingCardVariants> {
  /** When true, renders a skeleton matching the card variant proportions */
  loading?: boolean
  title: string
  description?: string
  category?: string
  mineral?: Mineral
  image?: string
  meta?: MukokoListingMeta[]
  price?: string | number
  currency?: string
  trailing?: React.ReactNode
  href?: string
  heroGradient?: [string, string]
  className?: string
  onClick?: () => void
  /** Index in a list — used for stagger animation delay */
  index?: number
}

function NyuchiListingCard({
  loading = false,
  title,
  description,
  category,
  mineral = "malachite",
  image,
  meta,
  price,
  currency = "USD",
  trailing,
  href,
  heroGradient,
  variant = "row",
  className,
  onClick,
  index,
}: NyuchiListingCardProps) {
  // ── HARNESS: Connect to infrastructure ──────────────────
  const { motion, LiveRegion } = useNyuchiHarness("listing-card")

  // ── BUILT-IN LOADING STATE ──────────────────────────────────
  // Every component from L2 up has its own loading skeleton.
  // When loading=true, render a skeleton matching the exact
  // proportions of this variant. No external skeleton-set needed.
  if (loading) {
    return (
      <div
        data-slot="nyuchi-listing-card"
        data-portal="https://mzizi.dev/components/nyuchi-listing-card"
        role="article"
        data-loading
        aria-busy="true"
        className={cn(listingCardVariants({ variant }), "animate-pulse", className)}
      >
        {variant === "hero" ? (
          <div className="space-y-3 p-4">
            <div className="h-32 rounded-[var(--radius-md,12px)] bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        ) : variant === "compact" ? (
          <div className="flex items-center gap-3 p-3">
            <div className="size-10 shrink-0 rounded-[var(--radius-sm,7px)] bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-2/3 rounded bg-muted" />
              <div className="h-2.5 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ) : (
          <div className="flex gap-3 p-3">
            <div className="size-12 shrink-0 rounded-[var(--radius-md,12px)] bg-muted" />
            <div className="flex-1 space-y-2 py-0.5">
              <div className="h-3.5 w-3/4 rounded bg-muted" />
              <div className="h-2.5 w-full rounded bg-muted" />
              <div className="h-2.5 w-1/2 rounded bg-muted" />
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── MOTION: Entry animation with stagger for lists ──────
  const animStyle = React.useMemo(() => {
    if (motion.prefersReduced) return {}
    return {
      animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
      animationDelay: index != null ? `${motion.staggerDelay(index)}ms` : "0ms",
    }
  }, [motion, index])

  const isHero = variant === "hero"
  const isRow = variant === "row"
  const isCompact = variant === "compact"

  const formattedPrice =
    typeof price === "number"
      ? new Intl.NumberFormat(undefined, { style: "currency", currency }).format(price)
      : price

  const content = (
    <>
      {/* Screen reader live region for dynamic updates */}
      {LiveRegion}

      {isCompact && image && (
        <div className="aspect-[var(--aspect-media,1/1)] overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="size-full object-cover transition-transform duration-300 group-hover/listing:scale-105"
          />
        </div>
      )}

      {isHero && (
        <div
          className="absolute inset-0"
          style={{
            background: heroGradient
              ? `linear-gradient(135deg, ${heroGradient[0]}, ${heroGradient[1]})`
              : "linear-gradient(135deg, var(--color-malachite-dark, var(--color-malachite-light,#004D40)), #00695C)",
          }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)",
            }}
          />
          {image && (
            <img
              src={image}
              alt=""
              className="size-full object-cover opacity-30 mix-blend-overlay"
            />
          )}
        </div>
      )}

      {isRow && image && (
        <div className="size-12 shrink-0 overflow-hidden rounded-[var(--radius-inner,7px)] bg-muted">
          <img src={image} alt="" className="size-full object-cover" />
        </div>
      )}

      <div
        className={cn(
          "relative flex min-w-0 flex-1 flex-col gap-1.5",
          isCompact && "p-4",
          isHero && "z-10"
        )}
      >
        {category && (
          <span
            className={cn(
              "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase",
              isHero ? "bg-white/20 text-white" : mineralBadgeBg[mineral]
            )}
          >
            {category}
          </span>
        )}
        <h3
          className={cn(
            "leading-snug font-medium",
            isHero && "font-serif text-lg text-white sm:text-xl",
            (isRow || isCompact) && "text-sm text-foreground"
          )}
        >
          {title}
        </h3>
        {description && (
          <p
            className={cn(
              "line-clamp-2 text-xs leading-relaxed",
              isHero ? "text-white/70" : "text-muted-foreground"
            )}
          >
            {description}
          </p>
        )}
        {meta && meta.length > 0 && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs",
              isHero ? "text-white/65" : "text-muted-foreground"
            )}
          >
            {meta.map((m) => (
              <span key={m.label} className="inline-flex items-center gap-1">
                {m.icon && <m.icon className="size-3" />}
                {m.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {(trailing || formattedPrice) && isRow && (
        <div className="flex shrink-0 items-center gap-2">
          {formattedPrice && (
            <span
              className={cn(
                "text-sm font-semibold",
                formattedPrice === "Free" || price === 0
                  ? "text-[var(--color-malachite)]"
                  : "text-foreground"
              )}
            >
              {price === 0 ? "Free" : formattedPrice}
            </span>
          )}
          {trailing}
        </div>
      )}

      {formattedPrice && isCompact && (
        <div className="px-4 pb-3">
          <span className="text-sm font-semibold text-foreground">
            {price === 0 ? "Free" : formattedPrice}
          </span>
        </div>
      )}
    </>
  )

  const classes = cn(
    listingCardVariants({ variant }),
    isRow && mineralAccents[mineral],
    (href || onClick) && "cursor-pointer",
    className
  )

  if (href) {
    return (
      <a
        data-slot="nyuchi-listing-card"
        role="article"
        data-mineral={mineral}
        data-variant={variant}
        href={href}
        className={classes}
        style={animStyle}
      >
        {content}
      </a>
    )
  }

  return (
    <div
      data-slot="nyuchi-listing-card"
      role="article"
      data-mineral={mineral}
      data-variant={variant}
      onClick={onClick}
      className={classes}
      style={animStyle}
    >
      {content}
    </div>
  )
}

export { NyuchiListingCard, listingCardVariants }
export type { NyuchiListingCardProps, MukokoListingMeta, Mineral }
