import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const featuredCardVariants = cva(
  "ring-foreground/10 bg-card text-card-foreground group/featured relative flex flex-col overflow-hidden rounded-2xl ring-1 transition-shadow hover:shadow-lg",
  {
    variants: {
      mineral: {
        cobalt: "border-l-4 border-l-[var(--color-cobalt)]",
        tanzanite: "border-l-4 border-l-[var(--color-tanzanite)]",
        malachite: "border-l-4 border-l-[var(--color-malachite)]",
        gold: "border-l-4 border-l-[var(--color-gold)]",
        terracotta: "border-l-4 border-l-[var(--color-terracotta)]",
      },
    },
    defaultVariants: {
      mineral: "cobalt",
    },
  }
)

interface FeaturedCardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof featuredCardVariants> {
  title: string
  description?: string
  image?: string
  badge?: string
  href?: string
}

function FeaturedCard({
  title,
  description,
  image,
  badge,
  href,
  mineral = "cobalt",
  className,
  ...props
}: FeaturedCardProps) {
  const Wrapper = href ? "a" : "div"
  const linkProps = href ? { href } : {}

  return (
    <Wrapper
      {...linkProps}
      data-slot="featured-card"
      data-mineral={mineral}
      className={cn(featuredCardVariants({ mineral, className }))}
      {...(props as React.ComponentProps<"div">)}
    >
      {image && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={image}
            alt={title}
            className="size-full object-cover transition-transform duration-300 group-hover/featured:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-6">
        {badge && (
          <Badge variant="secondary" className="w-fit">
            {badge}
          </Badge>
        )}
        <h3 className="font-serif text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {description}
          </p>
        )}
      </div>
    </Wrapper>
  )
}

export { FeaturedCard, featuredCardVariants }
export type { FeaturedCardProps }
