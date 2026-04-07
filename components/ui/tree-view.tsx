"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface TreeNode {
  id: string
  label: string
  icon?: React.ReactNode
  children?: TreeNode[]
}

interface TreeViewProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  data: TreeNode[]
  onSelect?: (id: string) => void
  expandedIds?: Set<string>
  defaultExpandedIds?: Set<string>
}

function TreeView({
  className,
  data,
  onSelect,
  expandedIds: controlledExpandedIds,
  defaultExpandedIds,
  ...props
}: TreeViewProps) {
  const [internalExpandedIds, setInternalExpandedIds] = React.useState<Set<string>>(
    defaultExpandedIds ?? new Set()
  )
  const expandedIds = controlledExpandedIds ?? internalExpandedIds

  const toggle = React.useCallback(
    (id: string) => {
      if (!controlledExpandedIds) {
        setInternalExpandedIds((prev) => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
      }
    },
    [controlledExpandedIds]
  )

  return (
    <div data-slot="tree-view" role="tree" className={cn("text-sm", className)} {...props}>
      {data.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          level={0}
          expandedIds={expandedIds}
          onToggle={toggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function TreeNodeItem({
  node,
  level,
  expandedIds,
  onToggle,
  onSelect,
}: {
  node: TreeNode
  level: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onSelect?: (id: string) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedIds.has(node.id)

  return (
    <div data-slot="tree-node" role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted",
          "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        tabIndex={0}
        onClick={() => {
          if (hasChildren) onToggle(node.id)
          onSelect?.(node.id)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            if (hasChildren) onToggle(node.id)
            onSelect?.(node.id)
          }
        }}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-90"
            )}
          />
        ) : (
          <span className="size-4 shrink-0" />
        )}
        {node.icon && <span className="shrink-0 text-muted-foreground">{node.icon}</span>}
        <span className="truncate">{node.label}</span>
      </div>
      {hasChildren && isExpanded && (
        <div
          className="relative ml-[19px] border-l border-muted"
          style={{ marginLeft: `${level * 20 + 19}px` }}
        >
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export { TreeView, type TreeNode, type TreeViewProps }
