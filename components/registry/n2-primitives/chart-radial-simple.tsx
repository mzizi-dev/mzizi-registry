"use client"

import { RadialBar, RadialBarChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { name: "Harare", visitors: 1260, fill: "var(--color-harare)" },
  { name: "Nairobi", visitors: 970, fill: "var(--color-nairobi)" },
  { name: "Lagos", visitors: 1480, fill: "var(--color-lagos)" },
]

const config = {
  visitors: { label: "Visitors" },
  harare: { label: "Harare", color: "var(--color-cobalt, #00B0FF)" },
  nairobi: { label: "Nairobi", color: "var(--color-tanzanite, #B388FF)" },
  lagos: { label: "Lagos", color: "var(--color-malachite, #64FFDA)" },
} satisfies ChartConfig

export function ChartRadialSimple({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Radial chart"
    >
      <CardHeader>
        <CardTitle>Radial Chart</CardTitle>
        <CardDescription>City visitor comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          loading={loading}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart data={DEFAULT_DATA} innerRadius={30} outerRadius={100}>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <RadialBar dataKey="visitors" background />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
