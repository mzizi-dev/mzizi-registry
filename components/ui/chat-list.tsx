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

interface ChatListProps extends React.ComponentProps<"div"> {
  conversations: ChatConversation[]
  activeId?: string
  onSelect?: (id: string) => void
}

function ChatListItem({
  conversation,
  isActive,
  onSelect,
}: {
  conversation: ChatConversation
  isActive: boolean
  onSelect?: (id: string) => void
}) {
  return (
    <button
      data-slot="chat-list-item"
      data-active={isActive || undefined}
      type="button"
      onClick={() => onSelect?.(conversation.id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors outline-none",
        "hover:bg-muted/50 focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        isActive && "bg-muted"
      )}
    >
      <Avatar className="shrink-0">
        {conversation.avatar && (
          <AvatarImage src={conversation.avatar} alt={conversation.name} />
        )}
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
          <span className="shrink-0 text-xs text-muted-foreground">
            {conversation.timestamp}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {conversation.lastMessage}
          </span>
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
  className,
  conversations,
  activeId,
  onSelect,
  ...props
}: ChatListProps) {
  return (
    <div
      data-slot="chat-list"
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
