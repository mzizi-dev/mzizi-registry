"use client"

import * as React from "react"
import { Bot, Loader2, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PromptInput } from "@/components/ui/prompt-input"

interface AiMessage {
  role: "user" | "assistant"
  content: string
}

interface AiChatProps extends React.ComponentProps<"div"> {
  messages: AiMessage[]
  onSend?: (message: string) => void
  isStreaming?: boolean
  suggestedPrompts?: string[]
}

function AiMessageBubble({ message }: { message: AiMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex items-start gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarFallback
          className={cn(
            isUser ? "bg-primary text-primary-foreground" : "bg-tanzanite/20 text-tanzanite"
          )}
        >
          {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground"
        )}
      >
        <p className="break-words whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}

function StreamingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarFallback className="bg-tanzanite/20 text-tanzanite">
          <Bot className="size-3.5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>shamwari is thinking...</span>
      </div>
    </div>
  )
}

function AiChat({
  className,
  messages,
  onSend,
  isStreaming = false,
  suggestedPrompts,
  ...props
}: AiChatProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  const showSuggestions = messages.length === 0 && suggestedPrompts && suggestedPrompts.length > 0

  return (
    <div data-slot="ai-chat" className={cn("flex h-full flex-col", className)} {...props}>
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="flex flex-col gap-4 p-4">
          {showSuggestions && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bot className="size-5 text-tanzanite" />
                <span className="text-sm font-medium">How can shamwari help you?</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => onSend?.(prompt)}
                    className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <AiMessageBubble key={index} message={message} />
          ))}

          {isStreaming && <StreamingIndicator />}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <PromptInput
          onSend={onSend}
          onStop={() => {}}
          isStreaming={isStreaming}
          placeholder="Ask shamwari anything..."
        />
      </div>
    </div>
  )
}

export { AiChat, AiMessageBubble, StreamingIndicator }
export type { AiChatProps, AiMessage }
