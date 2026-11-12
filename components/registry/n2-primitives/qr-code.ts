/**
 * QR CODE — a framework-free QR Code encoder (ISO/IEC 18004, Model 2), for `device-code`
 * (contracts/ui/device-code) and any component that draws a QR code on the device.
 *
 * Why its own encoder: a QR code of a sign-in address must never go to a network service
 * (the address carries a one-time code), and the registry has no QR dependency. This file is
 * small, has no imports and runs anywhere TypeScript does (Astro at build or request time,
 * React on the server or in the browser, Workers).
 *
 * - Byte mode only (UTF-8), versions 1 to 40, error correction L, M, Q or H. Byte mode keeps
 *   the bits of a URL predictable; the smallest version that holds them is chosen.
 * - The mask is chosen by the same penalty scores as the `qrcode` Rust crate (which
 *   `device-code.rs` uses), so the Astro, React and Rust builds draw the SAME matrix for the
 *   same text. `__tests__/fixtures/device-code.cases.json` holds the cases both suites run.
 * - `qrPath` turns the matrix into SVG path data (one run of dark modules per subpath), so a
 *   component draws it with one `<path fill="currentColor">` and no inline style.
 */

/** Error-correction level: L (7%), M (15%), Q (25%) or H (30%) of codewords recoverable. */
export type QrEcc = "L" | "M" | "Q" | "H"

/** An encoded QR code: `size` × `size` modules, row-major, `true` is dark. */
export interface QrMatrix {
  size: number
  version: number
  ecc: QrEcc
  mask: number
  dark: boolean[]
}

const ECC_INDEX: Record<QrEcc, number> = { L: 0, M: 1, Q: 2, H: 3 }
/** The two format-information bits for each level (ISO/IEC 18004 Table 12). */
const ECC_FORMAT_BITS: Record<QrEcc, number> = { L: 1, M: 0, Q: 3, H: 2 }

// ISO/IEC 18004 Table 9, by level (L, M, Q, H) then version (index 0 unused).
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  [
    -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
  [
    -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
]
const ERROR_CORRECTION_BLOCKS: number[][] = [
  [
    -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19,
    19, 20, 21, 22, 24, 25,
  ],
  [
    -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33,
    35, 37, 38, 40, 43, 45, 47, 49,
  ],
  [
    -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43,
    45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  [
    -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51,
    54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
]

/** Modules available for data and error correction in a version (everything but function patterns). */
function rawDataModules(ver: number): number {
  let n = (16 * ver + 128) * ver + 64
  if (ver >= 2) {
    const align = Math.floor(ver / 7) + 2
    n -= (25 * align - 10) * align - 55
    if (ver >= 7) n -= 36
  }
  return n
}

function dataCodewords(ver: number, ecc: QrEcc): number {
  const e = ECC_INDEX[ecc]
  return Math.floor(rawDataModules(ver) / 8) - ECC_CODEWORDS_PER_BLOCK[e]![ver]! * ERROR_CORRECTION_BLOCKS[e]![ver]!
}

/** The bytes a version holds in byte mode: 4 mode bits, 8 or 16 count bits, then data. */
function byteCapacity(ver: number, ecc: QrEcc): number {
  const countBits = ver < 10 ? 8 : 16
  return Math.floor((dataCodewords(ver, ecc) * 8 - 4 - countBits) / 8)
}

// ─── Reed–Solomon over GF(256), polynomial 0x11D ────────────────────────────────────────────

function gfMul(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}

function rsDivisor(degree: number): number[] {
  const out = new Array<number>(degree).fill(0)
  out[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      out[j] = gfMul(out[j]!, root)
      if (j + 1 < degree) out[j] = out[j]! ^ out[j + 1]!
    }
    root = gfMul(root, 0x02)
  }
  return out
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const out = new Array<number>(divisor.length).fill(0)
  for (const b of data) {
    const factor = b ^ out.shift()!
    out.push(0)
    for (let i = 0; i < divisor.length; i++) out[i] = out[i]! ^ gfMul(divisor[i]!, factor)
  }
  return out
}

// ─── Codewords ──────────────────────────────────────────────────────────────────────────────

function dataBits(bytes: Uint8Array, ver: number, ecc: QrEcc): number[] {
  const bits: number[] = []
  const push = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  push(0b0100, 4)
  push(bytes.length, ver < 10 ? 8 : 16)
  for (const b of bytes) push(b, 8)
  const capacity = dataCodewords(ver, ecc) * 8
  push(0, Math.min(4, capacity - bits.length))
  push(0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8)
  const out: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j]!
    out.push(v)
  }
  return out
}

