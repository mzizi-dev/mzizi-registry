"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  BarChart3,
  Bell,
  Home,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

const stats = [
  {
    label: "Total Users",
    value: "12,483",
    change: "+14%",
    color: "text-cobalt",
    bg: "bg-cobalt/10",
  },
  {
    label: "Revenue",
    value: "$48.2K",
    change: "+8.2%",
    color: "text-tanzanite",
    bg: "bg-tanzanite/10",
  },
  {
    label: "Active Now",
    value: "1,024",
    change: "+22%",
    color: "text-malachite",
    bg: "bg-malachite/10",
  },
  { label: "Conversions", value: "3.6%", change: "+1.2%", color: "text-gold", bg: "bg-gold/10" },
]

const navItems = [
  { icon: Home, label: "Home" },
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Users" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Settings, label: "Settings" },
]

const activity = [
  { user: "Tanya M.", action: "completed onboarding", time: "2m ago", initials: "TM" },
  { user: "Kuda R.", action: "upgraded to Pro", time: "15m ago", initials: "KR" },
  { user: "Farai C.", action: "submitted a report", time: "1h ago", initials: "FC" },
  { user: "Noma S.", action: "invited 3 team members", time: "3h ago", initials: "NS" },
]

function Dashboard01() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-col border-r border-border bg-card p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <Zap className="size-5 text-cobalt" />
          <span className="font-serif text-lg font-semibold text-foreground">mukoko</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border px-6">
          <h1 className="font-serif text-lg font-semibold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm">
              <Bell className="size-4" />
            </Button>
            <Avatar size="sm">
              <AvatarImage src="/avatars/01.png" alt="User" />
              <AvatarFallback>TM</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 space-y-6 p-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} size="sm">
                <CardContent className="flex items-center gap-4">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}>
                    <TrendingUp className={`size-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                    <p className={`text-xs font-medium ${stat.color}`}>{stat.change}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart placeholder + Activity */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-48 items-end gap-2">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm bg-cobalt/20 transition-all hover:bg-cobalt/40"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activity.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback>{item.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-sm">
                        <span className="font-medium text-foreground">{item.user}</span>{" "}
                        <span className="text-muted-foreground">{item.action}</span>
                      </div>
                      <Badge variant="secondary">{item.time}</Badge>
                    </div>
                    {i < activity.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export { Dashboard01 }
