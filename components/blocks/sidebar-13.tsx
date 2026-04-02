"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  BarChart3,
  Users,
  FileText,
  Settings,
  Plus,
  Upload,
  Download,
  Zap,
} from "lucide-react"

const navItems = [
  { icon: Home, label: "Home" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Users, label: "Team" },
  { icon: FileText, label: "Documents" },
  { icon: Settings, label: "Settings" },
]

const quickActions = [
  { icon: Plus, label: "New project", color: "text-cobalt" },
  { icon: Upload, label: "Upload file", color: "text-tanzanite" },
  { icon: Download, label: "Export data", color: "text-malachite" },
]

function Sidebar13() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 px-4">
        <Zap className="size-5 text-cobalt" />
        <span className="font-serif text-lg font-semibold text-foreground">mukoko</span>
      </div>
      <Separator />
      {/* Quick actions */}
      <div className="p-3">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </p>
        <div className="space-y-1">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="w-full justify-start gap-3"
              size="sm"
            >
              <action.icon className={`size-4 ${action.color}`} />
              {action.label}
            </Button>
          ))}
        </div>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-3">
        <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
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

export { Sidebar13 }
