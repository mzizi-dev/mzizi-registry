"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

interface KanbanItem {
  id: string
  title: string
  description?: string
}

interface KanbanColumn {
  id: string
  title: string
  items: KanbanItem[]
}

interface KanbanBoardProps extends React.ComponentProps<"div"> {
  columns: KanbanColumn[]
  onMove?: (columnId: string, itemId: string) => void
}

function KanbanBoard({ className, columns, onMove, ...props }: KanbanBoardProps) {
  return (
    <div
      data-slot="kanban-board"
      className={cn("flex gap-4 overflow-x-auto pb-2", className)}
      {...props}
    >
      {columns.map((column) => (
        <KanbanColumnCard key={column.id} column={column} onMove={onMove} />
      ))}
    </div>
  )
}

function KanbanColumnCard({
  column,
  onMove,
}: {
  column: KanbanColumn
  onMove?: (columnId: string, itemId: string) => void
}) {
  return (
    <div data-slot="kanban-column" className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/50">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-medium">{column.title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {column.items.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 px-2 pb-2">
        {column.items.map((item) => (
          <KanbanItemCard
            key={item.id}
            item={item}
            onDragIndicator={() => onMove?.(column.id, item.id)}
          />
        ))}
        {column.items.length === 0 && (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No items
          </div>
        )}
      </div>
    </div>
  )
}

function KanbanItemCard({
  item,
  onDragIndicator,
}: {
  item: KanbanItem
  onDragIndicator?: () => void
}) {
  return (
    <div
      data-slot="kanban-item"
      className="group flex items-start gap-2 rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10 transition-shadow hover:shadow-sm"
    >
      <button
        type="button"
        className="mt-0.5 shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
        aria-label="Move item"
        onClick={onDragIndicator}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.title}</p>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        )}
      </div>
    </div>
  )
}

export { KanbanBoard, type KanbanColumn, type KanbanItem, type KanbanBoardProps }
