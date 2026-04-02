"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"

interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

function Checklist({
  items,
  onChange,
  onAdd,
  className,
  ...props
}: {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
  onAdd?: (text: string) => void
} & Omit<React.ComponentProps<"div">, "onChange">) {
  const [newText, setNewText] = React.useState("")
  const checkedCount = items.filter((i) => i.checked).length
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0

  function toggleItem(id: string) {
    onChange(items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)))
  }

  function handleAdd() {
    const trimmed = newText.trim()
    if (!trimmed || !onAdd) return
    onAdd(trimmed)
    setNewText("")
  }

  return (
    <div data-slot="checklist" className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--color-malachite)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {checkedCount}/{items.length}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleItem(item.id)}
              className="sr-only peer"
            />
            <div className={cn(
              "flex size-4.5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
              item.checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
            )}>
              {item.checked && (
                <svg className="size-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </div>
            <span className={cn("text-sm", item.checked ? "text-muted-foreground line-through" : "text-foreground")}>
              {item.text}
            </span>
          </label>
        ))}
      </div>
      {onAdd && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add item..."
            className="bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 flex-1 min-w-0 rounded-lg border px-3 text-sm outline-none transition-colors focus-visible:ring-[3px]"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Add item"
          >
            <Plus className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export { Checklist, type ChecklistItem }
