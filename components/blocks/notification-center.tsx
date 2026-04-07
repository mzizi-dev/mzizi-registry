"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, CheckCheck, Heart, MessageCircle, UserPlus, AtSign } from "lucide-react"

interface Notification {
  id: string
  icon: React.ElementType
  iconColor: string
  title: string
  description: string
  time: string
  read: boolean
  group: "today" | "yesterday" | "week"
  type: "all" | "mention"
}

const notifications: Notification[] = [
  {
    id: "1",
    icon: Heart,
    iconColor: "text-terracotta",
    title: "Farai liked your post",
    description: "Exploring Matobo Hills this weekend",
    time: "10m ago",
    read: false,
    group: "today",
    type: "all",
  },
  {
    id: "2",
    icon: AtSign,
    iconColor: "text-cobalt",
    title: "Kuda mentioned you",
    description: "in the Harare Developers thread",
    time: "32m ago",
    read: false,
    group: "today",
    type: "mention",
  },
  {
    id: "3",
    icon: UserPlus,
    iconColor: "text-tanzanite",
    title: "Noma started following you",
    description: "You now have 2,848 followers",
    time: "1h ago",
    read: false,
    group: "today",
    type: "all",
  },
  {
    id: "4",
    icon: MessageCircle,
    iconColor: "text-malachite",
    title: "New comment on your post",
    description: "Tendai replied: Great insights on the maize season!",
    time: "3h ago",
    read: true,
    group: "today",
    type: "all",
  },
  {
    id: "5",
    icon: Heart,
    iconColor: "text-terracotta",
    title: "Rudo liked your comment",
    description: "on Best maize varieties for this season",
    time: "1d ago",
    read: true,
    group: "yesterday",
    type: "all",
  },
  {
    id: "6",
    icon: AtSign,
    iconColor: "text-cobalt",
    title: "Tanya mentioned you",
    description: "in the Open Source Africa discussion",
    time: "1d ago",
    read: true,
    group: "yesterday",
    type: "mention",
  },
  {
    id: "7",
    icon: UserPlus,
    iconColor: "text-tanzanite",
    title: "Chipo started following you",
    description: "You now have 2,847 followers",
    time: "3d ago",
    read: true,
    group: "week",
    type: "all",
  },
  {
    id: "8",
    icon: MessageCircle,
    iconColor: "text-malachite",
    title: "New reply to your thread",
    description: "Shamwari community discussion",
    time: "5d ago",
    read: true,
    group: "week",
    type: "all",
  },
]

const groupLabels: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
}

function NotificationList({ items }: { items: Notification[] }) {
  const groups = ["today", "yesterday", "week"] as const
  const hasItems = items.length > 0

  if (!hasItems) {
    return <div className="py-8 text-center text-sm text-muted-foreground">No notifications</div>
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const groupItems = items.filter((n) => n.group === group)
        if (groupItems.length === 0) return null
        return (
          <div key={group}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{groupLabels[group]}</p>
            <div className="space-y-1">
              {groupItems.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <notif.icon className={`size-4 ${notif.iconColor}`} />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                    {!notif.read && <span className="size-2 rounded-full bg-cobalt" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NotificationCenter() {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-4" />
            Notifications
          </CardTitle>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount}</Badge>}
        </div>
        <Button variant="ghost" size="sm">
          <CheckCheck className="size-4" />
          Mark all read
        </Button>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <Tabs defaultValue="all">
          <div className="px-4 pt-3">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
            </TabsList>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="p-3">
              <TabsContent value="all">
                <NotificationList items={notifications} />
              </TabsContent>
              <TabsContent value="unread">
                <NotificationList items={notifications.filter((n) => !n.read)} />
              </TabsContent>
              <TabsContent value="mentions">
                <NotificationList items={notifications.filter((n) => n.type === "mention")} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export { NotificationCenter }
