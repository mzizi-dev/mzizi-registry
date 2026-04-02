"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ChevronDown,
  Home,
  BarChart3,
  Users,
  FileText,
  Settings,
  Zap,
  ShoppingCart,
  CreditCard,
} from "lucide-react"

const sections = [
  {
    title: "Overview",
    items: [
      { icon: Home, label: "Home" },
      { icon: BarChart3, label: "Analytics" },
    ],
  },
  {
    title: "Management",
    items: [
      { icon: Users, label: "Team" },
      { icon: FileText, label: "Documents" },
      { icon: ShoppingCart, label: "Orders" },
    ],
  },
  {
    title: "Billing",
    items: [
      { icon: CreditCard, label: "Payments" },
      { icon: Settings, label: "Settings" },
    ],
  },
]

function Sidebar02() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggle = (title: string) =>
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }))

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 px-4">
        <Zap className="size-5 text-cobalt" />
        <span className="font-serif text-lg font-semibold text-foreground">mukoko</span>
      </div>
      <Separator />
      <nav className="flex-1 overflow-auto p-3">
        {sections.map((section) => (
          <div key={section.title} className="mb-2">
            <button
              onClick={() => toggle(section.title)}
              className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {section.title}
              <ChevronDown
                className={`size-3 transition-transform ${collapsed[section.title] ? "-rotate-90" : ""}`}
              />
            </button>
            {!collapsed[section.title] && (
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => (
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
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export { Sidebar02 }
