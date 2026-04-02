"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function TypingIndicator({
  className,
  name,
  ...props
}: React.ComponentProps<"div"> & {
  name?: string
}) {
  return (
    <div
      data-slot="typing-indicator"
      className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
      {...props}
    >
      {name && <span className="font-medium text-foreground">{name}</span>}
      <span className="flex items-center gap-0.5">
        <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
        <span className="typing-dot size-1.5 rounded-full bg-muted-foreground [animation-delay:150ms]" />
        <span className="typing-dot size-1.5 rounded-full bg-muted-foreground [animation-delay:300ms]" />
      </span>
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .typing-dot {
          animation: typing-bounce 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export { TypingIndicator }
