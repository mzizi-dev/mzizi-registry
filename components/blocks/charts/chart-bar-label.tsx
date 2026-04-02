"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { city: "Harare", users: 186 },
  { city: "Nairobi", users: 305 },
  { city: "Lagos", users: 237 },
  { city: "Accra", users: 173 },
  { city: "Kigali", users: 209 },
  { city: "Lusaka", users: 114 },
]

const config = {
  users: { label: "Users", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ChartBarLabel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Labels</CardTitle>
        <CardDescription>Users per city with labels</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="city" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="users" fill="var(--color-users)" radius={4}>
              <LabelList dataKey="users" position="top" className="fill-foreground" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