function withErrorCorrection(data: number[], ver: number, ecc: QrEcc): number[] {
  const e = ECC_INDEX[ecc]
  const blocks = ERROR_CORRECTION_BLOCKS[e]![ver]!
  const eccLen = ECC_CODEWORDS_PER_BLOCK[e]![ver]!
  const raw = Math.floor(rawDataModules(ver) / 8)
  const shortBlocks = blocks - (raw % blocks)
  const shortLen = Math.floor(raw / blocks)
  const divisor = rsDivisor(eccLen)
  const all: number[][] = []
  for (let i = 0, k = 0; i < blocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < shortBlocks ? 0 : 1))
    k += dat.length
    const ec = rsRemainder(dat, divisor)
    if (i < shortBlocks) dat.push(0)
    all.push(dat.concat(ec))
  }
  const out: number[] = []
  for (let i = 0; i < all[0]!.length; i++) {
    for (let j = 0; j < all.length; j++) {
      // The padding byte of each short block is not part of the stream.
      if (i !== shortLen - eccLen || j >= shortBlocks) out.push(all[j]![i]!)
    }
  }
  return out
}

// ─── The matrix ─────────────────────────────────────────────────────────────────────────────

class Grid {
  readonly dark: boolean[]
  readonly fixed: boolean[]
  constructor(readonly size: number) {
    this.dark = new Array<boolean>(size * size).fill(false)
    this.fixed = new Array<boolean>(size * size).fill(false)
  }
  get(x: number, y: number): boolean {
    return this.dark[y * this.size + x]!
  }
  setFixed(x: number, y: number, dark: boolean): void {
    this.dark[y * this.size + x] = dark
    this.fixed[y * this.size + x] = true
  }
}

function alignmentPositions(ver: number): number[] {
  if (ver === 1) return []
  const count = Math.floor(ver / 7) + 2
  const step = Math.floor((ver * 8 + count * 3 + 5) / (count * 4 - 4)) * 2
  const out = [6]
  for (let pos = ver * 4 + 17 - 7; out.length < count; pos -= step) out.splice(1, 0, pos)
  return out
}

function drawFunctionPatterns(g: Grid, ver: number): void {
  const n = g.size
  for (let i = 0; i < n; i++) {
    g.setFixed(6, i, i % 2 === 0)
    g.setFixed(i, 6, i % 2 === 0)
  }
  for (const [cx, cy] of [
    [3, 3],
    [n - 4, 3],
    [3, n - 4],
  ] as const) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx
        const y = cy + dy
        if (x < 0 || x >= n || y < 0 || y >= n) continue
        const d = Math.max(Math.abs(dx), Math.abs(dy))
        g.setFixed(x, y, d !== 2 && d !== 4)
      }
    }
  }
  const pos = alignmentPositions(ver)
  const last = pos.length - 1
  for (let i = 0; i <= last; i++) {
    for (let j = 0; j <= last; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          g.setFixed(pos[i]! + dx, pos[j]! + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
        }
      }
    }
  }
  drawFormat(g, "M", 0) // reserves the format area; redrawn once the mask is known
  if (ver >= 7) {
    let rem = ver
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const bits = (ver << 12) | rem
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >>> i) & 1) !== 0
      const a = n - 11 + (i % 3)
      const b = Math.floor(i / 3)
      g.setFixed(a, b, bit)
      g.setFixed(b, a, bit)
    }
  }
}

function drawFormat(g: Grid, ecc: QrEcc, mask: number): void {
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  const bits = ((data << 10) | rem) ^ 0x5412
  const bit = (i: number) => ((bits >>> i) & 1) !== 0
  const n = g.size
  for (let i = 0; i <= 5; i++) g.setFixed(8, i, bit(i))
  g.setFixed(8, 7, bit(6))
  g.setFixed(8, 8, bit(7))
  g.setFixed(7, 8, bit(8))
  for (let i = 9; i < 15; i++) g.setFixed(14 - i, 8, bit(i))
  for (let i = 0; i < 8; i++) g.setFixed(n - 1 - i, 8, bit(i))
  for (let i = 8; i < 15; i++) g.setFixed(8, n - 15 + i, bit(i))
  g.setFixed(8, n - 8, true)
}

function drawCodewords(g: Grid, codewords: number[]): void {
  const n = g.size
  let i = 0
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? n - 1 - vert : vert
        const at = y * n + x
        if (!g.fixed[at] && i < codewords.length * 8) {
          g.dark[at] = ((codewords[i >>> 3]! >>> (7 - (i & 7))) & 1) !== 0
          i++
        }
      }
    }
  }
}

function maskBit(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0
    case 1:
      return y % 2 === 0
    case 2:
      return x % 3 === 0
    case 3:
      return (x + y) % 3 === 0
    case 4:
      return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
  }
}

function applyMask(g: Grid, mask: number): void {
  const n = g.size
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const at = y * n + x
      if (!g.fixed[at] && maskBit(mask, x, y)) g.dark[at] = !g.dark[at]
    }
  }
}

