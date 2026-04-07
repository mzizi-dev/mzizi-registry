"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from "recharts"

interface DayData {
  date: string
  api_calls: number
  mcp_calls: number
  errors: number
}

interface Props {
  data: DayData[]
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
