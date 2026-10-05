/**
 * DetailActions — the action row of one item's page on a Discover site.
 * "Open in Mukoko" leads (an OpenInApp, primary): with `service` and `id` it
 * is the canonical universal link `https://mukoko.com/open/<service>/<id>`;
 * `href` overrides it. Secondary actions follow in the same row (`links`,
 * then `children`), and share links sit under the hint in a labelled list.
 * Every action is a link, sharing included: no client script.
 *
 * The React build of contract `discover/detail-actions`, beside
 * `discover-detail-actions.astro`: the same markup and classes.
 */
import type { ReactNode } from "react"

import { OpenInApp } from "@/components/ui/discover-open-in-app"
import type { MukokoService } from "@/lib/discover-open-link"
import { buttonVariants } from "@/lib/ui-variants"

export interface DetailAction {
  label: string
  href: string
  /** The link leaves the site: rel="external noopener". */
  external?: boolean
}

export interface DetailActionsProps {
  /** The Mukoko service the item lives in; with `id`, "Open in Mukoko" is the canonical link. */
  service?: MukokoService
  /** The item's id in that service. */
  id?: string
  /** An explicit https URL for "Open in Mukoko"; overrides `service` and `id`. */
  href?: string
  /** The primary action's text (default "Open in Mukoko"). */
  label?: string
  /** What "Open in Mukoko" does; "" for none. */
  hint?: string
  /** Secondary actions in the same row, as outline buttons. */
  links?: DetailAction[]
  /** Share links (share URLs, never a script). */
  share?: DetailAction[]
  /** The share list's name (default "Share"). */
  shareLabel?: string
  /** More actions, links styled as buttons. */
  children?: ReactNode
}

const rel = (a: DetailAction) => (a.external ? "external noopener" : undefined)

export function DetailActions({
  service,
  id,
  href,
  label,
  hint,
  links = [],
  share = [],
  shareLabel = "Share",
  children,
}: DetailActionsProps) {
  return (
    <div className="grid gap-4" data-slot="detail-actions">
      <OpenInApp service={service} id={id} href={href} label={label} hint={hint} variant="primary">
        {links.map((a, i) => (
          <a
            key={`${i}|${a.href}`}
            href={a.href}
            rel={rel(a)}
            className={buttonVariants({ variant: "outline", size: "md" })}
            data-slot="detail-actions-link"
          >
            {a.label}
          </a>
        ))}
        {children}
      </OpenInApp>
      {share.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-slot="detail-actions-share">
          <p className="text-body-sm font-semibold text-muted-foreground" aria-hidden="true">
            {shareLabel}
          </p>
          <ul aria-label={shareLabel} className="flex flex-wrap items-center gap-1">
            {share.map((a, i) => (
              <li key={`${i}|${a.href}`}>
                <a href={a.href} rel={rel(a)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  {a.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
