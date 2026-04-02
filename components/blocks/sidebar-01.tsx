"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Home, BarChart3, Users, FileText, Settings, Zap } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home", active: true },
  { icon: BarChart3, label: "Analytics" },
  { icon: Users, label: "Team" },
  { icon: FileText, label: "Documents" },
  { icon: Settings, label: "Settings" },
]

function Sidebar01() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
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
        <p className="px-3 text-xs text-muted-foreground">mukoko registry v4.0.1</p>
      </div>
    </aside>
  )
}

export { Sidebar01 }
