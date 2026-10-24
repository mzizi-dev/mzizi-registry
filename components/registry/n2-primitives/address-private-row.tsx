/**
 * AddressPrivateRow — one of your own private addresses in a list: a lock, the name, the
 * Kweli code in the mono face, who can open it (in words), and a manage link. The React
 * build of contract `ui/address-private-row`, beside `address-private-row.astro`.
 */
import { cn } from "@/lib/utils"

export interface AddressPrivateRowProps {
  /** "Home", "Mum's place". */
  label: string
  /** The Kweli address code. */
  code: string
  /** Who can open it. */
  visibility?: "private" | "link"
  /** A line under the code: "Opened 3 times this week". */
  detail?: string
  /** Where the owner manages it. */
  href?: string
  linkLabel?: string
  className?: string
}

export function AddressPrivateRow({
  label,
  code,
  visibility = "private",
  detail,
  href,
  linkLabel = "Manage",
  className,
}: AddressPrivateRowProps) {
  const who = visibility === "link" ? "Link only" : "Private"
  return (
    <div
      data-slot="address-private-row"
      data-portal="https://mzizi.dev/components/address-private-row"
      data-visibility={visibility}
      className={cn(
        "flex min-h-14 w-full min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-foreground",
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5 shrink-0 text-muted-foreground"
      >
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="truncate text-body-sm font-medium">{label}</span>
          <span data-slot="address-private-row-visibility" className="shrink-0 text-caption text-muted-foreground">
            {who}
          </span>
        </span>
        <code data-slot="address-private-row-code" className="truncate font-mono text-caption tracking-wider text-muted-foreground">
          {code}
        </code>
        {detail && (
          <span data-slot="address-private-row-detail" className="truncate text-caption text-muted-foreground">
            {detail}
          </span>
        )}
      </span>
      {href && (
        <a
          href={href}
          data-slot="address-private-row-link"
          aria-label={`${linkLabel} ${label}`}
          className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-body-sm font-medium text-primary no-underline outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {linkLabel}
        </a>
      )}
    </div>
  )
}
