"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatConversation {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  timestamp: string
  unreadCount?: number
}

interface ChatListProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  /** Render the skeleton instead of the content. */
  loading?: boolean
  conversations: ChatConversation[]
  activeId?: string
  onSelect?: (id: string) => void
}

function ChatListItem({
  loading = false,
  conversation,
  isActive,
  onSelect,
}: {
  /** Render the skeleton instead of the content. */
  loading?: boolean
  conversation: ChatConversation
  isActive: boolean
  onSelect?: (id: string) => void
}) {
  if (loading)
    return (
      <div data-loading className="animate-pulse space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="size-9 shrink-0 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-2/3 rounded bg-muted" />
              <div className="h-2.5 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )

  return (
    <button
      data-slot="chat-list-item"
      data-portal="https://mzizi.dev/components/chat-list-item"
      data-active={isActive || undefined}
      type="button"
      onClick={() => onSelect?.(conversation.id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-[var(--radius-xl,17px)] px-3 py-3 text-left transition-colors outline-none",
        "hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        isActive && "bg-muted"
      )}
    >
      <Avatar className="shrink-0">
        {conversation.avatar && <AvatarImage src={conversation.avatar} alt={conversation.name} />}
        <AvatarFallback>
          {conversation.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm font-medium",
              conversation.unreadCount && conversation.unreadCount > 0
                ? "text-foreground"
                : "text-foreground/80"
            )}
          >
            {conversation.name}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">{conversation.timestamp}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">{conversation.lastMessage}</span>
          {conversation.unreadCount != null && conversation.unreadCount > 0 && (
            <Badge
              variant="default"
              className="size-5 shrink-0 justify-center rounded-full p-0 text-[10px]"
            >
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}

function ChatList({
  loading = false,
  className,
  conversations,
  activeId,
  onSelect,
  ...props
}: ChatListProps) {
  if (loading)
    return (
      <div data-loading className="animate-pulse space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="size-9 shrink-0 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-2/3 rounded bg-muted" />
              <div className="h-2.5 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )

  return (
    <div
      data-slot="chat-list"
      role="list"
      aria-label="Conversations"
      className={cn("flex flex-col", className)}
      {...props}
    >
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 p-2">
          {conversations.map((conversation) => (
            <ChatListItem
              key={conversation.id}
              conversation={conversation}
              isActive={activeId === conversation.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export { ChatList, ChatListItem }
export type { ChatListProps, ChatConversation }
