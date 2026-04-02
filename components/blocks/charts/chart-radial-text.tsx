"use client"

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"

const data = [{ value: 75, fill: "var(--color-score)" }]

const config = {
  score: { label: "Score", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export function ChartRadialText() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Radial - Center Text</CardTitle>
        <CardDescription>Score display with center text</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <RadialBarChart data={data} startAngle={90} endAngle={90 + 360 * 0.75} innerRadius={80} outerRadius={110}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-4xl font-bold">75</text>
            <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm">out of 100</text>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
