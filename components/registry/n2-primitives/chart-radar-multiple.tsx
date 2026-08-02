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
  { skill: "Design", harare: 186, nairobi: 140, lagos: 170 },
  { skill: "Frontend", harare: 305, nairobi: 230, lagos: 260 },
  { skill: "Backend", harare: 237, nairobi: 280, lagos: 210 },
  { skill: "DevOps", harare: 173, nairobi: 210, lagos: 190 },
  { skill: "Testing", harare: 209, nairobi: 170, lagos: 240 },
  { skill: "Security", harare: 214, nairobi: 190, lagos: 220 },
]

const config = {
  harare: { label: "Harare", color: "var(--color-cobalt, #00B0FF)" },
  nairobi: { label: "Nairobi", color: "var(--color-tanzanite, #B388FF)" },
  lagos: { label: "Lagos", color: "var(--color-malachite, #64FFDA)" },
} satisfies ChartConfig

export function ChartRadarMultiple({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Radar chart"
    >
      <CardHeader>
        <CardTitle>Radar Chart - Multiple</CardTitle>
        <CardDescription>Three-team comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          loading={loading}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={DEFAULT_DATA}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="skill" />
            <PolarGrid />
            <Radar
              dataKey="harare"
              fill="var(--color-harare)"
              fillOpacity={0.4}
              stroke="var(--color-harare)"
            />
            <Radar
              dataKey="nairobi"
              fill="var(--color-nairobi)"
              fillOpacity={0.4}
              stroke="var(--color-nairobi)"
            />
            <Radar
              dataKey="lagos"
              fill="var(--color-lagos)"
              fillOpacity={0.4}
              stroke="var(--color-lagos)"
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
