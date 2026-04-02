"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  BarChart3,
  Users,
  FileText,
  Settings,
  ChevronsUpDown,
  Check,
} from "lucide-react"

const workspaces = [
  { id: "mukoko", label: "mukoko", color: "bg-cobalt" },
  { id: "nhimbe", label: "nhimbe", color: "bg-tanzanite" },
  { id: "bundu", label: "bundu", color: "bg-malachite" },
]

const navItems = [
  { icon: Home, label: "Home" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Users, label: "Team" },
  { icon: FileText, label: "Documents" },
  { icon: Settings, label: "Settings" },
]

function Sidebar15() {
  const [activeWs, setActiveWs] = useState("mukoko")
  const [wsOpen, setWsOpen] = useState(false)

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      {/* Workspace switcher */}
      <div className="relative p-3">
        <button
          onClick={() => setWsOpen(!wsOpen)}
          className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left hover:bg-muted"
        >
          <span
            className={`size-5 shrink-0 rounded ${workspaces.find((w) => w.id === activeWs)?.color}`}
          />
          <span className="flex-1 text-sm font-medium text-foreground">
            {workspaces.find((w) => w.id === activeWs)?.label}
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </button>
        {wsOpen && (
          <div className="absolute inset-x-3 top-full z-10 mt-1 rounded-lg border border-border bg-popover p-1 shadow-md">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWs(ws.id)
                  setWsOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                <span className={`size-4 shrink-0 rounded ${ws.color}`} />
                <span className="flex-1 text-foreground">{ws.label}</span>
                {activeWs === ws.id && <Check className="size-4 text-malachite" />}
              </button>
            ))}
          </div>
        )}
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
    </aside>
  )
}

export { Sidebar15 }
