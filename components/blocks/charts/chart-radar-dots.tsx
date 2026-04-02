"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { metric: "Speed", value: 186 },
  { metric: "Reliability", value: 305 },
  { metric: "Scalability", value: 237 },
  { metric: "Security", value: 273 },
  { metric: "Cost", value: 209 },
  { metric: "Support", value: 214 },
]

const config = {
  value: { label: "Score", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ChartRadarDots() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Radar Chart - Dots</CardTitle>
        <CardDescription>With dot markers on vertices</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <RadarChart data={data}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="metric" />
            <PolarGrid />
            <Radar dataKey="value" fill="var(--color-value)" fillOpacity={0.6} dot={{ r: 4, fillOpacity: 1 }} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
