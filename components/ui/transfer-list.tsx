"use client"

import * as React from "react"
import { ArrowLeftIcon, ArrowRightIcon, SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TransferItem {
  id: string
  label: string
}

interface TransferListProps {
  available: TransferItem[]
  selected: TransferItem[]
  onTransfer: (available: TransferItem[], selected: TransferItem[]) => void
  className?: string
}

function TransferPanel({
  title,
  items,
  selectedIds,
  onToggle,
  search,
  onSearchChange,
}: {
  title: string
  items: TransferItem[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  search: string
  onSearchChange: (v: string) => void
}) {
  const filtered = items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {title} ({items.length})
        </span>
      </div>
      <div className="border-b border-border p-2">
        <div className="relative">
          <SearchIcon className="absolute top-2 left-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter..."
            className="h-7 pl-8 text-xs"
          />
        </div>
      </div>
      <div className="flex max-h-48 flex-col overflow-y-auto p-1">
        {filtered.length === 0 && (
          <span className="px-3 py-4 text-center text-xs text-muted-foreground">No items</span>
        )}
        {filtered.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(item.id)}
              onChange={() => onToggle(item.id)}
              className="accent-primary"
            />
            {item.label}
          </label>
        ))}
      </div>
    </div>
  )
}

function TransferList({ available, selected, onTransfer, className }: TransferListProps) {
  const [leftChecked, setLeftChecked] = React.useState<Set<string>>(new Set())
  const [rightChecked, setRightChecked] = React.useState<Set<string>>(new Set())
  const [leftSearch, setLeftSearch] = React.useState("")
  const [rightSearch, setRightSearch] = React.useState("")

  function toggle(
    set: Set<string>,
    setFn: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string
  ) {
    const next = new Set(set)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setFn(next)
  }

  function moveRight() {
    const moving = available.filter((i) => leftChecked.has(i.id))
    onTransfer(
      available.filter((i) => !leftChecked.has(i.id)),
      [...selected, ...moving]
    )
    setLeftChecked(new Set())
  }

  function moveLeft() {
    const moving = selected.filter((i) => rightChecked.has(i.id))
    onTransfer(
      [...available, ...moving],
      selected.filter((i) => !rightChecked.has(i.id))
    )
    setRightChecked(new Set())
  }

  return (
    <div data-slot="transfer-list" className={cn("flex items-center gap-2", className)}>
      <TransferPanel
        title="Available"
        items={available}
        selectedIds={leftChecked}
        onToggle={(id) => toggle(leftChecked, setLeftChecked, id)}
        search={leftSearch}
        onSearchChange={setLeftSearch}
      />
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={leftChecked.size === 0}
          onClick={moveRight}
          aria-label="Move selected right"
        >
          <ArrowRightIcon />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={rightChecked.size === 0}
          onClick={moveLeft}
          aria-label="Move selected left"
        >
          <ArrowLeftIcon />
        </Button>
      </div>
      <TransferPanel
        title="Selected"
        items={selected}
        selectedIds={rightChecked}
        onToggle={(id) => toggle(rightChecked, setRightChecked, id)}
        search={rightSearch}
        onSearchChange={setRightSearch}
      />
    </div>
  )
}

export { TransferList }
export type { TransferListProps, TransferItem }
