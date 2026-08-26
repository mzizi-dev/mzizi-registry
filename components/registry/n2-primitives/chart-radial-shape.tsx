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
  { name: "Cobalt", value: 275, fill: "var(--color-primary, var(--color-cobalt, #00B0FF))" },
  { name: "Tanzanite", value: 200, fill: "var(--color-accent, var(--color-tanzanite, #B388FF))" },
  { name: "Malachite", value: 187, fill: "var(--status-success, var(--color-malachite, #64FFDA))" },
  { name: "Gold", value: 173, fill: "var(--status-warning, var(--color-gold, #FFD740))" },
  { name: "Terracotta", value: 90, fill: "var(--status-error, var(--color-terracotta, #D4A574))" },
]

const config = {
  value: { label: "Value" },
  cobalt: { label: "Cobalt", color: "var(--color-tanzanite, #B388FF)" },
  tanzanite: { label: "Tanzanite", color: "var(--color-cobalt, #00B0FF)" },
  malachite: { label: "Malachite", color: "var(--color-malachite, #64FFDA)" },
  gold: { label: "Gold", color: "var(--color-gold, #FFD740)" },
  terracotta: { label: "Terracotta", color: "var(--color-terracotta, #D4A574)" },
} satisfies ChartConfig

export function ChartRadialShape({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Radial chart"
    >
      <CardHeader>
        <CardTitle>Radial - Custom Shape</CardTitle>
        <CardDescription>Seven African Minerals radial</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          loading={loading}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart data={DEFAULT_DATA} innerRadius={20} outerRadius={100} barSize={12}>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <RadialBar dataKey="value" cornerRadius={5} />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
