"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Home, BarChart3, Users, FileText, Settings, LogOut, Zap } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Users, label: "Team" },
  { icon: FileText, label: "Documents" },
  { icon: Settings, label: "Settings" },
]

function Sidebar04() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 px-4">
        <Zap className="size-5 text-cobalt" />
        <span className="font-serif text-lg font-semibold text-foreground">mukoko</span>
      </div>
      <Separator />
      {/* User profile */}
      <div className="flex items-center gap-3 p-4">
        <Avatar>
          <AvatarImage src="/avatars/01.png" alt="Tanya Moyo" />
          <AvatarFallback>TM</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-foreground">Tanya Moyo</p>
          <p className="truncate text-xs text-muted-foreground">tanya@nyuchi.com</p>
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
      <Separator />
      <div className="p-3">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" size="sm">
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}

export { Sidebar04 }
