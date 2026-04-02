"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Home, BarChart3, Users, FileText, Settings, ChevronRight, Zap } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Users, label: "Team", active: true },
  { icon: FileText, label: "Documents" },
  { icon: Settings, label: "Settings" },
]

const breadcrumb = ["Home", "Workspace", "Team"]

function Sidebar12() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 px-4">
        <Zap className="size-5 text-cobalt" />
        <span className="font-serif text-lg font-semibold text-foreground">mukoko</span>
      </div>
      <Separator />
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 px-4 py-2">
        {breadcrumb.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
            <button
              className={`text-xs ${
                i === breadcrumb.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {crumb}
            </button>
          </span>
        ))}
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
    </aside>
  )
}

export { Sidebar12 }
