"use client"

import { RadialBar, RadialBarChart, PolarRadiusAxis, Label } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const data = [{ harare: 1260, nairobi: 970 }]

const config = {
  harare: { label: "Harare", color: "hsl(var(--chart-1))" },
  nairobi: { label: "Nairobi", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export function ChartRadialStacked() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Radial Chart - Stacked</CardTitle>
        <CardDescription>Stacked radial bars</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <RadialBarChart data={data} endAngle={180} innerRadius={80} outerRadius={130}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold"
                        >
                          2,230
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground"
                        >
                          Visitors
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="harare"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-harare)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="nairobi"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-nairobi)"
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
