import * as React from "react"
import { cn } from "@/lib/utils"

interface AuthorBioCardProps extends React.ComponentProps<"div"> {
  name: string
  avatar?: string
  bio?: string
  worksCount?: number
  subscriberCount?: number
  revenueSharePct?: number
  verified?: boolean
  verificationTier?: 0 | 1 | 2 | 3 | 4
  onFollow?: () => void
  isFollowing?: boolean
}

function AuthorBioCard({
  name,
  avatar,
  bio,
  worksCount,
  subscriberCount,
  revenueSharePct,
  verified,
  verificationTier,
  onFollow,
  isFollowing,
  className,
  ...props
}: AuthorBioCardProps) {
  return (
    <div
      data-slot="author-bio-card"
      data-portal="https://mzizi.dev/components/author-bio-card"
      role="article"
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {avatar ? (
            <img src={avatar} alt={name} className="size-full rounded-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-serif, serif)" }}
            >
              {name}
            </span>
            {/* `verificationTier` was destructured and never read, so an author
                carrying a tier but no `verified` flag showed as unverified.
                Tier > 0 means verified, matching `user-management-row`. */}
            {(verified || (verificationTier !== undefined && verificationTier > 0)) && (
              <span
                className="text-xs text-[var(--color-gold,#FFD740)]"
                title={verificationTier ? `Verification tier ${verificationTier}` : "Verified"}
              >
                ✓
              </span>
            )}
          </div>
          {bio && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{bio}</p>}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {worksCount !== undefined && <span>{worksCount} works</span>}
            {subscriberCount !== undefined && (
              <span>{subscriberCount.toLocaleString()} subscribers</span>
            )}
            {revenueSharePct !== undefined && (
              <span className="text-[var(--color-malachite,#64FFDA)]">
                {revenueSharePct}% revenue share
              </span>
            )}
          </div>
        </div>
        {onFollow && (
          <button
            onClick={onFollow}
            className={cn(
              "h-8 shrink-0 rounded-full px-4 text-xs font-medium",
              isFollowing
                ? "border border-border text-muted-foreground transition-colors hover:bg-muted"
                : "bg-primary text-primary-foreground"
            )}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
    </div>
  )
}

export { AuthorBioCard }
export type { AuthorBioCardProps }
