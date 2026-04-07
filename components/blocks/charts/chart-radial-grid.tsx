"use client"

import { RadialBar, RadialBarChart, PolarGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const data = [
  { name: "Harare", visitors: 1260, fill: "var(--color-harare)" },
  { name: "Nairobi", visitors: 970, fill: "var(--color-nairobi)" },
  { name: "Lagos", visitors: 1480, fill: "var(--color-lagos)" },
  { name: "Accra", visitors: 820, fill: "var(--color-accra)" },
]

const config = {
  visitors: { label: "Visitors" },
  harare: { label: "Harare", color: "hsl(var(--chart-1))" },
  nairobi: { label: "Nairobi", color: "hsl(var(--chart-2))" },
  lagos: { label: "Lagos", color: "hsl(var(--chart-3))" },
  accra: { label: "Accra", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

export function ChartRadialGrid() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Radial Chart - Grid</CardTitle>
        <CardDescription>With background grid</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <RadialBarChart data={data} innerRadius={30} outerRadius={100}>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <PolarGrid
              gridType="circle"
              radialLines={false}
              className="stroke-muted-foreground/20"
            />
            <RadialBar dataKey="visitors" background />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
