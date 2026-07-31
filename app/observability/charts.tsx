"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"

interface DayData {
  date: string
  api_calls: number
  mcp_calls: number
  errors: number
}

interface Props {
  data: DayData[]
}

interface NodeDatum {
  node_number: number
  sub_label: string
  title: string
  /** Helix classification — a strand class, or `rung` for a cross-cutting rung. */
  helix_class: string
  component_count: number
}

// Bars are coloured by helix classification, matching
// `components/ui/node-badge.tsx` so a node reads the same colour wherever
// it appears. The retired labels this chart used to key on — horizontal /
// vertical / depth / outlier — are gone, not renamed: they described axes,
// and there are none. Colours come from the Seven African Minerals palette
// so the chart reads as part of the brand system with no Recharts theme in
// scope.
export const HELIX_CLASS_COLOR: Record<string, string> = {
  "core-guarantee": "var(--color-cobalt)",
  shipped: "var(--color-tanzanite)",
  swappable: "var(--color-malachite)",
  spine: "var(--color-copper)",
  rung: "var(--color-gold)",
}

function helixColor(helixClass: string): string {
  return HELIX_CLASS_COLOR[helixClass] ?? "var(--color-terracotta)"
}

function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z")
  return d.toLocaleDateString("en-ZW", { month: "short", day: "numeric", timeZone: "UTC" })
}

export function ObservabilityCharts({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: shortDate(d.date),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gApi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-cobalt)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-cobalt)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gMcp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-tanzanite)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-tanzanite)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gErr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#B3261E" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#B3261E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: 11,
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
          itemStyle={{ color: "var(--muted-foreground)" }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }}
        />
        <Area
          type="monotone"
          dataKey="api_calls"
          name="API calls"
          stroke="var(--color-cobalt)"
          strokeWidth={1.5}
          fill="url(#gApi)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="mcp_calls"
          name="MCP calls"
          stroke="var(--color-tanzanite)"
          strokeWidth={1.5}
          fill="url(#gMcp)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="errors"
          name="Errors"
          stroke="#B3261E"
          strokeWidth={1.5}
          fill="url(#gErr)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/**
 * Component distribution across the helix — one bar per node or rung,
 * coloured by helix classification via HELIX_CLASS_COLOR. Pure component
 * — no client state.
 */
export function NodeDistributionChart({ data }: { data: NodeDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="sub_label"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: 11,
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
          itemStyle={{ color: "var(--muted-foreground)" }}
          formatter={(value, _name, item) => {
            const payload = (item as unknown as { payload?: NodeDatum } | undefined)?.payload
            return [
              `${value} components`,
              payload ? `${payload.title} (${payload.helix_class})` : "",
            ]
          }}
        />
        <Bar dataKey="component_count" name="Components" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.node_number} fill={helixColor(d.helix_class)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
