"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Home, BarChart3, Users, FileText, Settings, Search, Zap } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Users, label: "Team" },
  { icon: FileText, label: "Documents" },
  { icon: Settings, label: "Settings" },
]

function Sidebar03() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 px-4">
        <Zap className="size-5 text-cobalt" />
        <span className="font-serif text-lg font-semibold text-foreground">mukoko</span>
      </div>
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="h-8 pl-8 text-sm" />
        </div>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className="w-full justify-start gap-3"
            size="sm"
          >
            <item.icon className="size-4" />
            {item.label}
          </Button>
        ))}
      </nav>
    </aside>
  )
}

export { Sidebar03 }
