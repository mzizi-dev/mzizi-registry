"use client"

import { Sprout, Pickaxe } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const data = [
  { month: "Jan", farming: 186, mining: 80 },
  { month: "Feb", farming: 305, mining: 200 },
  { month: "Mar", farming: 237, mining: 120 },
  { month: "Apr", farming: 173, mining: 190 },
  { month: "May", farming: 409, mining: 130 },
  { month: "Jun", farming: 214, mining: 140 },
]

const config = {
  farming: { label: "Farming", color: "hsl(var(--chart-3))", icon: Sprout },
  mining: { label: "Mining", color: "hsl(var(--chart-5))", icon: Pickaxe },
} satisfies ChartConfig

export function ChartTooltipIcons() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tooltip - Icons</CardTitle>
        <CardDescription>Tooltip with category icons</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="farming" fill="var(--color-farming)" radius={4} />
            <Bar dataKey="mining" fill="var(--color-mining)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
