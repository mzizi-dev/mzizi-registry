import * as React from "react"

import { cn } from "@/lib/utils"

interface UserCardProps extends React.ComponentProps<"div"> {
  name: string
  email?: string
  avatar?: string
  role?: string
  actions?: React.ReactNode
}

function UserCard({
  className,
  name,
  email,
  avatar,
  role,
  actions,
  ...props
}: UserCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      data-slot="user-card"
      className={cn(
        "ring-foreground/10 bg-card flex items-center gap-4 rounded-2xl p-4 text-sm ring-1",
        className
      )}
      {...props}
    >
      <div className="size-12 shrink-0 overflow-hidden rounded-full">
        {avatar ? (
          <img src={avatar} alt={name} className="size-full object-cover" />
        ) : (
          <div className="bg-muted text-muted-foreground flex size-full items-center justify-center text-base font-medium">
            {initials}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{name}</p>
          {role && (
            <span className="bg-primary/10 text-primary shrink-0 rounded-4xl px-2 py-0.5 text-xs font-medium">
              {role}
            </span>
          )}
        </div>
        {email && (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{email}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  )
}

export { UserCard, type UserCardProps }
