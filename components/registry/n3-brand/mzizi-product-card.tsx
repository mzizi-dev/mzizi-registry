import * as React from "react"

import { cn } from "@/lib/utils"

function ProductCard({
  title,
  image,
  price,
  currency = "USD",
  originalPrice,
  badge,
  className,
  ...props
}: {
  title: string
  image: string
  price: number
  currency?: string
  originalPrice?: number
  badge?: string
} & React.ComponentProps<"div">) {
  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency })

  return (
    <div
      data-slot="product-card"
      className={cn(
        "group/product flex flex-col overflow-hidden rounded-2xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-md",
        className
      )}
      {...props}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="size-full object-cover transition-transform group-hover/product:scale-105"
        />
        {badge && (
          <span className="absolute top-3 left-3 rounded-4xl bg-[var(--color-cobalt)] px-2.5 py-0.5 text-xs font-medium text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-foreground">{formatter.format(price)}</span>
          {originalPrice != null && originalPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatter.format(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export { ProductCard }
