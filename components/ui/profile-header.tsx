import * as React from "react"

import { cn } from "@/lib/utils"

interface ProfileStat {
  label: string
  value: string | number
}

interface ProfileHeaderProps extends React.ComponentProps<"div"> {
  name: string
  bio?: string
  avatar?: string
  coverImage?: string
  stats?: ProfileStat[]
  actions?: React.ReactNode
}

function ProfileHeader({
  className,
  name,
  bio,
  avatar,
  coverImage,
  stats,
  actions,
  ...props
}: ProfileHeaderProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      data-slot="profile-header"
      className={cn("overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10", className)}
      {...props}
    >
      {/* Cover image */}
      <div className="relative h-32 bg-muted sm:h-40">
        {coverImage && <img src={coverImage} alt="" className="size-full object-cover" />}
      </div>
      {/* Profile info */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="-mt-12 size-24 overflow-hidden rounded-full ring-4 ring-card">
          {avatar ? (
            <img src={avatar} alt={name} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted text-2xl font-medium text-muted-foreground">
              {initials}
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{name}</h2>
            {bio && <p className="mt-1 text-sm text-muted-foreground">{bio}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {/* Stats */}
        {stats && stats.length > 0 && (
          <div className="mt-4 flex gap-6 border-t border-border pt-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { ProfileHeader, type ProfileHeaderProps, type ProfileStat }
