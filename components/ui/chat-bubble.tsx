"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, CheckCheck, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const chatBubbleVariants = cva("relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", {
  variants: {
    variant: {
      sent: "bg-primary text-primary-foreground ml-auto rounded-br-sm",
      received: "bg-muted text-foreground mr-auto rounded-bl-sm",
    },
  },
  defaultVariants: {
    variant: "received",
  },
})

type MessageStatus = "sending" | "sent" | "delivered" | "read"

interface ChatBubbleSender {
  name: string
  avatar?: string
}

interface ChatBubbleProps
  extends React.ComponentProps<"div">, VariantProps<typeof chatBubbleVariants> {
  content: string
  sender: ChatBubbleSender
  timestamp: string
  status?: MessageStatus
}

function StatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case "sending":
      return <Clock className="size-3 opacity-60" />
    case "sent":
      return <Check className="size-3 opacity-60" />
    case "delivered":
      return <CheckCheck className="size-3 opacity-60" />
    case "read":
      return <CheckCheck className="size-3 text-cobalt" />
    default:
      return null
  }
}

function ChatBubble({
  className,
  content,
  sender,
  timestamp,
  variant = "received",
  status,
  ...props
}: ChatBubbleProps) {
  const isSent = variant === "sent"

  return (
    <div
      data-slot="chat-bubble"
      data-variant={variant}
      className={cn("flex items-end gap-2", isSent ? "flex-row-reverse" : "flex-row", className)}
      {...props}
    >
      <Avatar size="sm" className="shrink-0">
        {sender.avatar && <AvatarImage src={sender.avatar} alt={sender.name} />}
        <AvatarFallback>
          {sender.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col gap-1", isSent ? "items-end" : "items-start")}>
        <div className={chatBubbleVariants({ variant })}>
          <p className="break-words whitespace-pre-wrap">{content}</p>
        </div>
        <div className={cn("flex items-center gap-1 px-1 text-xs text-muted-foreground")}>
          <span>{timestamp}</span>
          {isSent && status && <StatusIcon status={status} />}
        </div>
      </div>
    </div>
  )
}

export { ChatBubble, chatBubbleVariants }
export type { ChatBubbleProps, ChatBubbleSender, MessageStatus }
