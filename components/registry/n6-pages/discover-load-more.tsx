/**
 * LoadMore — cursor pagination for a Discover page: one link to the next page
 * (`rel="next"`), so it works with no JavaScript and every page is a URL.
 * With no next page it shows `endLabel`, or nothing. `state` is "more" or
 * "end" (default: "more" when `href` is set); CSS shows the matching part.
 *
 * The React build of contract `discover/load-more`, beside
 * `discover-load-more.astro`: the same markup and classes.
 */
import { cn } from "@/lib/ui-utils"
import { buttonVariants } from "@/lib/ui-variants"

export interface LoadMoreProps {
  /** The next page's URL. */
  href?: string
  /** Say what loads, e.g. "More circles". */
  label: string
  /** "more" or "end" (a server-filled shell may pass a placeholder). */
  state?: string
  /** Shown at the end, e.g. "That's every circle." */
  endLabel?: string
  /** The landmark's name (default "More results"). */
  navLabel?: string
}

export function LoadMore({ href, label, state = href ? "more" : "end", endLabel, navLabel = "More results" }: LoadMoreProps) {
  return (
    <nav aria-label={navLabel} className="group/more flex flex-col items-start gap-2" data-slot="load-more" data-state={state}>
      {href !== undefined && state !== "end" && (
        <a
          href={href}
          rel="next"
          className={cn(buttonVariants({ variant: "outline", size: "md" }), "group-data-[state=end]/more:hidden")}
        >
          {label}
        </a>
      )}
      {endLabel !== undefined && (
        <p className="hidden text-body-sm text-muted-foreground group-data-[state=end]/more:block">{endLabel}</p>
      )}
    </nav>
  )
}
