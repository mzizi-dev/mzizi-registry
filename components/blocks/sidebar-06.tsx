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

function Sidebar06() {
  return (
    <aside className="flex h-screen w-14 flex-col items-center border-r border-border bg-card py-3">
      <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-cobalt/10">
        <Zap className="size-4 text-cobalt" />
      </div>
      <Separator className="my-2 w-8" />
      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant={item.active ? "secondary" : "ghost"}
            size="icon-sm"
            title={item.label}
          >
            <item.icon className="size-4" />
          </Button>
        ))}
      </nav>
      <Separator className="my-2 w-8" />
      <Button variant="ghost" size="icon-sm" title="Settings">
        <Settings className="size-4" />
      </Button>
    </aside>
  )
}

export { Sidebar06 }
