"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useMziziHarness } from "@/lib/harness"

import * as React from "react"
import { MapPin, Star, Navigation } from "@/lib/icons"
import { cn } from "@/lib/utils"
import {
  MziziVerifiedBadge,
  TIER_CONFIG,
  type VerificationTier,
} from "@/components/ui/mzizi-verified-badge"

type PlaceVerification = VerificationTier

/**
 * What a `linkComponent` receives: the `href`, `className` and `children` of the card's link,
 * plus the anchor attributes the card sets (`target`, `rel`, `onClick`, `style` and its
 * `data-slot` / `data-portal` / `data-variant`). Next's `Link` and React Router's `Link` both
 * take these as they are, and render the `<a>` themselves.
 */
type MziziPlaceCardLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string
  className?: string
  children?: React.ReactNode
  [dataAttribute: `data-${string}`]: string | undefined
}

interface MziziPlaceCardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  name: string
  category?: string
  address?: string
  distance?: string
  rating?: number
  reviewCount?: number
  image?: string
  /** Open or closed right now. The card shows this flag only; it has no opening-hours schedule. */
  openNow?: boolean
  verificationTier?: PlaceVerification
  /** Print the tier's name beside the badge. Tier 0 reads "Unverified", where the badge itself draws nothing. */
  showTierLabel?: boolean
  mineral?: "malachite" | "cobalt" | "gold" | "tanzanite" | "terracotta"
  variant?: "row" | "compact"
  /**
   * Make the whole card a real link: the root renders as `<a href>`. Embeds pass
   * `target="_top"` so the link leaves the iframe. Nothing inside the card is
   * interactive, so the link never nests another control.
   */
  href?: string
  /**
   * The link target, with `href`. Any target that opens another browsing context (anything but
   * `_self`, `_top` and `_parent`, so `_blank` or a named window) also sets `rel="noopener noreferrer"`.
   */
  target?: React.HTMLAttributeAnchorTarget
  /**
   * The component that renders the link, with `href`: Next's `Link`, a React Router `Link`, or
   * any component that renders an `<a>` from `href`, `className` and `children`, so the app keeps
   * client-side navigation and prefetch. It receives the same attributes the plain `<a>` would
   * have (`target`, `rel`, `onClick`, `style`, the data attributes). Unset, the card renders a
   * plain `<a>`.
   */
  linkComponent?: React.ComponentType<MziziPlaceCardLinkProps>
  /**
   * The cover image is above the fold (the first card of a list, say): load it eagerly with
   * `fetchpriority="high"`. Without it the image loads lazily and decodes asynchronously.
   */
  priority?: boolean
  /**
   * Called on activation, with or without `href`. Without `href` the card is `role="button"`, focusable,
   * and answers Enter and Space. Clicks and keys that start on an interactive element inside the card
   * (a button or link in `footer`, say) are left to that element and never reach this handler.
   */
  onClick?: () => void
  /**
   * Rendered under the card's main row, inside the card. With `href` set it sits inside
   * the link, so it must hold static content only (text, a badge), never a link or button.
   * Without `href` it may hold controls: their clicks and keys stay theirs and do not fire `onClick`.
   */
  footer?: React.ReactNode
  className?: string
}

const PORTAL = "https://mzizi.dev/components/mzizi-place-card"

/** Targets that keep the link in the same browsing context, so it needs no `rel` guard. */
const SAME_CONTEXT_TARGETS = new Set(["_self", "_top", "_parent"])

const INTERACTIVE = "a,button,input,select,textarea,[role=button],[tabindex]"

/**
 * True when the event started on an interactive element inside the card (not the card itself),
 * which then owns the click or key. The search stops at the card root.
 */
function fromInteractiveDescendant(e: React.SyntheticEvent<HTMLElement>): boolean {
  const root = e.currentTarget
  const target = e.target
  if (target === root || !(target instanceof Element)) return false
  const hit = target.closest(INTERACTIVE)
  return hit != null && hit !== root && root.contains(hit)
}

const mineralColors: Record<string, string> = {
  malachite: "var(--color-malachite,#64FFDA)",
  cobalt: "var(--color-cobalt,#00B0FF)",
  gold: "var(--color-gold,#FFD740)",
  tanzanite: "var(--color-tanzanite,#B388FF)",
  terracotta: "var(--color-terracotta,#D4A574)",
}

function TierMark({ tier, showLabel }: { tier: PlaceVerification; showLabel: boolean }) {
  return (
    <>
      <MziziVerifiedBadge tier={tier} size="sm" />
      {showLabel && (
        <span data-slot="mzizi-place-card-tier" className="shrink-0 text-xs text-muted-foreground">
          {TIER_CONFIG[tier].label}
        </span>
      )}
    </>
  )
}

