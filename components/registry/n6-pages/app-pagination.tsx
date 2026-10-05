import { Fragment } from "react";

import { withParams } from "@/lib/server-table";

/**
 * Pagination — "Showing 26–50 of 112" and previous/next/page links. Links,
 * not buttons: every page is a URL. Hidden when everything fits on one page.
 *
 * The React build of contract `app/pagination`, beside `app-pagination.astro`
 * (same markup and classes). A server component.
 */
interface PaginationProps {
  /** The current URL; page links keep its other parameters. */
  url: string | URL;
  page: number;
  pageCount: number;
  total: number;
  from: number;
  to: number;
  noun?: string;
}

const link =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-sm px-2.5 text-body-sm font-medium pointer-coarse:h-11 pointer-coarse:min-w-11";

function Pagination({
  url: rawUrl,
  page,
  pageCount,
  total,
  from,
  to,
  noun = "results",
}: PaginationProps) {
  const url = new URL(rawUrl);
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );
  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      data-slot="pagination"
    >
      <p className="text-caption text-muted-foreground" aria-live="polite">
        {total === 0
          ? `No ${noun}`
          : `Showing ${from}–${to} of ${total} ${noun}`}
      </p>
      {pageCount > 1 && (
        <nav aria-label="Pagination">
          <ul className="flex flex-wrap items-center gap-1">
            <li>
              {page > 1 ? (
                <a
                  className={`${link} hover:bg-muted`}
                  href={withParams(url, { page: page - 1 })}
                  rel="prev"
                >
                  Previous
                </a>
              ) : (
                <span
                  className={`${link} text-muted-foreground`}
                  aria-disabled="true"
                >
                  Previous
                </span>
              )}
            </li>
            {pages.map((p, i) => (
              <Fragment key={p}>
                {i > 0 && p - (pages[i - 1] ?? p) > 1 && (
                  <li aria-hidden="true" className="px-2 text-muted-foreground">
                    …
                  </li>
                )}
                <li>
                  <a
                    className={`${link} ${p === page ? "bg-foreground text-background" : "hover:bg-muted"}`}
                    href={withParams(url, { page: p })}
                    aria-current={p === page ? "page" : undefined}
                    aria-label={`Page ${p}`}
                  >
                    {p}
                  </a>
                </li>
              </Fragment>
            ))}
            <li>
              {page < pageCount ? (
                <a
                  className={`${link} hover:bg-muted`}
                  href={withParams(url, { page: page + 1 })}
                  rel="next"
                >
                  Next
                </a>
              ) : (
                <span
                  className={`${link} text-muted-foreground`}
                  aria-disabled="true"
                >
                  Next
                </span>
              )}
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export { Pagination, type PaginationProps };
