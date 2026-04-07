"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Home, BarChart3, Users, FileText, Settings, Moon, Sun, Zap } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Users, label: "Team" },
  { icon: FileText, label: "Documents" },
  { icon: Settings, label: "Settings" },
]

function Sidebar14() {
  const [dark, setDark] = useState(false)

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 px-4">
        <Zap className="size-5 text-cobalt" />
        <span className="font-serif text-lg font-semibold text-foreground">mukoko</span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Button key={item.label} variant="ghost" className="w-full justify-start gap-3" size="sm">
            <item.icon className="size-4" />
            {item.label}
          </Button>
        ))}
      </nav>
      <Separator />
      <div className="p-3">
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
          <span className="text-sm text-muted-foreground">Theme</span>
          <button
            onClick={() => setDark(!dark)}
            className="flex size-8 items-center justify-center rounded-md bg-background text-foreground transition-colors hover:bg-accent"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </div>
    </aside>
  )
}

export { Sidebar14 }
