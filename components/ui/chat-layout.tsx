"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function ChatLayout({
  className,
  sidebar,
  content,
  ...props
}: React.ComponentProps<"div"> & {
  sidebar: React.ReactNode
  content: React.ReactNode
}) {
  return (
    <div
      data-slot="chat-layout"
      className={cn(
        "flex h-full w-full overflow-hidden rounded-2xl border border-border bg-card",
        className
      )}
      {...props}
    >
      <div
        data-slot="chat-layout-sidebar"
        className="hidden w-80 shrink-0 flex-col border-r border-border md:flex"
      >
        {sidebar}
      </div>
      <div data-slot="chat-layout-content" className="flex min-w-0 flex-1 flex-col">
        {content}
      </div>
    </div>
  )
}

function ChatLayoutHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-layout-header"
      className={cn("flex items-center gap-3 border-b border-border px-4 py-3", className)}
      {...props}
    />
  )
}

function ChatLayoutMessages({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-layout-messages"
      className={cn("flex-1 overflow-y-auto px-4 py-4", className)}
      {...props}
    />
  )
}

function ChatLayoutInput({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-layout-input"
      className={cn("border-t border-border px-4 py-3", className)}
      {...props}
    />
  )
}

export { ChatLayout, ChatLayoutHeader, ChatLayoutMessages, ChatLayoutInput }
