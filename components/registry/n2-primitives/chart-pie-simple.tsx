"use client"

import * as React from "react"
import { Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const MINERAL_COLORS = [
  "var(--color-cobalt, #00B0FF)",
  "var(--color-tanzanite, #B388FF)",
  "var(--color-malachite, #64FFDA)",
  "var(--color-gold, #FFD740)",
  "var(--color-terracotta, #D4A574)",
]

const DEFAULT_DATA = [
  { name: "Harare", value: 275, fill: "var(--color-harare)" },
  { name: "Nairobi", value: 200, fill: "var(--color-nairobi)" },
  { name: "Lagos", value: 187, fill: "var(--color-lagos)" },
  { name: "Cape Town", value: 173, fill: "var(--color-cape_town)" },
  { name: "Accra", value: 90, fill: "var(--color-accra)" },
]

interface PieSlice {
  name: string
  value: number
  color?: string
}

interface ChartPieSimpleProps {
  data?: PieSlice[]
  title?: string
  description?: string
  loading?: boolean
  ariaLabel?: string
  className?: string
}

export function ChartPieSimple({
  data = DEFAULT_DATA.map((d, i) => ({ name: d.name, value: d.value, color: MINERAL_COLORS[i] })),
  title = "Pie Chart",
  description = "Distribution",
  loading = false,
  ariaLabel = "Pie chart",
  className,
}: ChartPieSimpleProps) {
  const config = React.useMemo(() => {
    const cfg: ChartConfig = {}
    data.forEach((d, i) => {
      const key = d.name.toLowerCase().replace(/\\s/g, "_")
      cfg[key] = { label: d.name, color: d.color || MINERAL_COLORS[i % MINERAL_COLORS.length] }
    })
    return cfg
  }, [data])

  const chartData = React.useMemo(
    () =>
      data.map((d) => ({
        name: d.name,
        value: d.value,
        fill: `var(--color-${d.name.toLowerCase().replace(/\\s/g, "_")})`,
      })),
    [data]
  )

  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label={ariaLabel}
      className={className}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie data={chartData} dataKey="value" nameKey="name" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
