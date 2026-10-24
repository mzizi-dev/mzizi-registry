/**
 * AddressShareCard — an address to hand to someone: a QR code that opens it, the code in
 * the mono face, the share link written out, and the directions in words. The React
 * build of contract `ui/address-share-card`, beside `address-share-card.astro`: the same
 * markup, the QR drawn server-side as one SVG path in `currentColor` (`@/lib/qr-matrix`), on a
 * `surface-qr` plate that stays white in every theme, so the code is never inverted (#543).
 */
import { AddressCode } from "@/components/ui/address-code"
import { qrMatrix } from "@/lib/qr-matrix"
import { cn } from "@/lib/utils"

export interface AddressShareCardProps {
  /** The address code, e.g. "NYU-7K2Q". */
  code: string
  /** The share link the QR encodes, e.g. "https://kweli.mukoko.com/a/NYU-7K2Q". */
  url: string
  /** Whose or which address: "Tendai's stall". */
  title?: string
  /** How to find the entrance, in words. */
  directions?: string
  /**
   * What the code is, for assistive technology: the address code chip's `label` ("Address" by
   * default; "Delivery code", or the app's own language).
   */
  codeLabel?: string
  className?: string
}

export function AddressShareCard({ code, url, title, directions, codeLabel, className }: AddressShareCardProps) {
  const qr = qrMatrix(url)
  const shown = url.replace(/^https?:\/\//, "")
  return (
    <article
      data-slot="address-share-card"
      data-portal="https://mzizi.dev/components/address-share-card"
      className={cn(
        "flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center text-card-foreground",
        className
      )}
    >
      {title && (
        <h3 data-slot="address-share-card-title" className="font-serif text-h5 font-semibold text-foreground">
          {title}
        </h3>
      )}
      <span data-slot="address-qr-plate" className="block rounded-md bg-surface-qr p-3 text-on-surface-qr">
        <svg
          data-slot="address-qr"
          role="img"
          aria-label={`QR code that opens ${url}`}
          viewBox={`0 0 ${qr.size} ${qr.size}`}
          shapeRendering="crispEdges"
          className="block size-48"
        >
          <path fill="currentColor" d={qr.d} />
        </svg>
      </span>
      <AddressCode code={code} label={codeLabel} />
      <a
        href={url}
        data-slot="address-share-card-link"
        className="inline-flex min-h-11 max-w-full items-center rounded-full px-3 text-body-sm font-medium break-all text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {shown}
      </a>
      {directions && (
        <p data-slot="address-share-card-directions" className="text-body-sm text-muted-foreground">
          {directions}
        </p>
      )}
    </article>
  )
}
