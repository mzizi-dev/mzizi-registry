"use client"

import { Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { sector: "farming", value: 275, fill: "var(--color-farming)" },
  { sector: "mining", value: 200, fill: "var(--color-mining)" },
  { sector: "tourism", value: 187, fill: "var(--color-tourism)" },
  { sector: "tech", value: 173, fill: "var(--color-tech)" },
  { sector: "trade", value: 90, fill: "var(--color-trade)" },
]

const config = {
  value: { label: "Output" },
  farming: { label: "Farming", color: "var(--color-cobalt, #00B0FF)" },
  mining: { label: "Mining", color: "var(--color-tanzanite, #B388FF)" },
  tourism: { label: "Tourism", color: "var(--color-malachite, #64FFDA)" },
  tech: { label: "Tech", color: "var(--color-gold, #FFD740)" },
  trade: { label: "Trade", color: "var(--color-terracotta, #D4A574)" },
} satisfies ChartConfig

export function ChartPieLegend({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Pie chart"
    >
      <CardHeader>
        <CardTitle>Pie Chart - Legend</CardTitle>
        <CardDescription>With chart legend</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          loading={loading}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="sector" hideLabel />} />
            <Pie data={DEFAULT_DATA} dataKey="value" nameKey="sector" />
            <ChartLegend
              content={
                <ChartLegendContent
                  nameKey="sector"
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center"
                />
              }
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
