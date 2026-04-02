"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Home, BarChart3, Users, FileText, Settings, Zap } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home", active: true },
  { icon: BarChart3, label: "Analytics" },
  { icon: Users, label: "Team" },
  { icon: FileText, label: "Documents" },
  { icon: Settings, label: "Settings" },
]

function Sidebar10() {
  return (
    <div className="flex h-screen items-start p-4">
      <Card className="flex h-[calc(100vh-2rem)] w-56 flex-col shadow-lg">
        <div className="flex h-14 items-center gap-2 px-4">
          <Zap className="size-5 text-cobalt" />
          <span className="font-serif text-lg font-semibold text-foreground">mukoko</span>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "secondary" : "ghost"}
              className="w-full justify-start gap-3"
              size="sm"
            >
              <item.icon className="size-4" />
              {item.label}
            </Button>
          ))}
        </nav>
        <Separator />
        <div className="p-3">
          <p className="px-3 text-xs text-muted-foreground">Floating sidebar</p>
        </div>
      </Card>
    </div>
  )
}

export { Sidebar10 }
