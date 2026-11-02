/**
 * AddressCode — a Kweli address code as a chip: the code in the mono face, and a link
 * that opens the address. The React build of contract `ui/address-code`, beside
 * `address-code.astro`: the same markup and classes, server-rendered, no script.
 */
import { cn } from "@/lib/utils"

export interface AddressCodeProps {
  /** The address code, e.g. "NYU-7K2Q". */
  code: string
  /** Where the code resolves, e.g. "https://kweli.mukoko.com/a/NYU-7K2Q". No link without it. */
  href?: string
  /** The link's visible text. */
  linkLabel?: string
  /** What the code is, for assistive technology. */
  label?: string
  className?: string
}

export function AddressCode({ code, href, linkLabel = "Open", label = "Address", className }: AddressCodeProps) {
  return (
    <span
      data-slot="address-code"
      data-portal="https://mzizi.dev/components/address-code"
      className={cn(
        "inline-flex min-h-11 max-w-full min-w-0 items-center gap-1 rounded-full border border-border bg-card ps-4 pe-1 text-foreground",
        !href && "pe-4",
        className
      )}
    >
      <span className="sr-only">{label}</span>
      <code data-slot="address-code-value" className="truncate font-mono text-body-sm font-medium tracking-wider">
        {code}
      </code>
      {href && (
        <a
          href={href}
          data-slot="address-code-link"
          aria-label={`${linkLabel} ${label.toLowerCase()} ${code}`}
          className="inline-flex h-11 shrink-0 items-center rounded-full px-3 text-body-sm font-medium text-primary no-underline outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {linkLabel}
        </a>
      )}
    </span>
  )
}
