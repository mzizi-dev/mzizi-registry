"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface Assignee {
  id: string
  name: string
  avatar?: string
  available?: boolean
}

interface AssigneePickerProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  assignees: Assignee[]
  selected?: string[]
  onChange?: (ids: string[]) => void
  multiple?: boolean
  placeholder?: string
}

function AssigneePicker({
  assignees,
  selected = [],
  onChange,
  multiple = false,
  placeholder = "Assign to...",
  className,
  ...props
}: AssigneePickerProps) {
  const [search, setSearch] = React.useState("")
  const [open, setOpen] = React.useState(false)

  const filtered = assignees.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))

  const toggleAssignee = (id: string) => {
    if (multiple) {
      const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
      onChange?.(next)
    } else {
      onChange?.([id])
      setOpen(false)
    }
  }

  const selectedAssignees = assignees.filter((a) => selected.includes(a.id))

  return (
    <div
      data-slot="assignee-picker"
      data-portal="https://mzizi.dev/components/assignee-picker"
      className={cn("relative", className)}
      {...props}
    >
      <button
        onClick={() => setOpen(!open)}
        type="button"
        className="flex h-12 w-full items-center gap-2 rounded-full border border-input bg-input/30 px-4 text-sm transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selectedAssignees.length > 0 ? (
          <div className="flex -space-x-1">
            {selectedAssignees.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="flex size-6 items-center justify-center rounded-full bg-muted text-[9px] font-medium ring-2 ring-background"
              >
                {a.avatar ? (
                  <img
                    src={a.avatar}
                    alt={a.name}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  a.name.charAt(0)
                )}
              </div>
            ))}
            {selectedAssignees.length > 3 && (
              <span className="ml-1 text-xs text-muted-foreground">
                +{selectedAssignees.length - 3}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-[var(--radius-lg,14px)] border border-border bg-card p-1 shadow-lg">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            autoFocus
            className="h-9 w-full rounded-[var(--radius-md,12px)] bg-muted/30 px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-1 max-h-48 overflow-y-auto" role="listbox">
            {filtered.map((a) => (
              <button
                key={a.id}
                role="option"
                aria-selected={selected.includes(a.id)}
                onClick={() => toggleAssignee(a.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-[var(--radius-sm,7px)] px-2 py-2 text-left text-sm hover:bg-muted",
                  selected.includes(a.id) && "bg-primary/5"
                )}
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                  {a.avatar ? (
                    <img src={a.avatar} alt="" className="size-full rounded-full object-cover" />
                  ) : (
                    a.name.charAt(0)
                  )}
                </div>
                <span className="flex-1 truncate">{a.name}</span>
                {a.available !== undefined && (
                  <div
                    className={cn(
                      "size-1.5 rounded-full",
                      a.available ? "bg-[var(--color-malachite,#64FFDA)]" : "bg-muted-foreground/30"
                    )}
                  />
                )}
                {selected.includes(a.id) && <span className="text-primary">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { AssigneePicker }
export type { AssigneePickerProps }
