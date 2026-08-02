"use client"

import * as React from "react"
import {
  Chart as ChartJS,
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
  type ChartType,
  type Plugin,
} from "chart.js"
import { Chart } from "react-chartjs-2"
import { cn } from "@/lib/utils"
import { resolveColor } from "@/lib/tokens"

/* ═══════════════════════════════════════════════════════════════
   CANVAS CHART — Layer 2 Primitive
   
   Chart.js canvas renderer for data-heavy dashboards.
   Use this when Recharts SVG would create too many DOM nodes.
   
   ✅ TOKENS — resolves CSS vars for Canvas 2D context
   ✅ ARIA — role="img", aria-label
   ✅ LOADING — loading prop with chart-shaped skeleton
   ✅ MOBILE — reduced DPR, disabled animations on small screens
   ✅ MEMORY — destroys Chart.js instance on unmount
   ═══════════════════════════════════════════════════════════════ */

ChartJS.register(
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
)

export type CanvasChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    color?: string
    theme?: Record<"light" | "dark", string>
  }
}

interface CanvasChartProps<T extends ChartType = ChartType> {
  type: T
  data: ChartData<T>
  options?: ChartOptions<T>
  plugins?: Plugin<T>[]
  config: CanvasChartConfig
  loading?: boolean
  ariaLabel?: string
  className?: string
}

function resolveConfigColors(config: CanvasChartConfig): Record<string, string> {
  const resolved: Record<string, string> = {}
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark"
  for (const [key, cfg] of Object.entries(config)) {
    if (cfg.theme) {
      resolved[key] = resolveColor(isDark ? cfg.theme.dark : cfg.theme.light)
    } else if (cfg.color) {
      resolved[key] = resolveColor(cfg.color)
    }
  }
  return resolved
}

export function CanvasChart<T extends ChartType = ChartType>({
  type,
  data,
  options,
  plugins,
  config,
  loading = false,
  ariaLabel = "Chart",
  className,
}: CanvasChartProps<T>) {
  const chartRef = React.useRef<ChartJS<T>>(null)
  const resolvedColors = resolveConfigColors(config)
  const colorHash = Object.values(resolvedColors).join(",")
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  // Destroy Chart.js instance on unmount to prevent canvas memory leaks
  React.useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [])

  const mergedOptions: ChartOptions<T> = React.useMemo(() => {
    const base: ChartOptions<ChartType> = {
      responsive: true,
      maintainAspectRatio: true,
      animation: isMobile ? false : { duration: 300 },
      devicePixelRatio: isMobile ? 1 : undefined,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: resolveColor("var(--card)"),
          titleColor: resolveColor("var(--foreground)"),
          bodyColor: resolveColor("var(--muted-foreground)"),
          borderColor: resolveColor("var(--border)"),
          borderWidth: 1,
          padding: 8,
          cornerRadius: 8,
        },
      },
    }
    // Deep merge user options
    return { ...base, ...options } as ChartOptions<T>
  }, [options, isMobile, colorHash])

  if (loading) {
    return (
      <div
        data-slot="canvas-chart"
        data-portal="https://mzizi.dev/components/canvas-chart"
        data-loading
        role="img"
        aria-label={ariaLabel}
        className={cn(
          "flex aspect-video animate-pulse items-end justify-center gap-2 p-6",
          className
        )}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-muted"
            style={{ height: `${25 + Math.sin(i) * 30 + 20}%` }}
          />
        ))}
      </div>
    )
  }

  return (
    <div data-slot="canvas-chart" role="img" aria-label={ariaLabel} className={className}>
      <Chart ref={chartRef} type={type} data={data} options={mergedOptions} plugins={plugins} />
    </div>
  )
}

export { resolveColor, resolveConfigColors }
