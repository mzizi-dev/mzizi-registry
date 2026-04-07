import * as React from "react"

import { cn } from "@/lib/utils"

interface AvatarGroupUser {
  name: string
  image?: string
}

interface AvatarGroupStackProps extends React.ComponentProps<"div"> {
  users: AvatarGroupUser[]
  max?: number
  size?: "sm" | "default" | "lg"
}

function AvatarGroupStack({
  className,
  users,
  max = 5,
  size = "default",
  ...props
}: AvatarGroupStackProps) {
  const displayed = users.slice(0, max)
  const remaining = users.length - max

  const sizeClasses = {
    sm: "size-6 text-[10px]",
    default: "size-8 text-xs",
    lg: "size-10 text-sm",
  }

  return (
    <div data-slot="avatar-group-stack" className={cn("flex -space-x-2", className)} {...props}>
      {displayed.map((user) => {
        const initials = user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()

        return (
          <div
            key={user.name}
            className={cn(
              "relative flex shrink-0 items-center justify-center rounded-full ring-2 ring-background",
              sizeClasses[size]
            )}
            title={user.name}
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground">
                {initials}
              </div>
            )}
          </div>
        )
      })}
      {remaining > 0 && (
        <div
          data-slot="avatar-group-overflow"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground ring-2 ring-background",
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}

export { AvatarGroupStack, type AvatarGroupUser, type AvatarGroupStackProps }
