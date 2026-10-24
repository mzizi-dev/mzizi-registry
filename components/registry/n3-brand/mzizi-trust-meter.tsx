/**
 * MziziTrustMeter — the expanded view of trust: the composite score as a meter, then either
 * the three-signal breakdown (Verification, Status, Ubuntu) or, with `signals`, one row per
 * counted signal for an address, a place or a venue.
 *
 * The React build of contract `ui/mzizi-trust-meter`, beside `mzizi-trust-meter.astro`: the
 * same markup, held to the same contract. A server component (no "use client", no hooks): the
 * bars are SVG geometry, never inline `style`, and colour is semantic (`--status-*`; the Ubuntu
 * signal is tanzanite in every brand).
 *
 * MUKOKO TRUST MODEL — three signals:
 *   Verification Tier (how real are you? identity ladder 0–4),
 *   Platform Status (are you active? a lifecycle modifier),
 *   Ubuntu Contribution (are you helpful? "I am because we are").
 *
 * SIGNAL COUNTS (#543). An address, a place or a venue earns trust from things that happened:
 * check-ins at the entrance, deliveries completed, neighbours who vouched. Pass `signals`
 * ({ label, count, detail? }) and the meter lists them under the bar, one 44px row each, in a
 * <ul>, instead of the breakdown — Kweli's "Address trust" panel is
 * <MziziTrustMeter title="Address trust" trustScore={…} signals={[…]} />.
 */
import { Icon } from "@/components/ui/site-icon"
import { cn } from "@/lib/utils"

/**
 * @deprecated Not used by the meter since it became a server component (#543); kept so
 * existing type imports compile.
 */
interface TrustSignal {
  label: string
  icon: unknown
  value: number /* 0.0 – 1.0 normalized */
  color: string
  detail?: string
}

/** One counted trust signal: "Check-ins at the entrance", 12. */
interface TrustSignalCount {
  label: string
  /** How many times it happened. Never a percentage. */
  count: number
  /** A short qualifier: "last 90 days". */
  detail?: string
}

interface MziziTrustMeterProps {
  loading?: boolean
  /** Composite trust score (0.000 – 1.000) */
  trustScore: number
  /** Individual signal values */
  verificationScore?: number
  statusScore?: number
  ubuntuScore?: number
  /** Ubuntu points (raw count) */
  ubuntuPoints?: number
  /** Verification tier label */
  tierLabel?: string
  /** Platform status label */
  statusLabel?: string
  /** Compact mode — just the meter bar, no signal breakdown */
  compact?: boolean
  /** The meter's name, shown and used as its accessible name. */
  title?: string
  /** Counted signals (address, place or venue trust). Replaces the three-signal breakdown. */
  signals?: TrustSignalCount[]
  className?: string
}

const PORTAL = "https://mzizi.dev/components/mzizi-trust-meter"

/** A 0–1 value as a bar width in a 0–100 viewBox, two decimals. */
const width = (v: number) => String(Math.round(Math.min(Math.max(v, 0), 1) * 10000) / 100)

type Level = "strong" | "growing" | "low" | "none"
const SCORE_TEXT: Record<Level, string> = {
  strong: "text-status-success",
  growing: "text-status-warning",
  low: "text-status-warning",
  none: "text-status-neutral",
}
const SCORE_FILL: Record<Level, string> = {
  strong: "fill-status-success",
  growing: "fill-status-warning",
  low: "fill-status-warning",
  none: "fill-status-neutral",
}

