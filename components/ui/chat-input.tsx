"use client"

import * as React from "react"
import { Paperclip, Send } from "lucide-react"

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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [])

  React.useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleSend = React.useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend?.(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, disabled, onSend])

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
      data-slot="chat-input"
      className={cn(
        "border-border bg-card flex items-end gap-2 rounded-2xl border p-2",
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
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "placeholder:text-muted-foreground flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />

      <Button
        type="button"
        size="icon"
        disabled={disabled || !value.trim()}
        onClick={handleSend}
        className="mb-0.5 shrink-0 bg-cobalt text-white hover:bg-cobalt/80"
        aria-label="Send message"
      >
        <Send className="size-4" />
      </Button>
    </div>
  )
}

export { ChatInput }
export type { ChatInputProps }
