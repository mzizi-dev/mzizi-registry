"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type MemberRole = "admin" | "moderator" | "member"

interface Member {
  id: string
  name: string
  avatar?: string
  role: MemberRole
  online?: boolean
  joinedAt?: string
}

interface MemberListProps extends React.ComponentProps<"div"> {
  members: Member[]
  onMemberClick?: (id: string) => void
  showSearch?: boolean
}

const roleStyles: Record<MemberRole, string> = {
  admin: "bg-[var(--color-tanzanite,#B388FF)]/15 text-[var(--color-tanzanite,#B388FF)]",
  moderator: "bg-[var(--color-cobalt,#00B0FF)]/15 text-[var(--color-cobalt,#00B0FF)]",
  member: "bg-transparent text-transparent",
}

function MemberList({
  members,
  onMemberClick,
  showSearch = true,
  className,
  ...props
}: MemberListProps) {
  const [search, setSearch] = React.useState("")
  const filtered = members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
  const grouped = {
    admin: filtered.filter((m) => m.role === "admin"),
    moderator: filtered.filter((m) => m.role === "moderator"),
    member: filtered.filter((m) => m.role === "member"),
  }

  return (
    <div
      data-slot="member-list"
      data-portal="https://mzizi.dev/components/member-list"
      role="list"
      aria-label="Members"
      className={cn("", className)}
      {...props}
    >
      {showSearch && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="mb-3 h-10 w-full rounded-full border border-input bg-input/30 px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
        />
      )}
      <div className="mb-2 text-[10px] text-muted-foreground">{filtered.length} members</div>
      {(["admin", "moderator", "member"] as MemberRole[]).map(
        (role) =>
          grouped[role].length > 0 && (
            <div key={role} className="mb-3">
              {role !== "member" && (
                <div className="mb-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  {role}s — {grouped[role].length}
                </div>
              )}
              <div className="space-y-0.5">
                {grouped[role].map((member) => (
                  <button
                    key={member.id}
                    onClick={() => onMemberClick?.(member.id)}
                    className="flex w-full items-center gap-2.5 rounded-[var(--radius-md,12px)] px-2 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <div className="relative">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt=""
                            className="size-full rounded-full object-cover"
                          />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      {member.online && (
                        <div className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background bg-[var(--color-malachite,#64FFDA)]" />
                      )}
                    </div>
                    <span className="flex-1 truncate text-sm">{member.name}</span>
                    {role !== "member" && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize",
                          roleStyles[role]
                        )}
                      >
                        {role}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
      )}
    </div>
  )
}

export { MemberList }
export type { MemberListProps }
