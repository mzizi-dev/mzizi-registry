import * as React from "react"
import { cn } from "@/lib/utils"

interface AncestryMemorialProps extends React.ComponentProps<"div"> {
  name: string
  avatar?: string
  fixedAge: number
  dateOfPassing?: string
  heritageContributions?: number
  communityRole?: string
}

function AncestryMemorial({
  name,
  avatar,
  fixedAge,
  dateOfPassing,
  heritageContributions,
  communityRole,
  className,
  ...props
}: AncestryMemorialProps) {
  return (
    <div
      data-slot="ancestry-memorial"
      data-portal="https://mzizi.dev/components/ancestry-memorial"
      role="article"
      className={cn(
        "rounded-[var(--radius-lg,14px)] border border-border bg-card p-4",
        "bg-gradient-to-b from-card to-muted/30",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-medium opacity-80">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="size-full rounded-full object-cover grayscale"
              />
            ) : (
              name.charAt(0)
            )}
          </div>
          {/* Memorial ring */}
          <div className="absolute -inset-0.5 rounded-full border-2 border-[var(--color-terracotta,#D4A574)]/40" />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif, serif)" }}>
            {name}
          </div>
          <div className="text-xs text-muted-foreground">Age {fixedAge} · Ancestral</div>
          {communityRole && (
            <div className="text-[10px] text-[var(--color-terracotta,#D4A574)]">
              {communityRole}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {dateOfPassing && (
          <span>
            Passed{" "}
            {new Date(dateOfPassing).toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
        {heritageContributions !== undefined && (
          <span>{heritageContributions.toLocaleString()} heritage contributions</span>
        )}
      </div>
      <div className="mt-2 text-[10px] text-muted-foreground italic">
        "Their wisdom lives in the archive alongside every ancestor's, building a digital heritage
        for the continent."
      </div>
    </div>
  )
}

export { AncestryMemorial }
export type { AncestryMemorialProps }
