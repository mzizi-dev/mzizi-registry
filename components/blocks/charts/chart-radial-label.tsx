"use client"

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"

const data = [{ value: 68, fill: "var(--color-progress)" }]

const config = {
  progress: { label: "Progress", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ChartRadialLabel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Radial Chart - Label</CardTitle>
        <CardDescription>Progress indicator with label</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <RadialBarChart
            data={data}
            startAngle={90}
            endAngle={90 + 360 * 0.68}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-3xl font-bold"
            >
              68%
            </text>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
