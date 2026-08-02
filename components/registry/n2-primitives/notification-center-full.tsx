"use client"

import * as React from "react"
import { BellIcon, CheckIcon, SearchIcon, ArchiveIcon, Trash2Icon } from "@/lib/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export type Notification = {
  id: string
  title: string
  body?: string
  createdAt: Date | string
  read: boolean
  archived?: boolean
  mention?: boolean
  source?: string
  actionUrl?: string
}

type Filter = "all" | "unread" | "mentions" | "archived"

interface NotificationCenterFullProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  notifications: Notification[]
  onMarkRead?: (ids: string[]) => void | Promise<void>
  onArchive?: (ids: string[]) => void | Promise<void>
  onDelete?: (ids: string[]) => void | Promise<void>
  onSelect?: (notification: Notification) => void
  searchPlaceholder?: string
  emptyText?: string
  ariaLabel?: string
}

function formatGroup(date: Date): string {
  const now = new Date()
  const diff = (now.getTime() - date.getTime()) / 86400000
  if (diff < 1 && now.getDate() === date.getDate()) return "Today"
  if (diff < 2) return "Yesterday"
  if (diff < 7) return "This week"
  if (diff < 30) return "This month"
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long" })
}

function NotificationCenterFull({
  notifications,
  onMarkRead,
  onArchive,
  onDelete,
  onSelect,
  searchPlaceholder = "Search notifications",
  emptyText = "Nothing here yet.",
  ariaLabel = "Notifications",
  className,
  ...props
}: NotificationCenterFullProps) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const [query, setQuery] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return notifications.filter((n) => {
      if (filter === "unread" && n.read) return false
      if (filter === "mentions" && !n.mention) return false
      if (filter === "archived" && !n.archived) return false
      if (filter === "all" && n.archived) return false
      if (q && !(n.title.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q)))
        return false
      return true
    })
  }, [notifications, filter, query])

  const grouped = React.useMemo(() => {
    const map = new Map<string, Notification[]>()
    for (const n of filtered) {
      const d = typeof n.createdAt === "string" ? new Date(n.createdAt) : n.createdAt
      const key = formatGroup(d)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(n)
    }
    return Array.from(map.entries())
  }, [filtered])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedIds = Array.from(selected)
  const unreadCount = notifications.filter((n) => !n.read && !n.archived).length

  return (
    <div
      data-slot="notification-center-full"
      data-portal="https://mzizi.dev/components/notification-center-full"
      role="region"
      aria-label={ariaLabel}
      className={cn("flex h-full w-full max-w-2xl flex-col bg-background", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <BellIcon className="size-5" aria-hidden="true" />
          <h2 className="text-base font-semibold">Notifications</h2>
          {unreadCount > 0 && <Badge variant="default">{unreadCount}</Badge>}
        </div>
      </div>
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div className="relative flex-1">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-9"
          />
        </div>
      </div>
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && <span className="ml-1 text-xs">({unreadCount})</span>}
          </TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        {selectedIds.length > 0 && (
          <div
            role="toolbar"
            aria-label="Bulk actions"
            className="flex items-center gap-2 border-b bg-muted px-4 py-2"
          >
            <span className="text-sm">{selectedIds.length} selected</span>
            <Separator orientation="vertical" className="h-5" />
            {onMarkRead && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onMarkRead(selectedIds)
                  setSelected(new Set())
                }}
              >
                <CheckIcon className="mr-1 size-4" aria-hidden="true" />
                Mark read
              </Button>
            )}
            {onArchive && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onArchive(selectedIds)
                  setSelected(new Set())
                }}
              >
                <ArchiveIcon className="mr-1 size-4" aria-hidden="true" />
                Archive
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onDelete(selectedIds)
                  setSelected(new Set())
                }}
              >
                <Trash2Icon className="mr-1 size-4" aria-hidden="true" />
                Delete
              </Button>
            )}
          </div>
        )}
        <TabsContent value={filter} className="mt-0 min-h-0 flex-1">
          <ScrollArea className="h-full">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">{emptyText}</div>
            ) : (
              <ul role="feed" aria-label={`${filter} notifications`} aria-busy="false">
                {grouped.map(([group, items]) => (
                  <li key={group}>
                    <div className="sticky top-0 bg-background/95 px-4 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                      {group}
                    </div>
                    <ul>
                      {items.map((n) => {
                        const isSelected = selected.has(n.id)
                        return (
                          <li key={n.id}>
                            <div
                              data-slot="notification-item"
                              data-read={n.read}
                              data-mention={!!n.mention}
                              data-selected={isSelected}
                              className={cn(
                                "flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-b-0 focus-within:bg-muted/60 hover:bg-muted/60",
                                !n.read && "bg-accent/30",
                                isSelected && "bg-primary/10"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggle(n.id)}
                                aria-label={`Select ${n.title}`}
                                className="mt-1"
                              />
                              <button
                                type="button"
                                onClick={() => onSelect?.(n)}
                                className="min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                aria-label={n.title}
                              >
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className={cn("text-sm", !n.read && "font-semibold")}>
                                    {n.title}
                                  </span>
                                  <time
                                    className="shrink-0 text-xs text-muted-foreground"
                                    dateTime={(typeof n.createdAt === "string"
                                      ? new Date(n.createdAt)
                                      : n.createdAt
                                    ).toISOString()}
                                  >
                                    {(typeof n.createdAt === "string"
                                      ? new Date(n.createdAt)
                                      : n.createdAt
                                    ).toLocaleTimeString(undefined, {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </time>
                                </div>
                                {n.body && (
                                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                                    {n.body}
                                  </p>
                                )}
                                {n.source && (
                                  <p className="mt-1 text-xs text-muted-foreground">{n.source}</p>
                                )}
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { NotificationCenterFull }
