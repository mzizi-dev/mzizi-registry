"use client"

import { Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { city: "harare", visitors: 275, fill: "var(--color-harare)" },
  { city: "nairobi", visitors: 200, fill: "var(--color-nairobi)" },
  { city: "lagos", visitors: 287, fill: "var(--color-lagos)" },
  { city: "accra", visitors: 173, fill: "var(--color-accra)" },
  { city: "kigali", visitors: 190, fill: "var(--color-kigali)" },
]

const config = {
  visitors: { label: "Visitors" },
  harare: { label: "Harare", color: "var(--color-cobalt, #00B0FF)" },
  nairobi: { label: "Nairobi", color: "var(--color-tanzanite, #B388FF)" },
  lagos: { label: "Lagos", color: "var(--color-malachite, #64FFDA)" },
  accra: { label: "Accra", color: "var(--color-gold, #FFD740)" },
  kigali: { label: "Kigali", color: "var(--color-terracotta, #D4A574)" },
} satisfies ChartConfig

export function ChartPieLabelList({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Pie chart"
    >
      <CardHeader>
        <CardTitle>Pie Chart - Label List</CardTitle>
        <CardDescription>Labels with connector lines</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          loading={loading}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="city" hideLabel />} />
            <Pie
              data={DEFAULT_DATA}
              dataKey="visitors"
              nameKey="city"
              label={({ payload, ...props }) => (
                <text
                  x={props.x}
                  y={props.y}
                  textAnchor={props.textAnchor}
                  dominantBaseline={props.dominantBaseline}
                  fill="hsla(var(--foreground))"
                  className="text-xs"
                >
                  {config[payload.city as keyof typeof config]?.label}
                </text>
              )}
              labelLine
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
