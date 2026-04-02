"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  BarChart3,
  Users,
  FileText,
  Settings,
  CreditCard,
  Shield,
  Zap,
} from "lucide-react"

const groups = [
  {
    label: "General",
    items: [
      { icon: Home, label: "Home" },
      { icon: BarChart3, label: "Analytics" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { icon: Users, label: "Team" },
      { icon: FileText, label: "Documents" },
      { icon: Shield, label: "Permissions" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: CreditCard, label: "Billing" },
      { icon: Settings, label: "Settings" },
    ],
  },
]

function Sidebar09() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 px-4">
        <Zap className="size-5 text-cobalt" />
        <span className="font-serif text-lg font-semibold text-foreground">mukoko</span>
      </div>
      <Separator />
      <nav className="flex-1 overflow-auto p-3">
        {groups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-4" : ""}>
            <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
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
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}

export { Sidebar09 }
