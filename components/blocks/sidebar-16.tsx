"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  ChevronDown,
  ChevronsUpDown,
  Check,
  Home,
  BarChart3,
  Users,
  FileText,
  Settings,
  Inbox,
  Bell,
  Plus,
  Search,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  Zap,
} from "lucide-react"

const workspaces = [
  { id: "mukoko", label: "mukoko", color: "bg-cobalt" },
  { id: "nhimbe", label: "nhimbe", color: "bg-tanzanite" },
]

const navGroups = [
  {
    label: "Main",
    items: [
      { icon: Home, label: "Home" },
      { icon: BarChart3, label: "Analytics" },
      { icon: Inbox, label: "Inbox", count: 5 },
      { icon: Bell, label: "Notifications", count: 2 },
    ],
  },
  {
    label: "Workspace",
    items: [
      { icon: Users, label: "Team" },
      { icon: FileText, label: "Documents" },
    ],
  },
]

const quickActions = [
  { icon: Plus, label: "New project", color: "text-cobalt" },
]

function Sidebar16() {
  const [activeWs, setActiveWs] = useState("mukoko")
  const [wsOpen, setWsOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleGroup = (label: string) =>
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }))

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Workspace switcher */}
      <div className="relative p-3">
        <button
          onClick={() => setWsOpen(!wsOpen)}
          className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left hover:bg-muted"
        >
          <span className={`size-5 shrink-0 rounded ${workspaces.find((w) => w.id === activeWs)?.color}`} />
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
                onClick={() => { setActiveWs(ws.id); setWsOpen(false) }}
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

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="h-8 pl-8 text-sm" />
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-3 pb-2">
        {quickActions.map((a) => (
          <Button key={a.label} variant="outline" className="w-full justify-start gap-3" size="sm">
            <a.icon className={`size-4 ${a.color}`} />
            {a.label}
          </Button>
        ))}
      </div>

      <Separator />

      {/* Grouped nav */}
      <nav className="flex-1 overflow-auto p-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <button
              onClick={() => toggleGroup(group.label)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {group.label}
              <ChevronDown className={`size-3 transition-transform ${collapsed[group.label] ? "-rotate-90" : ""}`} />
            </button>
            {!collapsed[group.label] && (
              <div className="mt-0.5 space-y-0.5">
                {group.items.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full justify-start gap-3"
                    size="sm"
                  >
                    <item.icon className="size-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.count && <Badge variant="secondary">{item.count}</Badge>}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <Separator />

      {/* Theme + help */}
      <div className="space-y-1 p-3">
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-1.5">
          <span className="text-xs text-muted-foreground">Theme</span>
          <button
            onClick={() => setDark(!dark)}
            className="flex size-7 items-center justify-center rounded-md bg-background text-foreground hover:bg-accent"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" size="sm">
          <HelpCircle className="size-4" />
          Help & Support
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" size="sm">
          <Settings className="size-4" />
          Settings
        </Button>
      </div>

      <Separator />

      {/* User footer */}
      <div className="flex items-center gap-3 p-4">
        <Avatar size="sm">
          <AvatarFallback>TM</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-foreground">Tanya Moyo</p>
          <p className="truncate text-xs text-muted-foreground">tanya@nyuchi.com</p>
        </div>
        <Button variant="ghost" size="icon-sm">
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  )
}

export { Sidebar16 }
