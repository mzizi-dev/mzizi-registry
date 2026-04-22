import { cn } from "@/lib/utils"

export interface NyuchiLogoProps {
  size?: number
  /**
   * When `true`, render the wordmark text alongside the icon. The Nextra
   * navbar already prints the site title from metadata, so the navbar logo
   * passes `false` (default) — this avoids the duplicate-wordmark bug seen
   * on desktop. Other surfaces (e.g. landing footer/header) can opt in.
   */
  showWordmark?: boolean
  /** Optional secondary word displayed in muted colour after "nyuchi". */
  suffix?: string
  className?: string
}

/**
 * Minimal brand mark for the design portal header. Self-contained — the full
 * brand mark library now lives in the registry (`nyuchi-logo`, `mukoko-logo`,
 * etc.) and is consumed by downstream apps via `npx shadcn add`. This copy is
 * only what the portal itself renders.
 */
export function NyuchiLogo({
  size = 24,
  showWordmark = false,
  suffix,
  className,
}: NyuchiLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-serif font-semibold whitespace-nowrap",
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="8.5" x2="22" y2="8.5" />
        <line x1="2" y1="15.5" x2="22" y2="15.5" />
      </svg>
      {showWordmark && (
        <>
          <span className="tracking-tight lowercase">nyuchi</span>
          {suffix && (
            <span className="tracking-tight text-muted-foreground lowercase">{suffix}</span>
          )}
        </>
      )}
    </span>
  )
}
