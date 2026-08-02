"use client"

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { skill: "Design", score: 86 },
  { skill: "Frontend", score: 95 },
  { skill: "Backend", score: 72 },
  { skill: "DevOps", score: 88 },
  { skill: "Testing", score: 65 },
  { skill: "Security", score: 78 },
]

const config = {
  score: { label: "Score", color: "var(--color-malachite, #64FFDA)" },
} satisfies ChartConfig

export function ChartRadarRadius({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Radar chart"
    >
      <CardHeader>
        <CardTitle>Radar - Custom Radius</CardTitle>
        <CardDescription>Showing radius axis labels</CardDescription>
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
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar
              dataKey="score"
              fill="var(--color-score)"
              fillOpacity={0.6}
              stroke="var(--color-score)"
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
