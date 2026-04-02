import * as React from "react"
import { Copy, ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"

interface PropertyItem {
  label: string
  value: React.ReactNode
  copyable?: string
  href?: string
}

interface PropertyListProps extends React.ComponentProps<"dl"> {
  items: PropertyItem[]
}

function PropertyList({ className, items, ...props }: PropertyListProps) {
  return (
    <dl
      data-slot="property-list"
      className={cn("divide-border divide-y text-sm", className)}
      {...props}
    >
      {items.map((item) => (
        <PropertyListItem key={item.label} item={item} />
      ))}
    </dl>
  )
}

function PropertyListItem({ item }: { item: PropertyItem }) {
  return (
    <div
      data-slot="property-list-item"
      className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
    >
      <dt className="text-muted-foreground shrink-0">{item.label}</dt>
      <dd className="flex items-center gap-1.5 text-right font-medium">
        {item.href ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 hover:underline"
          >
            {item.value}
            <ExternalLink className="size-3" />
          </a>
        ) : (
          <span>{item.value}</span>
        )}
        {item.copyable && <CopyButton text={item.copyable} />}
      </dd>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground inline-flex shrink-0 transition-colors"
      aria-label={`Copy ${text}`}
      onClick={() => navigator.clipboard?.writeText(text)}
    >
      <Copy className="size-3.5" />
    </button>
  )
}

export { PropertyList, type PropertyItem, type PropertyListProps }
