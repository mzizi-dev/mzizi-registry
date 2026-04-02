"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { date: "2024-01-01", lagos: 222, accra: 150 },
  { date: "2024-01-15", lagos: 97, accra: 180 },
  { date: "2024-02-01", lagos: 167, accra: 120 },
  { date: "2024-02-15", lagos: 242, accra: 260 },
  { date: "2024-03-01", lagos: 373, accra: 290 },
  { date: "2024-03-15", lagos: 301, accra: 340 },
  { date: "2024-04-01", lagos: 245, accra: 180 },
  { date: "2024-04-15", lagos: 409, accra: 320 },
  { date: "2024-05-01", lagos: 259, accra: 110 },
  { date: "2024-05-15", lagos: 354, accra: 190 },
]

const config = {
  lagos: { label: "Lagos", color: "hsl(var(--chart-1))" },
  accra: { label: "Accra", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const [activeCity, setActiveCity] = React.useState<"lagos" | "accra">("lagos")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Interactive</CardTitle>
        <CardDescription>
          <span className="flex gap-2">
            {(["lagos", "accra"] as const).map((city) => (
              <button key={city} onClick={() => setActiveCity(city)} className={`rounded-md px-2 py-1 text-xs ${activeCity === city ? "bg-muted font-medium" : ""}`}>
                {config[city].label}
              </button>
            ))}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="natural" dataKey={activeCity} fill={`var(--color-${activeCity})`} fillOpacity={0.4} stroke={`var(--color-${activeCity})`} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
