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
  { skill: "Design", score: 186 },
  { skill: "Frontend", score: 305 },
  { skill: "Backend", score: 237 },
  { skill: "DevOps", score: 173 },
  { skill: "Testing", score: 209 },
  { skill: "Security", score: 214 },
]

const config = {
  score: { label: "Score", color: "var(--color-cobalt, #00B0FF)" },
} satisfies ChartConfig

export function ChartRadarGridFill({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Radar chart"
    >
      <CardHeader>
        <CardTitle>Radar - Filled Grid</CardTitle>
        <CardDescription>Grid background with fill</CardDescription>
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
            <PolarGrid className="fill-muted/50" />
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
