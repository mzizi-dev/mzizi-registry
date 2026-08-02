"use client"

import * as React from "react"
import { CanvasChart, resolveColor, type CanvasChartConfig } from "@/components/ui/canvas-chart"
import { hexWithAlpha } from "@/lib/tokens"
import type { ChartData, ChartOptions } from "chart.js"

/* ═══════════════════════════════════════════════════════════════
   TIME SERIES CHART — Layer 2 Primitive
   
   Multi-series line/bar/area on a single canvas.
   Mineral colors auto-assigned by index.
   ✅ TOKENS  ✅ ARIA  ✅ LOADING  ✅ MOBILE  ✅ MEMORY
   ═══════════════════════════════════════════════════════════════ */

export interface SeriesConfig {
  key: string
  label: string
  color: string
  type?: "line" | "bar"
  fill?: boolean
  dashed?: boolean
  yAxisID?: string
  order?: number
  opacity?: number
}

export interface TimeSeriesChartProps {
  /**
   * One row per point. `labelKey` selects the x-axis label; every other key a
   * `SeriesConfig` names selects that series' value — so a row genuinely holds
   * both, and `string | number` is the honest type. It was `Record<string, any>`,
   * which switched off checking for every read of the row.
   */
  data: Record<string, string | number>[]
  labelKey: string
  series: SeriesConfig[]
  yAxes?: Record<
    string,
    {
      min?: number
      max?: number
      position?: "left" | "right"
      display?: boolean
      format?: (v: number) => string
    }
  >
  tooltipLabel?: (label: string, value: number) => string
  tooltipTitle?: (label: string) => string
  xTickFormat?: (label: string, index: number) => string
  maxTicksLimit?: number
  aspect?: string
  loading?: boolean
  ariaLabel?: string
  className?: string
}

export function TimeSeriesChart({
  data,
  labelKey,
  series,
  yAxes,
  tooltipLabel,
  tooltipTitle,
  xTickFormat,
  maxTicksLimit = 8,
  aspect = "aspect-[2/1] sm:aspect-[16/5]",
  loading = false,
  ariaLabel = "Time series chart",
  className,
}: TimeSeriesChartProps) {
  const gridColor = resolveColor("var(--muted-foreground)")

  const resolvedColors = React.useMemo(
    () => series.map((s) => resolveColor(s.color)),
    [series, gridColor]
  )

  const config = React.useMemo(() => {
    const cfg: CanvasChartConfig = {}
    for (const s of series) cfg[s.key] = { label: s.label, color: s.color }
    return cfg
  }, [series])

  // The chart mixes line and bar series on one canvas, so the chart.js generic
  // is that union rather than `any`.
  const chartData: ChartData<"bar" | "line"> = React.useMemo(() => {
    const labels = data.map((d) => String(d[labelKey] ?? ""))
    // chart.js plots numbers; a row's series value arrives as `string | number`
    // because the same row also carries the x-axis label. Coerce at this one
    // boundary rather than loosening the row type back to `any`.
    const valuesFor = (key: string) => data.map((d) => Number(d[key]))
    const datasets = series.map((s, idx) => {
      const color = resolvedColors[idx]
      if (s.type === "bar") {
        return {
          type: "bar" as const,
          label: s.label,
          data: valuesFor(s.key),
          backgroundColor: hexWithAlpha(color, s.opacity ?? 0.6),
          borderRadius: 2,
          yAxisID: s.yAxisID ?? "y",
          order: s.order ?? 2,
        }
      }
      return {
        type: "line" as const,
        label: s.label,
        data: valuesFor(s.key),
        borderColor: color,
        backgroundColor: s.fill ? hexWithAlpha(color, s.opacity ?? 0.12) : undefined,
        borderWidth: s.dashed ? 1.5 : 2,
        borderDash: s.dashed ? [4, 3] : undefined,
        fill: s.fill ?? false,
        tension: 0.4,
        pointRadius: s.dashed ? 0 : 0,
        pointHitRadius: 8,
        yAxisID: s.yAxisID ?? "y",
        order: s.order ?? 1,
      }
    })
    return { labels, datasets }
  }, [data, labelKey, series, resolvedColors])

  const chartOptions: ChartOptions<"bar" | "line"> = React.useMemo(() => {
    // Typed from the options themselves rather than `Record<string, unknown>`,
    // so a malformed scale is caught here instead of being silently ignored at
    // runtime by chart.js.
    const scales: NonNullable<ChartOptions<"bar" | "line">["scales"]> = {
      x: {
        grid: { display: false },
        ticks: {
          color: gridColor,
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit,
          // The tick value is deliberately unused — the label comes from the row,
          // not from chart.js's own formatting of it.
          ...(xTickFormat
            ? {
                callback: (_v: unknown, i: number) =>
                  xTickFormat(String(data[i]?.[labelKey] ?? ""), i),
              }
            : {}),
        },
        border: { display: false },
      },
    }
    if (yAxes) {
      for (const [id, cfg] of Object.entries(yAxes)) {
        scales[id] = {
          position: cfg.position ?? "left",
          display: cfg.display ?? true,
          min: cfg.min,
          max: cfg.max,
          grid:
            cfg.position === "right"
              ? { display: false }
              : { color: hexWithAlpha(gridColor, 0.15), drawTicks: false },
          // chart.js hands the tick callback `string | number`; the consumer's
          // `format` takes a number, so coerce rather than mistyping the callback.
          ticks: {
            color: gridColor,
            font: { size: 11 },
            ...(cfg.format ? { callback: (v: string | number) => cfg.format!(Number(v)) } : {}),
          },
          border: { display: false },
        }
      }
    } else {
      scales.y = {
        grid: { color: hexWithAlpha(gridColor, 0.15), drawTicks: false },
        ticks: { color: gridColor, font: { size: 11 } },
        border: { display: false },
      }
    }
    return {
      scales,
      plugins: {
        tooltip: {
          callbacks: {
            // Structurally typed to exactly the members these callbacks read.
            // chart.js's own `TooltipItem<TType>` would drag the chart-type
            // generic through both signatures for no gain here.
            title: tooltipTitle
              ? (items: { dataIndex: number }[]) =>
                  tooltipTitle(String(data[items[0]?.dataIndex ?? 0]?.[labelKey] ?? ""))
              : undefined,
            // `parsed.y` is nullable in chart.js — a gap in a series is null, not
            // 0. The `any` hid that; conflating the two would draw a missing
            // reading as a real zero.
            label: tooltipLabel
              ? (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
                  ctx.parsed.y === null ? "" : tooltipLabel(ctx.dataset.label ?? "", ctx.parsed.y)
              : undefined,
          },
        },
      },
    }
  }, [data, labelKey, gridColor, yAxes, tooltipLabel, tooltipTitle, xTickFormat, maxTicksLimit])

  const chartType =
    series.some((s) => s.type === "bar") && series.some((s) => !s.type || s.type === "line")
      ? "bar"
      : (series[0]?.type ?? "line")

  return (
    <CanvasChart
      type={chartType}
      data={chartData}
      options={chartOptions}
      config={config}
      loading={loading}
      ariaLabel={ariaLabel}
      className={`${aspect} w-full ${className || ""}`}
    />
  )
}
