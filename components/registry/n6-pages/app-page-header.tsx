import type { ReactNode } from "react";

/**
 * PageHeader (React) — a page's title with an optional "View docs" pill, one
 * line of description, breadcrumbs and actions. Compact, like a product
 * console: a 20px title, no rule under it. The one <h1> on an app page.
 * Implements contract `app/page-header` beside `app-page-header.astro`, with
 * the same markup. A server component: no script.
 */
interface PageHeaderCrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  crumbs?: PageHeaderCrumb[];
  /** Link to the page's documentation, shown as a small pill. */
  docsHref?: string | URL;
  docsLabel?: string;
  /** The `actions` slot. */
  actions?: ReactNode;
}

function PageHeader({
  title,
  description,
  crumbs = [],
  docsHref,
  docsLabel = "View docs",
  actions,
}: PageHeaderProps) {
  const hasActions =
    actions !== undefined && actions !== null && actions !== false;
  return (
    <header
      className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      data-slot="page-header"
    >
      <div className="min-w-0">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1">
            <ol className="flex flex-wrap items-center gap-1 text-caption text-muted-foreground">
              {crumbs.map((c, i) => (
                <li key={`${i}-${c.label}`} className="flex items-center gap-1">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {c.href ? (
                    <a
                      className="underline-offset-4 hover:text-foreground hover:underline"
                      href={c.href}
                    >
                      {c.label}
                    </a>
                  ) : (
                    <span aria-current="page">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h1 className="text-h5 font-semibold tracking-tight">{title}</h1>
          {docsHref && (
            <a
              href={String(docsHref)}
              className="inline-flex h-6 items-center rounded-full border border-border px-2.5 text-caption font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-slot="docs-pill"
            >
              {docsLabel}
              <span className="sr-only"> for {title}</span>
            </a>
          )}
        </div>
        {description && (
          <p className="mt-1 max-w-prose text-body-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {hasActions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </header>
  );
}

export { PageHeader, type PageHeaderCrumb, type PageHeaderProps };
