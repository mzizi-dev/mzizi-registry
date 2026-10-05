/**
 * DiscoverShell — the frame of every public Discover site in the Mukoko
 * family: a skip link, the mineral strip, a header (the brand, the main
 * navigation, one action), the page in <main id="main">, and a footer. It
 * goes inside <body>; the app owns <head> (with DiscoverMeta).
 *
 * The React build of contract `discover/discover-shell`, beside
 * `discover-shell.astro`: the same markup and classes.
 */
import type { ReactNode } from "react"

import { MineralStrip } from "@/components/ui/site-mineral-strip"
import { buttonVariants } from "@/lib/ui-variants"

export interface DiscoverShellLink {
  label: string
  href: string
  /** The current section: true (or "page") sets aria-current="page". */
  current?: boolean | string
}

export interface DiscoverShellProps {
  /** The home link's accessible name, e.g. "mukoko circles, home". */
  homeLabel: string
  homeHref?: string
  nav?: DiscoverShellLink[]
  footerLinks?: DiscoverShellLink[]
  /** One quiet line at the foot, e.g. "Part of the Bundu ecosystem." */
  footerNote?: string
  /** The seven-mineral strip on the left edge (default true). */
  strip?: boolean
  skipLabel?: string
  /** The service's mark and wordmark, inside the home link. */
  brand?: ReactNode
  /** One primary action in the header. */
  action?: ReactNode
  /** Extra footer content. */
  footer?: ReactNode
  /** The page. */
  children?: ReactNode
}

const cur = (c: DiscoverShellLink["current"]) => (c === true ? "page" : c === false || c === undefined ? undefined : c)
const link = "text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"

export function DiscoverShell({
  homeLabel,
  homeHref = "/",
  nav = [],
  footerLinks = [],
  footerNote,
  strip = true,
  skipLabel = "Skip to content",
  brand,
  action,
  footer,
  children,
}: DiscoverShellProps) {
  const hasAction = action !== undefined && action !== null && action !== false
  return (
    <div className="flex min-h-dvh flex-col" data-slot="discover-shell">
      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 ${buttonVariants({ variant: "secondary", size: "md" })}`}
      >
        {skipLabel}
      </a>
      {strip && <MineralStrip />}
      <header className="border-b border-border bg-background">
        <div className="container-custom flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
          <a
            href={homeHref}
            aria-label={homeLabel}
            className="inline-flex min-h-11 items-center gap-2 text-foreground no-underline"
            data-slot="discover-home"
          >
            {brand}
          </a>
          {nav.length > 0 && (
            <nav aria-label="Main" className="order-3 w-full sm:order-none sm:w-auto">
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-1 text-body-sm">
                {nav.map((l) => (
                  <li key={`${l.href}|${l.label}`}>
                    <a
                      href={l.href}
                      aria-current={cur(l.current) as "page" | undefined}
                      className={`inline-flex min-h-11 items-center ${link} aria-[current=page]:font-semibold aria-[current=page]:decoration-foreground`}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {hasAction && <div className="flex items-center gap-2">{action}</div>}
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <footer className="mt-auto border-t border-border bg-secondary">
        <div className="container-custom grid gap-8 py-12 md:grid-cols-3">
          {footer}
          {footerLinks.length > 0 && (
            <nav aria-label="Footer" className="text-body-sm">
              <ul className="space-y-1">
                {footerLinks.map((l) => (
                  <li key={`${l.href}|${l.label}`}>
                    <a
                      href={l.href}
                      aria-current={cur(l.current) as "page" | undefined}
                      className={`inline-flex min-h-11 items-center ${link}`}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {footerNote !== undefined && (
            <p className="text-body-sm text-muted-foreground md:col-span-3 empty:hidden">{footerNote}</p>
          )}
        </div>
      </footer>
    </div>
  )
}
