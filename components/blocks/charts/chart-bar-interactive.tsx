"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { date: "2024-01-01", downloads: 222, installs: 150 },
  { date: "2024-01-15", downloads: 97, installs: 80 },
  { date: "2024-02-01", downloads: 167, installs: 120 },
  { date: "2024-02-15", downloads: 242, installs: 200 },
  { date: "2024-03-01", downloads: 373, installs: 290 },
  { date: "2024-03-15", downloads: 301, installs: 250 },
  { date: "2024-04-01", downloads: 245, installs: 180 },
  { date: "2024-04-15", downloads: 409, installs: 320 },
  { date: "2024-05-01", downloads: 159, installs: 110 },
  { date: "2024-05-15", downloads: 354, installs: 290 },
]

const config = {
  downloads: { label: "Downloads", color: "hsl(var(--chart-1))" },
  installs: { label: "Installs", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export function ChartBarInteractive() {
  const [activeKey, setActiveKey] = React.useState<"downloads" | "installs">("downloads")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Interactive</CardTitle>
        <CardDescription>
          <span className="flex gap-2">
            {(["downloads", "installs"] as const).map((key) => (
              <button key={key} onClick={() => setActiveKey(key)} className={`rounded-md px-2 py-1 text-xs ${activeKey === key ? "bg-muted font-medium" : ""}`}>
                {config[key].label}
              </button>
            ))}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey={activeKey} fill={`var(--color-${activeKey})`} radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
