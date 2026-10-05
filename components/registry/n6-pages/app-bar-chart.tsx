/**
 * BarChart (React) — a bar chart rendered on the server as plain HTML, so it
 * needs no client JavaScript, scales from 320 px to 1920 px without distorting
 * text, and follows the theme through tokens.
 *
 * - `columns`: one bar per point along the bottom (a series over time). Axis
 *   labels are thinned to fit; every value is in the figures table.
 * - `rows`: one labelled bar per category, the value written beside it.
 *
 * The bars are hidden from screen readers; the exact figures are in a real
 * table under "Show the figures" (WCAG 1.1.1, 1.4.1). Bar sizes are SVG
 * geometry attributes, never inline `style`, so a page's CSP needs no
 * `style-src-attr 'unsafe-inline'`. Implements contract `app/bar-chart` beside
 * `app-bar-chart.astro`, with the same markup. A server component.
 */
interface BarChartPoint {
  label: string;
  value: number;
  /** Optional longer label for the figures table, e.g. a full date. */
  long?: string;
}

interface BarChartProps {
  title: string;
  /** One sentence: what is counted, over what range. */
  caption: string;
  data: BarChartPoint[];
  layout?: "columns" | "rows";
  /** Noun for values in the table header, e.g. "Submissions". */
  valueLabel?: string;
  /** Header for the label column, e.g. "Day". */
  labelHeading?: string;
  id?: string;
  /** BCP 47 locale for number formatting. */
  locale?: string;
}

function BarChart({
  title,
  caption,
  data,
  layout = "columns",
  valueLabel = "Count",
  labelHeading = "Label",
  id = "chart",
  locale = "en-GB",
}: BarChartProps) {
  const max = Math.max(0, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const pct = (v: number) =>
    max > 0 ? Math.max(v > 0 ? 2 : 0, (v / max) * 100) : 0;
  // Two decimals is finer than a pixel at any chart size.
  const geo = (v: number) => String(Math.round(pct(v) * 100) / 100);
  const fmt = (v: number) => v.toLocaleString(locale);
  // At most ~8 axis labels, always the first and the last.
  const step = Math.max(1, Math.ceil(data.length / 8));
  const showLabel = (i: number) =>
    i === 0 ||
    i === data.length - 1 ||
    (i % step === 0 && data.length - 1 - i >= step / 2);

  return (
    <figure
      className="grid min-w-0 gap-4 rounded-lg border border-border bg-card p-5"
      aria-labelledby={`${id}-title`}
      data-slot="bar-chart"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`${id}-title`} className="text-h4 font-semibold">
          {title}
        </h3>
        <p className="text-body-sm text-muted-foreground">{caption}</p>
      </div>

      {data.length === 0 || max === 0 ? (
        <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-body-sm text-muted-foreground">
          Nothing to chart in this range.
        </p>
      ) : layout === "columns" ? (
        <div aria-hidden="true">
          <div className="flex h-48 items-end gap-px border-b border-border sm:h-56">
            {data.map((d, i) => (
              <div
                key={`${i}-${d.label}`}
                className="flex h-full min-w-0 flex-1 items-end"
                title={`${d.long ?? d.label}: ${fmt(d.value)}`}
              >
                <svg
                  className="h-full w-full"
                  viewBox="0 0 10 100"
                  preserveAspectRatio="none"
                  focusable="false"
                  data-bar=""
                >
                  <rect
                    x="0"
                    y={String(100 - Number(geo(d.value)))}
                    width="10"
                    height={geo(d.value)}
                    className="fill-primary"
                  />
                </svg>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-px text-body-sm text-muted-foreground">
            {data.map((d, i) => (
              <div key={`${i}-${d.label}`} className="relative min-w-0 flex-1">
                {showLabel(i) && (
                  <span
                    className={`absolute top-0 whitespace-nowrap ${i === 0 ? "left-0" : i === data.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                  >
                    {d.label}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="h-6" />
        </div>
      ) : (
        <ul className="grid gap-3" aria-hidden="true">
          {data.map((d, i) => (
            <li
              key={`${i}-${d.label}`}
              className="grid gap-1 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-center sm:gap-4"
            >
              <span className="truncate text-body-sm">{d.label}</span>
              <span className="flex items-center gap-3">
                <span className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <svg
                    className="block h-3 w-full"
                    viewBox="0 0 100 3"
                    preserveAspectRatio="none"
                    focusable="false"
                    data-bar=""
                  >
                    <rect
                      x="0"
                      y="0"
                      width={geo(d.value)}
                      height="3"
                      className="fill-primary"
                    />
                  </svg>
                </span>
                <span className="w-12 text-end text-body-sm font-medium tabular-nums">
                  {fmt(d.value)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <details className="border-t border-border pt-2">
        <summary className="min-h-11 cursor-pointer py-2 text-body-sm font-medium">
          Show the figures
        </summary>
        <table className="mt-2 w-full text-body-sm">
          <caption className="sr-only">
            {title}: {caption}
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-2 text-start font-semibold">
                {labelHeading}
              </th>
              <th scope="col" className="py-2 text-end font-semibold">
                {valueLabel}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((d, i) => (
              <tr key={`${i}-${d.label}`}>
                <th scope="row" className="py-2 text-start font-normal">
                  {d.long ?? d.label}
                </th>
                <td className="py-2 text-end tabular-nums">{fmt(d.value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <th scope="row" className="py-2 text-start font-semibold">
                Total
              </th>
              <td className="py-2 text-end font-semibold tabular-nums">
                {fmt(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </details>
    </figure>
  );
}

export { BarChart, type BarChartPoint, type BarChartProps };