function MziziTrustMeter({
  loading = false,
  trustScore,
  verificationScore = 0,
  statusScore = 0,
  ubuntuScore = 0,
  ubuntuPoints,
  tierLabel,
  statusLabel,
  compact = false,
  title = "Trust Score",
  signals,
  className,
}: MziziTrustMeterProps) {
  if (loading)
    return (
      <div
        data-slot="mzizi-trust-meter"
        data-portal={PORTAL}
        data-loading
        role="meter"
        aria-label="Trust score"
        className="animate-pulse space-y-3 rounded-lg bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-2 rounded-full bg-muted" />
        <div className="flex justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-2 w-8 rounded bg-muted" />
              <div className="h-1.5 w-6 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )

  /* Score level: strong, growing, low, none. */
  const level: Level =
    trustScore >= 0.4 ? "strong" : trustScore >= 0.2 ? "growing" : trustScore >= 0.05 ? "low" : "none"

  const breakdown = [
    {
      key: "verification",
      label: "Verification",
      icon: "shield",
      value: verificationScore,
      text: "text-status-warning",
      fill: "fill-status-warning",
      detail: tierLabel,
    },
    {
      key: "status",
      label: "Status",
      icon: "activity",
      /* Normalise the -0.05 – 0.05 modifier to 0.45 – 0.55 for display. */
      value: Math.max(statusScore + 0.5, 0),
      text: statusScore >= 0 ? "text-status-success" : "text-status-error",
      fill: statusScore >= 0 ? "fill-status-success" : "fill-status-error",
      detail: statusLabel,
    },
    {
      key: "ubuntu",
      label: "Ubuntu",
      icon: "heart",
      value: ubuntuScore,
      text: "text-tanzanite",
      fill: "fill-tanzanite",
      detail: ubuntuPoints != null ? `${ubuntuPoints.toLocaleString()} points` : undefined,
    },
  ] as const

  return (
    <div
      data-slot="mzizi-trust-meter"
      data-portal={PORTAL}
      data-level={level}
      role="meter"
      aria-label={title === "Trust Score" ? "Trust score" : title}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={trustScore}
      className={cn("rounded-lg bg-card p-4 text-card-foreground ring-1 ring-foreground/10", className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="trending-up" className="size-4 text-muted-foreground" />
          <span data-slot="trust-meter-title" className="text-sm font-medium text-foreground">
            {title}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span data-slot="trust-meter-score" className={cn("text-2xl font-bold", SCORE_TEXT[level])}>
            {trustScore.toFixed(3)}
          </span>
          <span className="text-xs text-muted-foreground">/ 1.000</span>
        </div>
      </div>

      <span className="mt-3 block h-2 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
        <svg
          data-slot="trust-meter-bar"
          className="block h-2 w-full"
          viewBox="0 0 100 2"
          preserveAspectRatio="none"
          focusable="false"
          aria-hidden="true"
        >
          <rect x="0" y="0" width={width(trustScore)} height="2" className={SCORE_FILL[level]} />
        </svg>
      </span>

      {!compact && signals && (
        <ul data-slot="trust-signal-list" className="mt-4 flex flex-col divide-y divide-border">
          {signals.map((s) => (
            <li
              key={s.label}
              data-slot="trust-signal"
              className="flex min-h-11 items-center justify-between gap-3 py-2"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm text-foreground">{s.label}</span>
                {s.detail && <span className="text-xs text-muted-foreground">{s.detail}</span>}
              </span>
              <span
                data-slot="trust-signal-count"
                className="shrink-0 font-mono text-sm font-semibold text-foreground tabular-nums"
              >
                {s.count.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!compact && !signals && (
        <div data-slot="trust-breakdown" className="mt-4 flex flex-col gap-3">
          {breakdown.map((signal) => (
            <div key={signal.key} data-slot="trust-breakdown-signal" data-signal={signal.key}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon name={signal.icon} className={cn("size-3.5", signal.text)} />
                  <span className="text-xs font-medium text-muted-foreground">{signal.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {signal.detail && <span className="text-[10px] text-muted-foreground">{signal.detail}</span>}
                  <span className={cn("text-xs font-semibold", signal.text)}>{signal.value.toFixed(3)}</span>
                </div>
              </div>
              <span className="block h-1 w-full overflow-hidden rounded-full bg-foreground/[0.04]">
                <svg
                  className="block h-1 w-full"
                  viewBox="0 0 100 1"
                  preserveAspectRatio="none"
                  focusable="false"
                  aria-hidden="true"
                >
                  <rect x="0" y="0" width={width(signal.value)} height="1" className={signal.fill} />
                </svg>
              </span>
            </div>
          ))}

          {ubuntuPoints != null && (
            <div
              data-slot="trust-ubuntu-points"
              className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <Icon name="star" className="size-3 text-status-warning" />
              <span>{ubuntuPoints.toLocaleString()} Ubuntu Points earned through community contribution</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { MziziTrustMeter }
export type { MziziTrustMeterProps, TrustSignal, TrustSignalCount }
