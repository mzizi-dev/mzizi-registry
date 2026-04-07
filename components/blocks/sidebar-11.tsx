"use client"

import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, Home, Users, Settings, Zap } from "lucide-react"

const accordionSections = [
  {
    title: "Dashboard",
    icon: Home,
    items: ["Overview", "Analytics", "Reports"],
  },
  {
    title: "Team",
    icon: Users,
    items: ["Members", "Invitations", "Roles"],
  },
  {
    title: "Settings",
    icon: Settings,
    items: ["General", "Security", "Notifications", "Billing"],
  },
]

function Sidebar11() {
  const [open, setOpen] = useState<string | null>("Dashboard")

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 px-4">
        <Zap className="size-5 text-cobalt" />
        <span className="font-serif text-lg font-semibold text-foreground">mukoko</span>
      </div>
      <Separator />
      <nav className="flex-1 overflow-auto p-3">
        {accordionSections.map((section) => (
          <div key={section.title} className="mb-1">
            <button
              onClick={() => setOpen(open === section.title ? null : section.title)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <section.icon className="size-4" />
              <span className="flex-1 text-left">{section.title}</span>
              <ChevronDown
                className={`size-3.5 text-muted-foreground transition-transform ${
                  open === section.title ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            {open === section.title && (
              <div className="ml-7 space-y-0.5 border-l border-border py-1 pl-3">
                {section.items.map((item) => (
                  <button
                    key={item}
                    className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export { Sidebar11 }
