"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Home, BarChart3, Users, FileText, Settings, LogOut, HelpCircle, Zap } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Users, label: "Team" },
  { icon: FileText, label: "Documents" },
]

function Sidebar08() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-cobalt" />
          <span className="font-serif text-lg font-semibold text-foreground">mukoko</span>
        </div>
      </div>
      <Separator />

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Button key={item.label} variant="ghost" className="w-full justify-start gap-3" size="sm">
            <item.icon className="size-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Footer */}
      <Separator />
      <div className="space-y-1 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          size="sm"
        >
          <HelpCircle className="size-4" />
          Help & Support
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          size="sm"
        >
          <Settings className="size-4" />
          Settings
        </Button>
      </div>
      <Separator />
      <div className="flex items-center gap-3 p-4">
        <Avatar size="sm">
          <AvatarFallback>TM</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-foreground">Tanya Moyo</p>
        </div>
        <Button variant="ghost" size="icon-sm">
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  )
}

export { Sidebar08 }
