"use client"

import { Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const outerData = [
  { sector: "farming", value: 275, fill: "var(--color-farming)" },
  { sector: "mining", value: 200, fill: "var(--color-mining)" },
  { sector: "tourism", value: 187, fill: "var(--color-tourism)" },
]

const innerData = [
  { region: "east", value: 340, fill: "var(--color-east)" },
  { region: "west", value: 200, fill: "var(--color-west)" },
  { region: "south", value: 122, fill: "var(--color-south)" },
]

const config = {
  value: { label: "Output" },
  farming: { label: "Farming", color: "var(--color-cobalt, #00B0FF)" },
  mining: { label: "Mining", color: "var(--color-tanzanite, #B388FF)" },
  tourism: { label: "Tourism", color: "var(--color-malachite, #64FFDA)" },
  east: { label: "East Africa", color: "var(--color-gold, #FFD740)" },
  west: { label: "West Africa", color: "var(--color-terracotta, #D4A574)" },
  south: { label: "Southern Africa", color: "var(--color-cobalt, #00B0FF)" },
} satisfies ChartConfig

export function ChartPieStacked({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Pie chart"
    >
      <CardHeader>
        <CardTitle>Pie Chart - Stacked</CardTitle>
        <CardDescription>Nested pie with inner/outer rings</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          loading={loading}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={innerData}
              dataKey="value"
              nameKey="region"
              innerRadius={0}
              outerRadius={60}
            />
            <Pie
              data={outerData}
              dataKey="value"
              nameKey="sector"
              innerRadius={70}
              outerRadius={90}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
