"use client"

/* COMPOSITION: Should compose L2 breadcrumb primitive instead of
   rendering breadcrumbs inline. Currently approved for use as-is. */
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI PAGE — Layer 6 Page Composition
   Canonical page wrapper. SEO, metadata, layout presets.
   ═══════════════════════════════════════════════════════════════ */

type PageLayout = "feed" | "detail" | "settings" | "dashboard" | "auth" | "blank"

interface SEOMetadata {
  title: string
  description?: string
  canonicalUrl?: string
  ogImage?: string
  ogType?: "website" | "article" | "profile" | "product"
  schemaType?: string
  schemaData?: Record<string, unknown>
  noIndex?: boolean
}

interface NyuchiPageProps {
  layout?: PageLayout
  seo?: SEOMetadata
  /** Breadcrumb items */
  breadcrumbs?: { label: string; href?: string }[]
  /** Page heading */
  heading?: string
  /** Sub heading */
  subheading?: string
  /** Show back button */
  showBack?: boolean
  onBack?: () => void
  /** Page-level loading state */
  loading?: boolean
  children: React.ReactNode
  className?: string
}

const LAYOUT_CLASSES: Record<PageLayout, string> = {
  feed: "max-w-2xl mx-auto",
  detail: "max-w-4xl mx-auto",
  settings: "max-w-2xl mx-auto",
  dashboard: "max-w-7xl mx-auto",
  auth: "min-h-screen flex items-center justify-center",
  blank: "",
}

export function NyuchiPage({
  layout = "blank",
  seo,
  breadcrumbs,
  heading,
  subheading,
  showBack = false,
  onBack,
  loading = false,
  children,
  className,
}: NyuchiPageProps) {
  const { motion } = useNyuchiHarness(`page-${seo?.title || layout}`)
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  React.useEffect(() => {
    if (seo?.title) document.title = `${seo.title} — Mukoko`
  }, [seo?.title])

  if (loading) {
    return (
      <main
        data-slot="nyuchi-page"
        data-portal="https://mzizi.dev/components/nyuchi-page"
        data-layout={layout}
        data-loading
        role="main"
        className={cn("px-4 py-6", LAYOUT_CLASSES[layout], className)}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-muted" />
          <div className="h-64 rounded-[var(--radius-lg,14px)] bg-muted" />
          <div className="h-32 rounded-[var(--radius-lg,14px)] bg-muted" />
        </div>
      </main>
    )
  }

  return (
    <main
      data-slot="nyuchi-page"
      data-layout={layout}
      role="main"
      style={animStyle}
      className={cn("px-4 py-6", LAYOUT_CLASSES[layout], className)}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <span aria-hidden="true" className="text-muted-foreground/40">
                    /
                  </span>
                )}
                <li>
                  {crumb.href ? (
                    <a href={crumb.href} className="transition-colors hover:text-foreground">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-foreground">{crumb.label}</span>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ol>
        </nav>
      )}

      {/* Page header */}
      {(heading || showBack) && (
        <header className="mb-6 flex items-start gap-3">
          {showBack && (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="mt-1 flex size-10 min-h-[48px] min-w-[48px] items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            {heading && <h1 className="text-2xl font-bold text-foreground">{heading}</h1>}
            {subheading && <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>}
          </div>
        </header>
      )}

      {children}
    </main>
  )
}

export type { PageLayout, SEOMetadata, NyuchiPageProps }
