"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { BREADCRUMB_LABELS } from "@/lib/nav"

/**
 * Breadcrumb trail for every route except `/`. Walks the current pathname
 * segments, maps each to a display label via `BREADCRUMB_LABELS` (falls
 * back to Title Case), and links every segment except the last (which
 * is the current page, so non-clickable + `aria-current="page"`).
 *
 * Sits below the header, above the page body. Returns `null` on `/` so
 * the landing page doesn't get a "Home" breadcrumb pointing at itself.
 */

function labelFor(segment: string): string {
  if (BREADCRUMB_LABELS[segment]) return BREADCRUMB_LABELS[segment]
  return segment
    .split("-")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ")
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) return null

  const crumbs = segments.map((segment, i) => ({
    segment,
    href: "/" + segments.slice(0, i + 1).join("/"),
    label: labelFor(segment),
  }))

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex min-h-[48px] flex-wrap items-center gap-2 text-xs text-muted-foreground",
        className
      )}
    >
      <Link
        href="/"
        className="inline-flex min-h-[48px] items-center rounded-sm px-1 py-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Home
      </Link>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={crumb.href} className="flex items-center gap-2">
            <ChevronRight className="size-3 opacity-50" aria-hidden="true" />
            {isLast ? (
              <span
                className="inline-flex min-h-[48px] items-center px-1 py-2 font-medium text-foreground"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="inline-flex min-h-[48px] items-center rounded-sm px-1 py-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
