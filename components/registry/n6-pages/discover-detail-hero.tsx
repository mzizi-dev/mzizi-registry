/**
 * DetailHero — the top of the page for ONE item reached from a Discover page
 * (an article, an event, a public circle, a place): the breadcrumb, an
 * eyebrow, the page's one <h1>, when and where, a lead, the actions, and the
 * item's image (eager, decorative by default) or `media`. With media, two
 * columns from 64rem. Text props that arrive empty hide themselves.
 *
 * The React build of contract `discover/detail-hero`, beside
 * `discover-detail-hero.astro`: the same markup and classes.
 */
import type { ReactNode } from "react"

import { Icon } from "@/components/ui/site-icon"
import { cn } from "@/lib/ui-utils"

export interface DetailHeroProps {
  /** The item's name: the page's only <h1>. */
  title: string
  /** The service, source or category, e.g. "Mukoko Events". */
  eyebrow?: string
  /** One or two sentences. */
  lead?: string
  /** An image URL; replaced by `media`. */
  image?: string
  imageAlt?: string
  /** ISO 8601 for <time datetime>; `dateLabel` is what reads. */
  datetime?: string
  dateLabel?: string
  /** Venue, town or region. */
  place?: string
  /** The trail above the eyebrow (a DiscoverBreadcrumb). */
  breadcrumb?: ReactNode
  /** Under the lead (a DetailActions). */
  actions?: ReactNode
  /** Replaces `image`: a map, a weather figure, a gallery. */
  media?: ReactNode
}

const has = (n: ReactNode) => n !== undefined && n !== null && n !== false

export function DetailHero({
  title,
  eyebrow,
  lead,
  image,
  imageAlt = "",
  datetime,
  dateLabel,
  place,
  breadcrumb,
  actions,
  media,
}: DetailHeroProps) {
  const hasMedia = has(media) || image !== undefined
  const hasWhen = dateLabel !== undefined || place !== undefined
  return (
    <header className="border-b border-border bg-background" data-slot="detail-hero" data-media={hasMedia ? "true" : "false"}>
      <div className={cn("container-custom grid gap-8 py-10 md:py-14", hasMedia && "lg:grid-cols-2 lg:items-center lg:gap-12")}>
        <div className="min-w-0">
          {has(breadcrumb) && <div className="mb-4">{breadcrumb}</div>}
          {eyebrow !== undefined && <p className="eyebrow empty:hidden">{eyebrow}</p>}
          <h1 className="max-w-4xl font-serif text-h1 text-balance">{title}</h1>
          {hasWhen && (
            <ul
              className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-body font-semibold text-foreground"
              data-slot="detail-hero-when"
            >
              {dateLabel !== undefined && (
                <li className="inline-flex items-center gap-2">
                  <Icon name="calendar" className="shrink-0 text-muted-foreground" />
                  <time dateTime={datetime} className="empty:hidden">
                    {dateLabel}
                  </time>
                </li>
              )}
              {place !== undefined && (
                <li className="inline-flex items-center gap-2">
                  <Icon name="map-pin" className="shrink-0 text-muted-foreground" />
                  <span className="empty:hidden">{place}</span>
                </li>
              )}
            </ul>
          )}
          {lead !== undefined && (
            <p className="mt-4 max-w-2xl text-body-lg text-muted-foreground text-pretty empty:hidden">{lead}</p>
          )}
          {has(actions) && <div className="mt-6">{actions}</div>}
        </div>
        {has(media) ? (
          <div className="min-w-0 overflow-hidden rounded-lg bg-muted" data-slot="detail-hero-media">
            {media}
          </div>
        ) : (
          image !== undefined && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={imageAlt}
              width="1200"
              height="675"
              decoding="async"
              className="aspect-video w-full rounded-lg bg-muted object-cover"
              data-slot="detail-hero-media"
            />
          )
        )}
      </div>
    </header>
  )
}
