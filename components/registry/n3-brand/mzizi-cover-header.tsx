"use client"
/**
 * MziziCoverHeader — a cover image with an overlapping avatar, a serif name, an optional badge
 * and a trailing action, for profile and place pages.
 *
 * #543 (Kweli): the cover is a real `<img>` (lazy, or eager with `fetchpriority="high"` under
 * `priority`; `coverAlt` for its alt text) instead of an unquoted CSS `url()`; the avatar box is
 * drawn only when there is an avatar; and `role="banner"` is opt-in (`banner`), because the
 * header usually sits inside `<main>`, where a second banner landmark duplicates the page's.
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import { useMziziHarness } from "@/lib/harness"

interface MziziCoverHeaderProps {
  /** The cover image URL, drawn as an `<img>` (lazy by default; see `priority`). */
  coverImage?: string
  /**
   * The cover's alt text. Empty by default: a cover is usually decoration, and the name below
   * it is the heading. Set it when the image itself says something the page needs.
   */
  coverAlt?: string
  /**
   * The cover is the page's largest above-the-fold image (a profile page's hero): load it
   * eagerly with `fetchpriority="high"` for LCP. Without it the cover loads lazily and decodes
   * asynchronously.
   */
  priority?: boolean
  /** The avatar image URL. Without it no avatar is drawn at all (no empty box). */
  avatar?: string
  avatarShape?: "circle" | "rounded"
  name: string
  subtitle?: string
  badge?: React.ReactNode
  action?: React.ReactNode
  coverHeight?: "sm" | "md" | "lg"
  /**
   * Give the root `role="banner"`. Off by default (#543): `banner` is the page's one site-wide
   * header landmark, and the cover header usually sits inside `<main>` on a profile or place
   * page, where a second banner duplicates the page's own and misleads landmark navigation.
   * Set it only when this header is the page's top-level header, outside `<main>`.
   */
  banner?: boolean
  className?: string
}

const HEIGHT_MAP = { sm: "h-24 sm:h-32", md: "h-32 sm:h-48", lg: "h-40 sm:h-56" }

export function MziziCoverHeader({
  coverImage,
  coverAlt = "",
  priority = false,
  avatar,
  avatarShape = "circle",
  name,
  subtitle,
  badge,
  action,
  coverHeight = "md",
  banner = false,
  className,
}: MziziCoverHeaderProps) {
  const { motion } = useMziziHarness("cover-header")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  /* Lazy and async by default; `priority` for a cover that is the page's LCP image. The same
     pair as mzizi-place-card's cover (#549). */
  const imageLoading = priority
    ? ({ loading: "eager", fetchPriority: "high" } as const)
    : ({ loading: "lazy", decoding: "async" } as const)

  return (
    <div
      data-slot="mzizi-cover-header"
      data-portal="https://mzizi.dev/components/mzizi-cover-header"
      role={banner ? "banner" : undefined}
      style={animStyle}
      className={cn("relative", className)}
    >
      {/* A real <img>, not a CSS url(): a URL with a space, a quote or a ")" cannot break it,
          and the browser can prioritise it as the LCP candidate. */}
      <div data-slot="mzizi-cover-header-cover" className={cn(HEIGHT_MAP[coverHeight], "overflow-hidden bg-muted")}>
        {coverImage && (
          <img src={coverImage} alt={coverAlt} {...imageLoading} className="size-full object-cover" />
        )}
      </div>
      <div className="px-4 pb-4">
        {avatar ? (
          <div className="-mt-10 flex items-end justify-between">
            <div
              data-slot="mzizi-cover-header-avatar"
              className={cn(
                "size-20 overflow-hidden border-4 border-background bg-muted",
                avatarShape === "circle" ? "rounded-full" : "rounded-[var(--radius-lg,14px)]"
              )}
            >
              <img src={avatar} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
            </div>
            {action}
          </div>
        ) : (
          action != null && <div className="mt-3 flex justify-end">{action}</div>
        )}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {name}
            </h1>
            {badge}
          </div>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
export type { MziziCoverHeaderProps }
