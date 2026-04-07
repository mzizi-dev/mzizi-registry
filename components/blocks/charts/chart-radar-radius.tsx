"use client"

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const data = [
  { skill: "Design", score: 86 },
  { skill: "Frontend", score: 95 },
  { skill: "Backend", score: 72 },
  { skill: "DevOps", score: 88 },
  { skill: "Testing", score: 65 },
  { skill: "Security", score: 78 },
]

const config = {
  score: { label: "Score", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

export function ChartRadarRadius() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Radar - Custom Radius</CardTitle>
        <CardDescription>Showing radius axis labels</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <RadarChart data={data}>
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
