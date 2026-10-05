/**
 * OpenInApp — the "Open in Mukoko" action: a link to the item in the Mukoko
 * super-app, with one line saying what happens.
 *
 * With `service` and `id` the link is the canonical universal link
 * `https://mukoko.com/open/<service>/<id>` (`openInMukokoUrl`): the apps
 * claim it, so it opens the item in the app where it is installed, and the
 * web resolver (mukoko-dev/super-app-web `/open/*`) sends everyone else to the
 * service's own page for it. An explicit `href` wins when given. Never a bare
 * custom scheme. Other actions (`children`) sit beside the button, above the
 * hint.
 *
 * The React build of contract `discover/open-in-app`, beside
 * `discover-open-in-app.astro`: the same markup and classes.
 */
import type { ReactNode } from "react"

import { openInMukokoUrl, type MukokoService } from "@/lib/discover-open-link"
import { buttonVariants } from "@/lib/ui-variants"

export interface OpenInAppProps {
  /** The Mukoko service the item lives in; with `id`, the link is the canonical one. */
  service?: MukokoService
  /** The item's id in that service. */
  id?: string
  /** An explicit https URL; overrides `service` and `id`. */
  href?: string
  /** The action, e.g. "Join in Mukoko" (default "Open in Mukoko"). */
  label?: string
  /** What happens; empty text hides itself. */
  hint?: string
  variant?: "primary" | "outline"
  /** Other actions, links styled as buttons. */
  children?: ReactNode
}

export function OpenInApp({
  service,
  id,
  href,
  label = "Open in Mukoko",
  hint = "Opens in the Mukoko app, or on the web if you don't have it.",
  variant = "primary",
  children,
}: OpenInAppProps) {
  if (href === undefined && (service === undefined || id === undefined)) {
    throw new Error("OpenInApp: pass `service` and `id` (or an explicit `href`)")
  }
  const url = href ?? openInMukokoUrl(service as MukokoService, id as string)
  return (
    <div className="flex flex-col items-start gap-2" data-slot="open-in-app">
      <div className="flex flex-wrap items-center gap-3">
        <a href={url} className={buttonVariants({ variant, size: "md" })} data-variant={variant}>
          {label}
        </a>
        {children}
      </div>
      {hint !== "" && <p className="text-body-sm text-muted-foreground empty:hidden">{hint}</p>}
    </div>
  )
}
