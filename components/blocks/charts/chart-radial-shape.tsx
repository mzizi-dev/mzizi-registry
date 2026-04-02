"use client"

import { RadialBar, RadialBarChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "Cobalt", value: 275, fill: "var(--color-cobalt)" },
  { name: "Tanzanite", value: 200, fill: "var(--color-tanzanite)" },
  { name: "Malachite", value: 187, fill: "var(--color-malachite)" },
  { name: "Gold", value: 173, fill: "var(--color-gold)" },
  { name: "Terracotta", value: 90, fill: "var(--color-terracotta)" },
]

const config = {
  value: { label: "Value" },
  cobalt: { label: "Cobalt", color: "hsl(var(--chart-2))" },
  tanzanite: { label: "Tanzanite", color: "hsl(var(--chart-1))" },
  malachite: { label: "Malachite", color: "hsl(var(--chart-3))" },
  gold: { label: "Gold", color: "hsl(var(--chart-4))" },
  terracotta: { label: "Terracotta", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

export function ChartRadialShape() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Radial - Custom Shape</CardTitle>
        <CardDescription>Five African Minerals radial</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <RadialBarChart data={data} innerRadius={20} outerRadius={100} barSize={12}>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <RadialBar dataKey="value" cornerRadius={5} />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