function MziziPlaceCard({
  loading = false,
  name,
  category,
  address,
  distance,
  rating,
  reviewCount,
  image,
  openNow,
  verificationTier = "unverified",
  showTierLabel = false,
  mineral = "malachite",
  variant = "row",
  href,
  target,
  linkComponent: LinkComponent,
  priority = false,
  onClick,
  footer,
  className,
}: MziziPlaceCardProps) {
  const { motion } = useMziziHarness("place-card")
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
        data-slot="mzizi-place-card"
        data-portal={PORTAL}
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex gap-3">
          <div className="size-20 shrink-0 rounded-[var(--radius-md,12px)] bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-muted" />
            <div className="h-2.5 w-full rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted" />
          </div>
        </div>
      </div>
    )

  const accent = mineralColors[mineral]
  const interactive = Boolean(href || onClick)

  /* The root: a real link with `href`; otherwise an article, or a focusable,
     keyboard-operable button when it has an `onClick`. */
  const rootProps = {
    "data-slot": "mzizi-place-card",
    "data-portal": PORTAL,
    "data-variant": variant,
  }
  const render = (cls: string, style: React.CSSProperties | undefined, body: React.ReactNode) => {
    if (href) {
      const linkProps: MziziPlaceCardLinkProps = {
        ...rootProps,
        href,
        target,
        rel: target && !SAME_CONTEXT_TARGETS.has(target) ? "noopener noreferrer" : undefined,
        onClick,
        style,
        className: cn(cls, "no-underline", className),
      }
      return LinkComponent ? <LinkComponent {...linkProps}>{body}</LinkComponent> : <a {...linkProps}>{body}</a>
    }
    return (
      <div
        {...rootProps}
        role={onClick ? "button" : "article"}
        aria-label={name}
        tabIndex={onClick ? 0 : undefined}
        onClick={
          onClick
            ? (e: React.MouseEvent<HTMLElement>) => {
                if (!fromInteractiveDescendant(e)) onClick()
              }
            : undefined
        }
        onKeyDown={
          onClick
            ? (e: React.KeyboardEvent<HTMLElement>) => {
                if (fromInteractiveDescendant(e)) return
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onClick()
                }
              }
            : undefined
        }
        style={style}
        className={cn(cls, className)}
      >
        {body}
      </div>
    )
  }

  const focusRing =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
  const openFlag =
    openNow != null ? (
      <span
        style={{
          color: openNow ? "var(--status-success, #4ADE80)" : "var(--status-error, #F87171)",
        }}
      >
        {openNow ? "Open" : "Closed"}
      </span>
    ) : null
  /* Lazy and async by default, so a long list costs neither LCP nor bandwidth; `priority`
     for the one card above the fold. */
  const imageLoading = priority
    ? ({ loading: "eager", fetchPriority: "high" } as const)
    : ({ loading: "lazy", decoding: "async" } as const)
  const footerNode = footer != null && (
    <div data-slot="mzizi-place-card-footer" className="mt-2">
      {footer}
    </div>
  )

  if (variant === "compact") {
    return render(
      cn(
        focusRing,
        "block overflow-hidden rounded-[var(--radius-card,14px)] bg-card ring-1 ring-foreground/10",
        interactive && "cursor-pointer transition-shadow hover:shadow-md"
      ),
      animStyle,
      <>
        {image && (
          <div className="relative aspect-[var(--aspect-media,1/1)] overflow-hidden bg-muted">
            {/* The name is the card's text, so the image is decorative. */}
            <img src={image} alt="" {...imageLoading} className="size-full object-cover" />
            {distance && (
              <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                <Navigation className="size-2.5" aria-hidden="true" />
                {distance}
              </span>
            )}
          </div>
        )}
        <div className="p-3">
          <div className="flex items-center gap-1.5">
            <h4 className="line-clamp-1 text-sm font-medium text-foreground">{name}</h4>
            <TierMark tier={verificationTier} showLabel={showTierLabel} />
          </div>
          {category && <span className="text-xs text-muted-foreground">{category}</span>}
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            {rating != null && (
              <span className="flex items-center gap-0.5">
                <Star
                  className="size-3 fill-[var(--color-gold)] text-[var(--color-gold)]"
                  aria-hidden="true"
                />
                {rating.toFixed(1)}
                {reviewCount != null && <span className="opacity-60">({reviewCount})</span>}
              </span>
            )}
            {openFlag}
          </div>
          {footerNode}
        </div>
      </>
    )
  }

  return render(
    cn(
      focusRing,
      "block rounded-[var(--radius-card,14px)] border-l-4 bg-card py-3 pr-4 pl-3 ring-1 ring-foreground/10",
      interactive && "cursor-pointer transition-shadow hover:shadow-md"
    ),
    { borderLeftColor: accent },
    <>
      <div className="flex items-center gap-3">
        {image ? (
          <div className="size-12 shrink-0 overflow-hidden rounded-[var(--radius-inner,7px)] bg-muted">
            <img src={image} alt="" {...imageLoading} className="size-full object-cover" />
          </div>
        ) : (
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-inner,7px)]"
            style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)` }}
          >
            <MapPin className="size-5" style={{ color: accent }} aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="line-clamp-1 text-sm font-medium text-foreground">{name}</span>
            <TierMark tier={verificationTier} showLabel={showTierLabel} />
          </div>
          {category && (
            <span data-slot="mzizi-place-card-category" className="text-xs text-muted-foreground">
              {category}
            </span>
          )}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {address && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" aria-hidden="true" />
                {address}
              </span>
            )}
            {distance && (
              <span className="flex items-center gap-1">
                <Navigation className="size-3" aria-hidden="true" />
                {distance}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {rating != null && (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-foreground">
              <Star
                className="size-3 fill-[var(--color-gold)] text-[var(--color-gold)]"
                aria-hidden="true"
              />
              {rating.toFixed(1)}
            </span>
          )}
          {openNow != null && <span className="text-[10px] font-medium">{openFlag}</span>}
        </div>
      </div>
      {footerNode}
    </>
  )
}

export { MziziPlaceCard }
export type { MziziPlaceCardProps, MziziPlaceCardLinkProps }
