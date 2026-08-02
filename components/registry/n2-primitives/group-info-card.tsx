import * as React from "react"
import { cn } from "@/lib/utils"

type CirclePrivacy = "public" | "private" | "secret"

interface GroupInfoCardProps extends React.ComponentProps<"div"> {
  name: string
  coverImage?: string
  description?: string
  memberCount: number
  privacy?: CirclePrivacy
  category?: string
  adminNames?: string[]
  rules?: string[]
  onJoin?: () => void
  isMember?: boolean
}

function GroupInfoCard({
  name,
  coverImage,
  description,
  memberCount,
  privacy = "public",
  category,
  adminNames,
  rules,
  onJoin,
  isMember,
  className,
  ...props
}: GroupInfoCardProps) {
  return (
    <div
      data-slot="group-info-card"
      data-portal="https://mzizi.dev/components/group-info-card"
      role="article"
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl,17px)] border border-border bg-card",
        className
      )}
      {...props}
    >
      {coverImage && (
        <div className="h-24 bg-muted">
          <img src={coverImage} alt="" className="size-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3
              className="text-base font-semibold"
              style={{ fontFamily: "var(--font-serif, serif)" }}
            >
              {name}
            </h3>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="capitalize">{privacy}</span>
              <span>·</span>
              <span>{memberCount.toLocaleString()} members</span>
              {category && (
                <>
                  <span>·</span>
                  <span>{category}</span>
                </>
              )}
            </div>
          </div>
          {onJoin && (
            <button
              onClick={onJoin}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-xs font-medium",
                isMember
                  ? "border border-border text-muted-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {isMember ? "Joined" : "Join"}
            </button>
          )}
        </div>
        {description && (
          <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{description}</p>
        )}
        {adminNames && adminNames.length > 0 && (
          <div className="mt-3 text-[10px] text-muted-foreground">
            Admins: {adminNames.join(", ")}
          </div>
        )}
        {/* `rules` was declared and destructured but never rendered — a group's
            rules are the one thing a prospective member needs before joining,
            and the card dropped them silently. */}
        {rules && rules.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-medium text-muted-foreground">Group rules</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[10px] text-muted-foreground">
              {rules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

export { GroupInfoCard }
export type { GroupInfoCardProps }
