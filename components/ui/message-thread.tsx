"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface ThreadMessage {
  id: string
  content: string
  sender: string
  timestamp: string
  replies?: ThreadMessage[]
}

function MessageItem({
  message,
  onReply,
  depth = 0,
}: {
  message: ThreadMessage
  onReply?: (parentId: string) => void
  depth?: number
}) {
  const [collapsed, setCollapsed] = React.useState(false)
  const hasReplies = message.replies && message.replies.length > 0

  return (
    <div data-slot="message-item" className="flex gap-3">
      {depth > 0 && (
        <div className="flex w-4 shrink-0 justify-center">
          <div className="w-px bg-border" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-foreground">{message.sender}</span>
          <span className="text-xs text-muted-foreground">{message.timestamp}</span>
        </div>
        <p className="mt-1 text-sm text-foreground">{message.content}</p>
        <div className="mt-1.5 flex items-center gap-3">
          {onReply && (
            <button
              onClick={() => onReply(message.id)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Reply
            </button>
          )}
          {hasReplies && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {collapsed ? `Show ${message.replies!.length} replies` : "Hide replies"}
            </button>
          )}
        </div>
        {hasReplies && !collapsed && (
          <div className="mt-2 flex flex-col gap-3">
            {message.replies!.map((reply) => (
              <MessageItem
                key={reply.id}
                message={reply}
                onReply={onReply}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MessageThread({
  className,
  messages,
  onReply,
  ...props
}: React.ComponentProps<"div"> & {
  messages: ThreadMessage[]
  onReply?: (parentId: string) => void
}) {
  return (
    <div
      data-slot="message-thread"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} onReply={onReply} />
      ))}
    </div>
  )
}

export { MessageThread, type ThreadMessage }