/**
 * The penalty of a masked matrix, scored exactly as the `qrcode` crate (0.14) scores it, so
 * the two encoders pick the same mask: runs of five or more (length − 2), 2×2 blocks (3),
 * finder-like 1:1:3:1:1 runs without four light modules on one side (40, less 360 per
 * direction), and the distance of the dark ratio from 50%.
 */
function penalty(g: Grid): number {
  const n = g.size
  let score = 0
  for (const horizontal of [true, false]) {
    const at = (line: number, k: number) => (horizontal ? g.get(k, line) : g.get(line, k))
    for (let line = 0; line < n; line++) {
      let last: boolean | null = null
      let run = 1
      for (let k = 0; k <= n; k++) {
        const c = k < n ? at(line, k) : null
        if (c === last) run++
        else {
          last = c
          if (run >= 5) score += run - 2
          run = 1
        }
      }
    }
  }
  for (let y = 0; y < n - 1; y++) {
    for (let x = 0; x < n - 1; x++) {
      const c = g.get(x, y)
      if (c === g.get(x + 1, y) && c === g.get(x, y + 1) && c === g.get(x + 1, y + 1)) score += 3
    }
  }
  const FINDER = [true, false, true, true, true, false, true]
  for (const horizontal of [true, false]) {
    let finder = 0
    for (let line = 0; line < n; line++) {
      const at = (k: number) => (horizontal ? g.get(k, line) : g.get(line, k))
      const darkAt = (k: number) => k >= 0 && k < n && at(k)
      for (let j = 0; j < n - 6; j++) {
        let same = true
        for (let k = 0; k < 7 && same; k++) same = at(j + k) === FINDER[k]
        if (!same) continue
        let before = false
        let after = false
        for (let k = j - 4; k < j; k++) before ||= darkAt(k)
        for (let k = j + 7; k < j + 11; k++) after ||= darkAt(k)
        if (!before || !after) finder += 40
      }
    }
    score += finder - 360
  }
  let darkCount = 0
  for (const d of g.dark) if (d) darkCount++
  const ratio = Math.floor((darkCount * 200) / (n * n))
  score += Math.abs(ratio - 100)
  return score
}

/** UTF-8 bytes of a string, with no dependency on TextEncoder. */
function utf8(text: string): Uint8Array {
  const out: number[] = []
  for (const ch of text) {
    let cp = ch.codePointAt(0)!
    if (cp >= 0xd800 && cp <= 0xdfff) cp = 0xfffd
    if (cp < 0x80) out.push(cp)
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63))
    else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63))
    else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63))
  }
  return Uint8Array.from(out)
}

/**
 * Encode text as a QR code in byte mode at the smallest version that holds it. Returns `null`
 * when the text is too long for version 40 at this level (2,331 bytes at M).
 */
export function qrMatrix(text: string, ecc: QrEcc = "M"): QrMatrix | null {
  const bytes = utf8(text)
  let ver = 1
  while (ver <= 40 && byteCapacity(ver, ecc) < bytes.length) ver++
  if (ver > 40) return null
  const g = new Grid(ver * 4 + 17)
  drawFunctionPatterns(g, ver)
  drawCodewords(g, withErrorCorrection(dataBits(bytes, ver, ecc), ver, ecc))
  let best = 0
  let bestScore = Infinity
  for (let mask = 0; mask < 8; mask++) {
    applyMask(g, mask)
    drawFormat(g, ecc, mask)
    const s = penalty(g)
    if (s < bestScore) {
      best = mask
      bestScore = s
    }
    applyMask(g, mask)
  }
  applyMask(g, best)
  drawFormat(g, ecc, best)
  return { size: g.size, version: ver, ecc, mask: best, dark: g.dark }
}

/**
 * SVG path data for a matrix, in module units, offset by a quiet zone of `quiet` modules
 * (4 is the standard's minimum). Each horizontal run of dark modules is one subpath. Draw it
 * in a `viewBox` of `qrViewBox(matrix.size, quiet)`.
 */
export function qrPath(m: QrMatrix, quiet = 4): string {
  let d = ""
  for (let y = 0; y < m.size; y++) {
    let x = 0
    while (x < m.size) {
      if (!m.dark[y * m.size + x]) {
        x++
        continue
      }
      const start = x
      while (x < m.size && m.dark[y * m.size + x]) x++
      d += `M${start + quiet} ${y + quiet}h${x - start}v1h-${x - start}z`
    }
  }
  return d
}

/** The `viewBox` for `qrPath`: the matrix plus its quiet zone on every side. */
export function qrViewBox(size: number, quiet = 4): string {
  return `0 0 ${size + 2 * quiet} ${size + 2 * quiet}`
}
