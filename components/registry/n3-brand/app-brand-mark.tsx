/**
 * BrandMark (React) — an ecosystem brand's official mark, with its wordmark
 * when asked. The images are the official bundu-ecosystem-icons pair
 * (./assets/nyuchi-mark-{light,dark}.png, ./assets/mukoko-icon-{light,dark}.png;
 * Kweli, which has no bundu-ecosystem-icons pair, uses its own shipped mark,
 * ./assets/kweli-mark-{light,dark}.png, mono in malachite),
 * scaled to 128px and never redrawn: both marks are in
 * the page and CSS shows the one that fits the theme (`[data-theme="dark"]`,
 * `.dark`, or the system setting), so it needs no script.
 *
 * The wordmark is the brand name in lower case in the serif face, with an
 * optional muted suffix ("console"). The mark alone carries the brand's name
 * as its alt text unless `decorative` or with the wordmark. `tagline` sets a
 * muted line under the wordmark for a mini-app lockup (Kweli: "mukoko · Africa").
 *
 * The PNGs are module imports relative to this file, as in the Astro build:
 * a bundler yields a URL string (Vite) or a `{ src }` object (Next), and both
 * are accepted. Install the assets/ folder beside this file.
 *
 * Implements contract `app/brand-mark` beside `app-brand-mark.astro`.
 */
import mukokoDark from "./assets/mukoko-icon-dark.png"
import mukokoLight from "./assets/mukoko-icon-light.png"
import kweliDark from "./assets/kweli-mark-dark.png"
import kweliLight from "./assets/kweli-mark-light.png"
import nyuchiDark from "./assets/nyuchi-mark-dark.png"
import nyuchiLight from "./assets/nyuchi-mark-light.png"

type ImageImport = string | { src: string }

const MARKS = {
  nyuchi: { name: "nyuchi", light: nyuchiLight as ImageImport, dark: nyuchiDark as ImageImport },
  mukoko: { name: "mukoko", light: mukokoLight as ImageImport, dark: mukokoDark as ImageImport },
  kweli: { name: "kweli", light: kweliLight as ImageImport, dark: kweliDark as ImageImport },
} as const

type BrandName = keyof typeof MARKS

interface BrandMarkProps {
  brand?: BrandName
  /** Rendered size of the mark in CSS pixels. */
  size?: number
  wordmark?: boolean
  suffix?: string
  /** A muted line under the wordmark (a mini-app lockup: "mukoko · Africa"). Needs `wordmark`. */
  tagline?: string
  decorative?: boolean
  /**
   * How the mark loads: "lazy" (the default since #543) or "eager". Lazy keeps a footer or
   * below-the-fold mark off the critical path (Lighthouse flagged an eager footer mark), and
   * the theme's hidden image is never fetched. A small mark in a header still loads at once,
   * since it is in the viewport; pass "eager" only where the mark is the page's LCP image.
   */
  loading?: "lazy" | "eager"
  className?: string
}

const CSS = `
[data-theme="dark"] [data-slot="brand-mark"] .brand-mark-light,
.dark [data-slot="brand-mark"] .brand-mark-light {
  display: none;
}
[data-theme="dark"] [data-slot="brand-mark"] .brand-mark-dark,
.dark [data-slot="brand-mark"] .brand-mark-dark {
  display: block;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not(.light) [data-slot="brand-mark"] .brand-mark-light {
    display: none;
  }
  :root:not([data-theme="light"]):not(.light) [data-slot="brand-mark"] .brand-mark-dark {
    display: block;
  }
}
`

const src = (m: ImageImport) => (typeof m === "string" ? m : m.src)

function BrandMark({ brand = "nyuchi", size = 28, wordmark = false, suffix, tagline, decorative = false, loading = "lazy", className }: BrandMarkProps) {
  // An unknown brand (from untyped data, or one whose icon pair has not shipped) is an error
  // that names it, never another brand's mark in its place.
  if (!Object.prototype.hasOwnProperty.call(MARKS, brand))
    throw new Error(`BrandMark: unknown brand ${JSON.stringify(brand)}; expected one of ${Object.keys(MARKS).map((b) => JSON.stringify(b)).join(", ")}`)
  const mark = MARKS[brand]
  const alt = decorative || wordmark ? "" : mark.name
  const word = (
    <span data-slot="brand-wordmark" className="truncate font-serif text-body font-semibold tracking-tight lowercase">
      {mark.name}
      {suffix && <span className="font-normal text-muted-foreground">{` ${suffix}`}</span>}
    </span>
  )
  return (
    <span className={["inline-flex min-w-0 items-center gap-2", className].filter(Boolean).join(" ")} data-slot="brand-mark" data-brand={brand}>
      <style href="mzizi-app-brand-mark" precedence="default">
        {CSS}
      </style>
      <img src={src(mark.light)} alt={alt} width={size} height={size} loading={loading} decoding="async" className="brand-mark-light block shrink-0" />
      <img src={src(mark.dark)} alt={alt} width={size} height={size} loading={loading} decoding="async" className="brand-mark-dark hidden shrink-0" />
      {wordmark && !tagline && word}
      {wordmark && tagline && (
        <span data-slot="brand-lockup" className="flex min-w-0 flex-col gap-0.5 leading-none">
          {word}
          <span data-slot="brand-tagline" className="truncate text-caption tracking-wide text-muted-foreground">
            {tagline}
          </span>
        </span>
      )}
    </span>
  )
}

export { BrandMark, type BrandMarkProps, type BrandName }
