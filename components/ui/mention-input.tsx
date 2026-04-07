"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface MentionUser {
  id: string
  name: string
  avatar?: string
}

function MentionInput({
  value,
  onChange,
  users,
  placeholder = "Type @ to mention someone...",
  className,
  ...props
}: {
  value: string
  onChange: (value: string) => void
  users: MentionUser[]
  placeholder?: string
} & Omit<React.ComponentProps<"div">, "onChange">) {
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [cursorIndex, setCursorIndex] = React.useState(-1)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const filtered = React.useMemo(
    () => (query ? users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase())) : users),
    [users, query]
  )

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value
    onChange(text)

    const pos = e.target.selectionStart ?? text.length
    const before = text.slice(0, pos)
    const match = before.match(/@(\w*)$/)
    if (match) {
      setQuery(match[1])
      setShowDropdown(true)
      setCursorIndex(0)
    } else {
      setShowDropdown(false)
    }
  }

  function insertMention(user: MentionUser) {
    const textarea = textareaRef.current
    if (!textarea) return
    const pos = textarea.selectionStart ?? value.length
    const before = value.slice(0, pos)
    const after = value.slice(pos)
    const atIndex = before.lastIndexOf("@")
    const newValue = `${before.slice(0, atIndex)}@${user.name} ${after}`
    onChange(newValue)
    setShowDropdown(false)
    setTimeout(() => {
      const newPos = atIndex + user.name.length + 2
      textarea.focus()
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || filtered.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setCursorIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setCursorIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      insertMention(filtered[cursorIndex] ?? filtered[0])
    } else if (e.key === "Escape") {
      setShowDropdown(false)
    }
  }

  return (
    <div data-slot="mention-input" className={cn("relative", className)} {...props}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
        className="w-full min-w-0 resize-none rounded-xl border border-input bg-input/30 px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-48 overflow-auto rounded-xl border border-border bg-card p-1 shadow-lg">
          {filtered.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => insertMention(user)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                index === cursorIndex ? "bg-muted" : "hover:bg-muted/50"
              )}
            >
              <div className="size-6 shrink-0 overflow-hidden rounded-full bg-muted">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                    {user.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-foreground">{user.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { MentionInput, type MentionUser }
