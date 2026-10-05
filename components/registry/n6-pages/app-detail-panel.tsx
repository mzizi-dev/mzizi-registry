import type { ReactNode } from "react";

import { cn } from "@/lib/ui-utils";
import { cardVariants } from "@/lib/ui-variants";

/**
 * DetailPanel — one record as a description list, with an optional
 * read-only "full record" disclosure and an actions slot. Used for a
 * selected row beside a DataTable, and for single-record sections.
 *
 * The React build of contract `app/detail-panel`, beside
 * `app-detail-panel.astro` (same markup and classes; the card uses the
 * shared `cardVariants` recipe). A server component.
 */
interface DetailItem {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}

interface DetailPanelProps {
  title: string;
  /** Heading level inside the page (default h2). */
  level?: 2 | 3;
  description?: string;
  items: DetailItem[];
  /** Shown as formatted JSON under a "Full record" disclosure. */
  record?: unknown;
  id?: string;
  children?: ReactNode;
  actions?: ReactNode;
}

function DetailPanel({
  title,
  level = 2,
  description,
  items,
  record,
  id,
  children,
  actions,
}: DetailPanelProps) {
  const Heading = level === 2 ? "h2" : "h3";
  const headingId = `${id ?? "detail"}-title`;
  const hasActions =
    actions !== undefined && actions !== null && actions !== false;
  return (
    <section
      aria-labelledby={headingId}
      id={id}
      className="@container"
      data-slot="detail-panel"
    >
      <div
        className={cn(
          cardVariants({ padding: "none" }),
          "overflow-hidden rounded-md",
        )}
        data-slot="card"
      >
        <div className="flex flex-col gap-1 border-b border-border px-4 py-3">
          <Heading id={headingId} className="text-h6 font-semibold">
            {title}
          </Heading>
          {description && (
            <p className="text-body-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <dl className="divide-y divide-border">
          {items.map((item, i) => (
            <div
              key={i}
              className="grid gap-0.5 px-4 py-2.5 @lg:grid-cols-[11rem_minmax(0,1fr)] @lg:gap-6"
            >
              <dt className="text-body-sm font-medium text-muted-foreground">
                {item.label}
              </dt>
              <dd
                className={
                  item.mono ? "font-mono text-caption" : "text-body-sm"
                }
              >
                {item.value ? (
                  item.value
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
        {children}
        {record !== undefined && (
          <details className="border-t border-border px-4 py-2">
            <summary className="min-h-8 cursor-pointer py-1.5 text-body-sm font-medium pointer-coarse:min-h-11">
              Full record
            </summary>
            <pre className="mt-3 max-h-[32rem] overflow-auto rounded-md bg-muted p-4 font-mono text-body-sm whitespace-pre-wrap break-all">
              {JSON.stringify(record, null, 2)}
            </pre>
          </details>
        )}
        {hasActions && (
          <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}

export { DetailPanel, type DetailItem, type DetailPanelProps };
