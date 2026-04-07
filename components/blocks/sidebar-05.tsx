"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ChevronRight,
  Home,
  BarChart3,
  Users,
  Settings,
  Zap,
  UserPlus,
  UserCheck,
  Shield,
} from "lucide-react"

const navItems = [
  { icon: Home, label: "Home" },
  { icon: BarChart3, label: "Analytics" },
  {
    icon: Users,
    label: "Team",
    children: [
      { icon: UserPlus, label: "Invite" },
      { icon: UserCheck, label: "Members" },
      { icon: Shield, label: "Roles" },
    ],
  },
  { icon: Settings, label: "Settings" },
]

function Sidebar05() {
  const [expanded, setExpanded] = useState<string | null>("Team")

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 px-4">
        <Zap className="size-5 text-cobalt" />
        <span className="font-serif text-lg font-semibold text-foreground">mukoko</span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <div key={item.label}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              size="sm"
              onClick={() =>
                item.children ? setExpanded(expanded === item.label ? null : item.label) : undefined
              }
            >
              <item.icon className="size-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.children && (
                <ChevronRight
                  className={`size-3 transition-transform ${expanded === item.label ? "rotate-90" : ""}`}
                />
              )}
            </Button>
            {item.children && expanded === item.label && (
              <div className="mt-1 ml-4 space-y-0.5 border-l border-border pl-3">
                {item.children.map((child) => (
                  <Button
                    key={child.label}
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground"
                    size="sm"
                  >
                    <child.icon className="size-3.5" />
                    {child.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export { Sidebar05 }
