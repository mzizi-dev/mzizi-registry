"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type MineralColor = "cobalt" | "tanzanite" | "malachite" | "gold" | "terracotta"

interface CategoryItem {
  name: string
  icon?: React.ReactNode
  count?: number
  href?: string
  mineral?: MineralColor
}

interface CategoryBrowserProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  categories: CategoryItem[]
  onSelect?: (name: string) => void
}

const MINERAL_STYLES: Record<MineralColor, { bg: string; text: string; border: string }> = {
  cobalt: {
    bg: "bg-mineral-cobalt/10 dark:bg-mineral-cobalt/20",
    text: "text-mineral-cobalt",
    border: "border-mineral-cobalt/20",
  },
  tanzanite: {
    bg: "bg-mineral-tanzanite/10 dark:bg-mineral-tanzanite/20",
    text: "text-mineral-tanzanite",
    border: "border-mineral-tanzanite/20",
  },
  malachite: {
    bg: "bg-mineral-malachite/10 dark:bg-mineral-malachite/20",
    text: "text-mineral-malachite",
    border: "border-mineral-malachite/20",
  },
  gold: {
    bg: "bg-mineral-gold/10 dark:bg-mineral-gold/20",
    text: "text-mineral-gold",
    border: "border-mineral-gold/20",
  },
  terracotta: {
    bg: "bg-mineral-terracotta/10 dark:bg-mineral-terracotta/20",
    text: "text-mineral-terracotta",
    border: "border-mineral-terracotta/20",
  },
}

function CategoryBrowser({ className, categories, onSelect, ...props }: CategoryBrowserProps) {
  return (
    <div
      data-slot="category-browser"
      className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4", className)}
      {...props}
    >
      {categories.map((category) => {
        const mineral = category.mineral ?? "cobalt"
        const styles = MINERAL_STYLES[mineral]
        const Comp = category.href ? "a" : "button"

        return (
          <Comp
            key={category.name}
            data-slot="category-card"
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:shadow-sm",
              styles.bg,
              styles.border
            )}
            {...(category.href
              ? { href: category.href }
              : { type: "button" as const, onClick: () => onSelect?.(category.name) })}
          >
            {category.icon && <div className={cn("text-2xl", styles.text)}>{category.icon}</div>}
            <span className="text-sm font-medium">{category.name}</span>
            {category.count !== undefined && (
              <span className={cn("text-xs font-medium", styles.text)}>{category.count}</span>
            )}
          </Comp>
        )
      })}
    </div>
  )
}

export { CategoryBrowser, type CategoryItem, type CategoryBrowserProps, type MineralColor }
