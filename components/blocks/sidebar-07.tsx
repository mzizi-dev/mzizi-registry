"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Home, Inbox, Bell, MessageSquare, Settings, Zap } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home" },
  { icon: Inbox, label: "Inbox", count: 12 },
  { icon: Bell, label: "Notifications", count: 3 },
  { icon: MessageSquare, label: "Messages", count: 7 },
  { icon: Settings, label: "Settings" },
]

function Sidebar07() {
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
            <span className="flex-1">{item.label}</span>
            {item.count && (
              <Badge variant="secondary" className="ml-auto">
                {item.count}
              </Badge>
            )}
          </Button>
        ))}
      </nav>
    </aside>
  )
}

export { Sidebar07 }
