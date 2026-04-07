import * as React from "react"

import { cn } from "@/lib/utils"

interface ListingMetadata {
  label: string
  value: string
}

interface ListingCardProps {
  className?: string
  title: string
  description?: string
  image?: string
  metadata?: ListingMetadata[]
  badges?: string[]
  href?: string
}

function ListingCardContent({
  title,
  description,
  image,
  metadata,
  badges,
}: Pick<ListingCardProps, "title" | "description" | "image" | "metadata" | "badges">) {
  return (
    <>
      {image && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-medium">{title}</h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {metadata && metadata.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {metadata.map((item) => (
              <div key={item.label} className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">{item.label}:</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-4xl bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function ListingCard({
  className,
  title,
  description,
  image,
  metadata,
  badges,
  href,
}: ListingCardProps) {
  const sharedClasses = cn(
    "ring-foreground/10 bg-card group flex flex-col overflow-hidden rounded-2xl text-sm ring-1 transition-shadow hover:shadow-md",
    href && "cursor-pointer",
    className
  )

  if (href) {
    return (
      <a data-slot="listing-card" href={href} className={sharedClasses}>
        <ListingCardContent
          title={title}
          description={description}
          image={image}
          metadata={metadata}
          badges={badges}
        />
      </a>
    )
  }

  return (
    <div data-slot="listing-card" className={sharedClasses}>
      <ListingCardContent
        title={title}
        description={description}
        image={image}
        metadata={metadata}
        badges={badges}
      />
    </div>
  )
}

export { ListingCard, type ListingCardProps, type ListingMetadata }
