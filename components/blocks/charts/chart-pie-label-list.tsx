"use client"

import { Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { city: "harare", visitors: 275, fill: "var(--color-harare)" },
  { city: "nairobi", visitors: 200, fill: "var(--color-nairobi)" },
  { city: "lagos", visitors: 287, fill: "var(--color-lagos)" },
  { city: "accra", visitors: 173, fill: "var(--color-accra)" },
  { city: "kigali", visitors: 190, fill: "var(--color-kigali)" },
]

const config = {
  visitors: { label: "Visitors" },
  harare: { label: "Harare", color: "hsl(var(--chart-1))" },
  nairobi: { label: "Nairobi", color: "hsl(var(--chart-2))" },
  lagos: { label: "Lagos", color: "hsl(var(--chart-3))" },
  accra: { label: "Accra", color: "hsl(var(--chart-4))" },
  kigali: { label: "Kigali", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

export function ChartPieLabelList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pie Chart - Label List</CardTitle>
        <CardDescription>Labels with connector lines</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="city" hideLabel />} />
            <Pie data={data} dataKey="visitors" nameKey="city" label={({ payload, ...props }) => (
              <text x={props.x} y={props.y} textAnchor={props.textAnchor} dominantBaseline={props.dominantBaseline} fill="hsla(var(--foreground))" className="text-xs">
                {config[payload.city as keyof typeof config]?.label}
              </text>
            )} labelLine />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
