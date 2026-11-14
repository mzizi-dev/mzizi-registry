"use client"

import * as React from "react"
import { Paperclip, Send } from "@/lib/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ChatInputProps extends React.ComponentProps<"div"> {
  onSend?: (message: string) => void
  placeholder?: string
  disabled?: boolean
  showAttachment?: boolean
}

function ChatInput({
  className,
  onSend,
  placeholder = "Type a message...",
  disabled = false,
  showAttachment = false,
  ...props
}: ChatInputProps) {
  const [value, setValue] = React.useState("")

  const handleSend = React.useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend?.(trimmed)
    setValue("")
  }, [value, disabled, onSend])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // isComposing: an IME confirming a conversion candidate must not send
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div
      data-slot="chat-input"
      data-portal="https://mzizi.dev/components/chat-input"
      className={cn(
        "flex items-end gap-2 rounded-[var(--radius-lg,14px)] border border-border bg-card p-2",
        className
      )}
      {...props}
    >
      {showAttachment && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="mb-0.5 shrink-0"
          aria-label="Attach file"
        >
          <Paperclip className="size-4" />
        </Button>
      )}

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          // the box grows with its content and stops at 160px (max-h-40)
          "[field-sizing:content] max-h-40 overflow-y-auto"
        )}
      />

      <Button
        type="button"
        size="icon"
        disabled={disabled || !value.trim()}
        onClick={handleSend}
        className="mb-0.5 shrink-0 bg-cobalt text-white transition-colors hover:bg-cobalt/80"
        aria-label="Send message"
      >
        <Send className="size-4" />
      </Button>
    </div>
  )
}

export { ChatInput }
export type { ChatInputProps }
