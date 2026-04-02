"use client"

import * as React from "react"
import { Send, Square } from "lucide-react"

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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [])

  React.useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleSend = React.useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend?.(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, isStreaming, onSend])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div
      data-slot="prompt-input"
      className={cn(
        "border-border bg-card flex items-end gap-2 rounded-2xl border p-2",
        className
      )}
      {...props}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isStreaming}
        rows={1}
        className={cn(
          "placeholder:text-muted-foreground flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
          className="mb-0.5 shrink-0 bg-cobalt text-white hover:bg-cobalt/80"
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
