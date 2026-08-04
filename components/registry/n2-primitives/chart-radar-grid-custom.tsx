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
]

const config = {
  value: { label: "Score", color: "var(--color-terracotta, #D4A574)" },
} satisfies ChartConfig

export function ChartRadarGridCustom({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Radar chart"
    >
      <CardHeader>
        <CardTitle>Radar - Custom Grid</CardTitle>
        <CardDescription>Polygon grid with custom styling</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          loading={loading}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={DEFAULT_DATA}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="metric" />
            <PolarGrid
              gridType="polygon"
              className="stroke-muted-foreground/30"
              strokeDasharray="4 4"
            />
            <Radar
              dataKey="value"
              fill="var(--color-value)"
              fillOpacity={0.5}
              stroke="var(--color-value)"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
