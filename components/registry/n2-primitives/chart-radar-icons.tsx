"use client"

import { Sprout } from "@/lib/icons"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { sector: "Farming", output: 275 },
  { sector: "Mining", output: 200 },
  { sector: "Tourism", output: 187 },
  { sector: "Tech", output: 273 },
  { sector: "Trade", output: 190 },
]

const config = {
  output: { label: "Output", color: "var(--color-cobalt, #00B0FF)", icon: Sprout },
} satisfies ChartConfig

export function ChartRadarIcons({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Radar chart"
    >
      <CardHeader>
        <CardTitle>Radar Chart - Icons</CardTitle>
        <CardDescription>Legend with icons</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          loading={loading}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={DEFAULT_DATA}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <PolarAngleAxis dataKey="sector" />
            <PolarGrid />
            <Radar
              dataKey="output"
              fill="var(--color-output)"
              fillOpacity={0.6}
              dot={{ r: 4, fillOpacity: 1 }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
