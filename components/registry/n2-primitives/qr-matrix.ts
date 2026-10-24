/**
 * qrMatrix — a QR code as one SVG path, for the Astro, React and server builds alike.
 *
 * The encoding is `uqr` (MIT, zero dependencies): this module only turns its module
 * matrix into a single `<path d>` on a `size`×`size` grid, one 1×1 square per dark
 * module, so the caller draws it with `fill="currentColor"` and the colour comes from
 * the theme (`text-foreground` on `bg-card`), never from a literal. The quiet zone is the
 * four modules ISO/IEC 18004 asks for, and error correction defaults to M (15%), which
 * survives a scuffed print or a cracked phone screen.
 *
 * Framework-free (no React, no Astro), so `address-share-card.astro` imports it flat
 * (`./qr-matrix`) and `address-share-card.tsx` imports it as `@/lib/qr-matrix`.
 */
import { encode } from "uqr"

export interface QrMatrix {
  /** Width and height of the grid in modules, quiet zone included. */
  size: number
  /** One path: a square per dark module. */
  d: string
}

export function qrMatrix(text: string, ecc: "L" | "M" | "Q" | "H" = "M"): QrMatrix {
  if (!text) throw new Error("qrMatrix: nothing to encode")
  const { data, size } = encode(text, { ecc, border: 4 })
  let d = ""
  for (let y = 0; y < size; y++) {
    const row = data[y] ?? []
    for (let x = 0; x < size; x++) if (row[x]) d += `M${x} ${y}h1v1h-1z`
  }
  return { size, d }
}
