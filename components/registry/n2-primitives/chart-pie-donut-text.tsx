"use client"

import * as React from "react"
import { Pie, PieChart, Label } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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

export function ChartPieDonutText({ loading = false }: { loading?: boolean } = {}) {
  const total = React.useMemo(() => DEFAULT_DATA.reduce((acc, curr) => acc + curr.value, 0), [])

  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Pie chart"
    >
      <CardHeader>
        <CardTitle>Donut - Center Text</CardTitle>
        <CardDescription>Total value in center</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          loading={loading}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="sector" hideLabel />} />
            <Pie
              data={DEFAULT_DATA}
              dataKey="value"
              nameKey="sector"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total Output
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
