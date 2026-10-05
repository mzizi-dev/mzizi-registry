import { InfoTip } from "@/components/ui/app-info-tip";

/**
 * StatTile (React) — one headline figure: a label, the value, and an optional
 * trend against the previous period and a one-line note. The trend is written
 * out in words ("up 12% on the previous 30 days"), never shown by colour or an
 * arrow alone. A missing value reads "Not available", never 0. Each tile is a
 * description-list group for a StatTiles <dl>. Implements contract
 * `app/stat-tile` beside `app-stat-tile.astro`, with the same markup; composes
 * InfoTip (`app-info-tip`). A server component: no script.
 */
interface StatTileProps {
  label: string;
  value: string | number | null | undefined;
  /** Change against the previous period; percentage points if `points`. */
  trend?: number | null;
  /** The trend is in percentage points, not per cent. */
  points?: boolean;
  /** Whether a rise is good news (default true). Only affects the tone word. */
  upIsGood?: boolean;
  /** What the trend is compared with, e.g. "the previous 30 days". */
  versus?: string;
  note?: string;
  href?: string | URL;
  /** BCP 47 locale for number formatting. */
  locale?: string;
  /** What the figure counts, as an info tooltip after the label. */
  info?: string;
}

function StatTile({
  label,
  value,
  trend,
  points = false,
  upIsGood = true,
  versus,
  note,
  href,
  locale = "en-GB",
  info,
}: StatTileProps) {
  const infoId = `stat-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-info`;
  const shown =
    value === null || value === undefined || value === ""
      ? null
      : typeof value === "number"
        ? value.toLocaleString(locale)
        : value;
  const t = typeof trend === "number" && Number.isFinite(trend) ? trend : null;
  const unit = points ? " points" : "%";
  const amount =
    t === null
      ? ""
      : Math.abs(t).toLocaleString(locale, { maximumFractionDigits: 1 });
  const trendText =
    t === null
      ? null
      : t === 0
        ? `No change${versus ? ` on ${versus}` : ""}`
        : `${t > 0 ? "Up" : "Down"} ${amount}${unit}${versus ? ` on ${versus}` : ""}`;
  // The badge is short and never wraps ("+12.5%", "−3 points", "No change");
  // what it is compared with follows as quiet text that may wrap. Screen
  // readers hear the full sentence once.
  const shortTrend =
    t === null
      ? null
      : t === 0
        ? "No change"
        : `${t > 0 ? "+" : "−"}${amount}${points ? " pts" : "%"}`;
  const good = t !== null && t !== 0 ? t > 0 === upIsGood : null;
  const tone =
    good === null
      ? "text-muted-foreground"
      : good
        ? "text-malachite-on-container bg-malachite-container"
        : "text-terracotta-on-container bg-terracotta-container";

  return (
    <div
      className="flex min-w-0 flex-col gap-1 rounded-md border border-border bg-card px-4 py-3.5"
      data-slot="stat-tile"
    >
      <dt className="flex items-center gap-1 text-body-sm text-muted-foreground">
        {href ? (
          <a
            href={String(href)}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {label}
          </a>
        ) : (
          label
        )}
        {info && <InfoTip text={info} about={label} id={infoId} />}
      </dt>
      <dd className="flex flex-col gap-1.5">
        <span className="text-h4 font-semibold tracking-tight tabular-nums">
          {shown ?? (
            <span className="text-body text-muted-foreground">
              Not available
            </span>
          )}
        </span>
        {trendText && (
          <span
            className="flex flex-wrap items-baseline gap-x-1.5 text-caption"
            data-slot="stat-trend"
          >
            <span className="sr-only">{trendText}</span>
            <span
              aria-hidden="true"
              className={`w-fit shrink-0 rounded-sm px-1.5 py-px font-medium whitespace-nowrap tabular-nums ${good === null ? "bg-muted" : tone}`}
            >
              {shortTrend}
            </span>
            {versus && t !== 0 && (
              <span aria-hidden="true" className="text-muted-foreground">
                vs {versus}
              </span>
            )}
          </span>
        )}
        {note && (
          <span className="text-caption text-muted-foreground">{note}</span>
        )}
      </dd>
    </div>
  );
}

export { StatTile, type StatTileProps };
