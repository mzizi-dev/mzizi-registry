/**
 * BrandMark (React) — an ecosystem brand's official mark, with its wordmark
 * when asked. The images are the official bundu-ecosystem-icons pair
 * (./assets/<brand>-mark-{light,dark}.png), never redrawn: both marks are in
 * the page and CSS shows the one that fits the theme (`[data-theme="dark"]`,
 * `.dark`, or the system setting), so it needs no script.
 *
 * The wordmark is the brand name in lower case in the serif face, with an
 * optional muted suffix ("console"). The mark alone carries the brand's name
 * as its alt text unless `decorative` or with the wordmark.
 *
 * The PNGs are module imports relative to this file, as in the Astro build:
 * a bundler yields a URL string (Vite) or a `{ src }` object (Next), and both
 * are accepted. Install the assets/ folder beside this file.
 *
 * Implements contract `app/brand-mark` beside `app-brand-mark.astro`.
 */
import nyuchiDark from "./assets/nyuchi-mark-dark.png"
import nyuchiLight from "./assets/nyuchi-mark-light.png"

type ImageImport = string | { src: string }

const MARKS = {
  nyuchi: { name: "nyuchi", light: nyuchiLight as ImageImport, dark: nyuchiDark as ImageImport },
} as const

type BrandName = keyof typeof MARKS

interface BrandMarkProps {
  brand?: BrandName
  /** Rendered size of the mark in CSS pixels. */
  size?: number
  wordmark?: boolean
  suffix?: string
  decorative?: boolean
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

function BrandMark({ brand = "nyuchi", size = 28, wordmark = false, suffix, decorative = false, className }: BrandMarkProps) {
  const mark = MARKS[brand]
  const alt = decorative || wordmark ? "" : mark.name
  return (
    <span className={["inline-flex min-w-0 items-center gap-2", className].filter(Boolean).join(" ")} data-slot="brand-mark" data-brand={brand}>
      <style href="mzizi-app-brand-mark" precedence="default">
        {CSS}
      </style>
      <img src={src(mark.light)} alt={alt} width={size} height={size} decoding="async" className="brand-mark-light block shrink-0" />
      <img src={src(mark.dark)} alt={alt} width={size} height={size} decoding="async" className="brand-mark-dark hidden shrink-0" />
      {wordmark && (
        <span data-slot="brand-wordmark" className="truncate font-serif text-body font-semibold tracking-tight lowercase">
          {mark.name}
          {suffix && <span className="font-normal text-muted-foreground">{` ${suffix}`}</span>}
        </span>
      )}
    </span>
  )
}

export { BrandMark, type BrandMarkProps, type BrandName }
