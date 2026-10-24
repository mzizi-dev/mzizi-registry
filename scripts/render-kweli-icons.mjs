#!/usr/bin/env node
/**
 * Render Kweli's app-icon PNGs from the kweli mark (#543): the PWA pair (192, 512), a maskable
 * 512 and the 180px Apple touch icon, into components/registry/assets/.
 *
 * The mark is `kweli-mark-light.svg`'s two paths (a shield with a tick, malachite #004D40), read
 * from that file, never redrawn. Each icon is the mark centred on an opaque white plate (the
 * canon's `#FFFFFF`): an app icon must be opaque (iOS fills transparency with black) and the
 * light-surface mark is the one drawn for a light ground.
 *
 *   - any (192, 512) and apple-touch (180): the mark's 32-unit box spans 80% of the icon.
 *   - maskable (512): it spans 66%, so the whole shield stays inside the 80% safe-zone circle
 *     a launcher's mask keeps (its farthest point is ~34% from the centre).
 *
 * Run by hand after the mark changes:  node scripts/render-kweli-icons.mjs
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

/* sharp is not a direct dependency (it arrives transitively), so resolve it from the pnpm store
   when a plain require cannot see it. Nothing in CI runs this script. */
function loadSharp() {
  const require = createRequire(import.meta.url)
  try {
    return require("sharp")
  } catch {
    const store = join(process.cwd(), "node_modules", ".pnpm")
    const dir = existsSync(store) ? readdirSync(store).find((d) => d.startsWith("sharp@")) : undefined
    if (!dir) throw new Error("sharp is not installed: run pnpm install first")
    return require(join(store, dir, "node_modules", "sharp"))
  }
}
const sharp = loadSharp()

const ASSETS = join(process.cwd(), "components", "registry", "assets")
const mark = readFileSync(join(ASSETS, "kweli-mark-light.svg"), "utf8")
const stroke = mark.match(/stroke="(#[0-9A-Fa-f]{6})"/)?.[1]
const paths = [...mark.matchAll(/<path d="([^"]+)"\s*\/>/g)].map((m) => m[1])
if (!stroke || paths.length !== 2) throw new Error("kweli-mark-light.svg no longer has one stroke colour and two paths")

const PLATE = "#FFFFFF"
const ICONS = [
  { file: "kweli-icon-192.png", size: 192, span: 0.8 },
  { file: "kweli-icon-512.png", size: 512, span: 0.8 },
  { file: "kweli-icon-maskable-512.png", size: 512, span: 0.66 },
  { file: "kweli-apple-touch-icon.png", size: 180, span: 0.8 },
]

for (const { file, size, span } of ICONS) {
  const scale = (size * span) / 32
  const offset = (size - size * span) / 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" fill="${PLATE}"/>
<g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
${paths.map((d) => `<path d="${d}"/>`).join("\n")}
</g>
</svg>`
  const png = await sharp(Buffer.from(svg)).flatten({ background: PLATE }).png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(join(ASSETS, file), png)
  console.log(`✓ ${file} ${size}×${size}`)
}
