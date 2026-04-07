"use client"

import * as React from "react"
import { Minus, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"

function CartItem({
  title,
  image,
  price,
  currency = "USD",
  quantity,
  onQuantityChange,
  onRemove,
  className,
  ...props
}: {
  title: string
  image: string
  price: number
  currency?: string
  quantity: number
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
} & React.ComponentProps<"div">) {
  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency })

  return (
    <div
      data-slot="cart-item"
      className={cn(
        "flex items-center gap-4 border-b border-border py-4 last:border-b-0",
        className
      )}
      {...props}
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        <img src={image} alt={title} className="size-full object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h4 className="truncate text-sm font-medium text-foreground">{title}</h4>
        <span className="text-sm text-muted-foreground">{formatter.format(price)} each</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          aria-label="Decrease quantity"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
        <button
          type="button"
          onClick={() => onQuantityChange(quantity + 1)}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Increase quantity"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <span className="w-20 text-right text-sm font-semibold tabular-nums">
        {formatter.format(price * quantity)}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-destructive"
        aria-label={`Remove ${title}`}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}

export { CartItem }
