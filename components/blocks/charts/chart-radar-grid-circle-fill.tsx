"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { skill: "Design", harare: 186, nairobi: 140 },
  { skill: "Frontend", harare: 305, nairobi: 230 },
  { skill: "Backend", harare: 237, nairobi: 280 },
  { skill: "DevOps", harare: 173, nairobi: 210 },
  { skill: "Testing", harare: 209, nairobi: 170 },
  { skill: "Security", harare: 214, nairobi: 190 },
]

const config = {
  harare: { label: "Harare", color: "hsl(var(--chart-1))" },
  nairobi: { label: "Nairobi", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export function ChartRadarGridCircleFill() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Radar - Circle Grid Fill</CardTitle>
        <CardDescription>Filled circular grid background</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <RadarChart data={data}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="skill" />
            <PolarGrid gridType="circle" className="fill-muted opacity-20" />
            <Radar dataKey="harare" fill="var(--color-harare)" fillOpacity={0.6} stroke="var(--color-harare)" />
            <Radar dataKey="nairobi" fill="var(--color-nairobi)" fillOpacity={0.6} stroke="var(--color-nairobi)" />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
