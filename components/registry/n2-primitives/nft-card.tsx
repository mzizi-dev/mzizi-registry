import * as React from "react"
import { cn } from "@/lib/utils"

type NftType = "ticket" | "badge" | "chapter" | "artwork" | "collectible"

interface NftCardProps extends React.ComponentProps<"div"> {
  name: string
  imageUrl?: string
  collection?: string
  tokenId?: string
  type?: NftType
  onClick?: () => void
}

const typeColors: Record<NftType, string> = {
  ticket: "bg-[var(--color-malachite,#64FFDA)]/15 text-[var(--color-malachite,#64FFDA)]",
  badge: "bg-[var(--color-gold,#FFD740)]/15 text-[var(--color-gold,#FFD740)]",
  chapter: "bg-[var(--color-tanzanite,#B388FF)]/15 text-[var(--color-tanzanite,#B388FF)]",
  artwork: "bg-[var(--color-cobalt,#00B0FF)]/15 text-[var(--color-cobalt,#00B0FF)]",
  collectible: "bg-[var(--color-terracotta,#D4A574)]/15 text-[var(--color-terracotta,#D4A574)]",
}

function NftCard({
  name,
  imageUrl,
  collection,
  tokenId,
  type,
  onClick,
  className,
  ...props
}: NftCardProps) {
  return (
    <div
      data-slot="nft-card"
      data-portal="https://mzizi.dev/components/nft-card"
      className={cn(
        "group overflow-hidden rounded-[var(--radius-lg,14px)] border border-border bg-card",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      <div className="aspect-square bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-2xl text-muted-foreground">
            ◆
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <div className="line-clamp-1 text-sm font-medium">{name}</div>
          {type && (
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                typeColors[type]
              )}
            >
              {type}
            </span>
          )}
        </div>
        {collection && (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{collection}</div>
        )}
        {tokenId && (
          <div className="mt-1 font-mono text-[10px] text-muted-foreground">#{tokenId}</div>
        )}
      </div>
    </div>
  )
}

export { NftCard }
export type { NftCardProps }
