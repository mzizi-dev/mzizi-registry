"use client"

import * as React from "react"
import { Send, Square } from "@/lib/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PromptInputProps extends React.ComponentProps<"div"> {
  onSend?: (message: string) => void
  onStop?: () => void
  isStreaming?: boolean
  placeholder?: string
}

function PromptInput({
  className,
  onSend,
  onStop,
  isStreaming = false,
  placeholder = "Type a message...",
  ...props
}: PromptInputProps) {
  const [value, setValue] = React.useState("")

  const handleSend = React.useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend?.(trimmed)
    setValue("")
  }, [value, isStreaming, onSend])

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
      data-slot="prompt-input"
      data-portal="https://mzizi.dev/components/prompt-input"
      className={cn(
        "flex items-end gap-2 rounded-[var(--radius-lg,14px)] border border-border bg-card p-2",
        className
      )}
      {...props}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isStreaming}
        rows={1}
        className={cn(
          "flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          // the box grows with its content and stops at 200px (max-h-50)
          "[field-sizing:content] max-h-50 overflow-y-auto"
        )}
      />

      {isStreaming ? (
        <Button
          type="button"
          size="icon"
          variant="destructive"
          onClick={onStop}
          className="mb-0.5 shrink-0"
          aria-label="Stop generating"
        >
          <Square className="size-3.5" />
        </Button>
      ) : (
        <Button
          type="button"
          size="icon"
          disabled={!value.trim()}
          onClick={handleSend}
          className="mb-0.5 shrink-0 bg-cobalt text-white transition-colors hover:bg-cobalt/80"
          aria-label="Send message"
        >
          <Send className="size-4" />
        </Button>
      )}
    </div>
  )
}

export { PromptInput }
export type { PromptInputProps }
