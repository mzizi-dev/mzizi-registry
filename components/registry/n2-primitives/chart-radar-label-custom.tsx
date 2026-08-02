"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { metric: "Speed", value: 86 },
  { metric: "Reliability", value: 95 },
  { metric: "Scalability", value: 72 },
  { metric: "Security", value: 88 },
  { metric: "Cost", value: 65 },
  { metric: "Support", value: 78 },
]

const config = {
  value: { label: "Score (%)", color: "var(--color-tanzanite, #B388FF)" },
} satisfies ChartConfig

export function ChartRadarLabelCustom({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Radar chart"
    >
      <CardHeader>
        <CardTitle>Radar - Custom Labels</CardTitle>
        <CardDescription>Custom angle axis tick rendering</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          loading={loading}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={DEFAULT_DATA}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <PolarAngleAxis
              dataKey="metric"
              tick={({ x, y, payload, textAnchor }) => (
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  className="fill-foreground text-[10px] font-medium"
                >
                  {payload.value}
                </text>
              )}
            />
            <PolarGrid />
            <Radar
              dataKey="value"
              fill="var(--color-value)"
              fillOpacity={0.6}
              stroke="var(--color-value)"
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
