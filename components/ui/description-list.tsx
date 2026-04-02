import * as React from "react"
import { Copy, Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface DescriptionItem {
  term: string
  detail: React.ReactNode
  copyable?: boolean
}

function CopyableDetail({ detail }: { detail: React.ReactNode }) {
  const [copied, setCopied] = React.useState(false)

  function handleCopy() {
    const text = typeof detail === "string" ? detail : String(detail)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {detail}
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Copy value"
      >
        {copied ? <Check className="size-3 text-[var(--color-malachite)]" /> : <Copy className="size-3" />}
      </button>
    </span>
  )
}

function DescriptionList({
  items,
  className,
  ...props
}: {
  items: DescriptionItem[]
} & React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="description-list"
      className={cn("grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr]", className)}
      {...props}
    >
      {items.map((item) => (
        <React.Fragment key={item.term}>
          <dt className="text-sm font-medium text-muted-foreground">{item.term}</dt>
          <dd className="text-sm text-foreground">
            {item.copyable ? <CopyableDetail detail={item.detail} /> : item.detail}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

export { DescriptionList, type DescriptionItem }
