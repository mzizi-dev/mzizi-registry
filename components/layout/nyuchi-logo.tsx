import { cn } from "@/lib/utils"

export interface NyuchiLogoProps {
  size?: number
  /** When `true`, render the wordmark text alongside the icon. */
  showWordmark?: boolean
  /** Optional secondary word displayed in muted colour after "nyuchi". */
  suffix?: string
  /** Override the domain Brandfetch fetches from. Defaults to `nyuchi.com`. */
  domain?: string
  className?: string
}

const BRANDFETCH_DOMAIN = "cdn.brandfetch.io"
const CLIENT_ID = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID

/**
 * Build the Brandfetch Logo Link CDN URL.
 *
 * Docs: https://docs.brandfetch.com/reference/logo-link
 * Pattern: https://cdn.brandfetch.io/{domain}/w/{w}/h/{h}?c={clientId}
 *
 * Returns null when the client ID env var is missing so callers can fall
 * back to the inline SVG. Keeping the client ID server-side only isn't
 * practical here because the URL lives on the `<img src>` which the
 * browser must resolve — Brandfetch intends this to be a public ID.
 */
function brandfetchLogoUrl(domain: string, size: number): string | null {
  if (!CLIENT_ID) return null
  const px = Math.max(16, Math.round(size))
  return `https://${BRANDFETCH_DOMAIN}/${encodeURIComponent(domain)}/w/${px}/h/${px}?c=${encodeURIComponent(
    CLIENT_ID
  )}`
}

/**
 * Minimal brand mark for the design portal header.
 *
 * When `NEXT_PUBLIC_BRANDFETCH_CLIENT_ID` is configured, the logo is
 * pulled live from Brandfetch's Logo Link CDN (theme-aware, always the
 * latest brand asset). Otherwise the component falls back to a
 * hexagon-and-crosshair inline SVG so the portal still renders during
 * local development or when Brandfetch is unreachable.
 */
export function NyuchiLogo({
  size = 24,
  showWordmark = false,
  suffix,
  domain = "nyuchi.com",
  className,
}: NyuchiLogoProps) {
  const remoteUrl = brandfetchLogoUrl(domain, size)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-serif font-semibold whitespace-nowrap",
        className
      )}
    >
      {remoteUrl ? (
        // Brandfetch CDN — cached at their edge, theme-aware.
        // `next.config.mjs` sets `images.unoptimized: true`, so using a
        // plain <img> is consistent with how the rest of the portal
        // handles external assets.
        <img
          src={remoteUrl}
          alt={`${domain.split(".")[0]} logo`}
          width={size}
          height={size}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          className="block shrink-0"
        />
      ) : (
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
      )}
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
