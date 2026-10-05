/**
 * MineralStrip — the decorative seven-mineral accent bar (React).
 *
 * A full-height, ~6px bar fixed to the LEFT edge of every page, split into
 * seven equal vertical segments coloured with the seven African-mineral
 * tokens (top→bottom: cobalt, tanzanite, malachite, gold, terracotta,
 * sodalite, copper). Purely decorative: aria-hidden and pointer-events:none.
 *
 * The React twin of `site-mineral-strip.astro` (contract `site/mineral-strip`):
 * the same markup. No inline `style` attributes: each segment is coloured by
 * the stylesheet below (by `data-mineral`), which React 19 hoists into <head>
 * once, however many strips render (`href` + `precedence`).
 */
const minerals = ["cobalt", "tanzanite", "malachite", "gold", "terracotta", "sodalite", "copper"] as const

const css = `.mineral-strip{position:fixed;top:0;left:0;width:6px;height:100dvh;z-index:50;display:flex;flex-direction:column;pointer-events:none}
.mineral-strip span{flex:1 1 0;display:block}
${minerals.map((m) => `.mineral-strip [data-mineral="${m}"]{background-color:var(--color-${m})}`).join("\n")}`

export type MineralStripProps = Record<string, never>

export function MineralStrip() {
  return (
    <div className="mineral-strip" aria-hidden="true" data-slot="mineral-strip">
      <style href="mzizi-mineral-strip" precedence="default">
        {css}
      </style>
      {minerals.map((mineral) => (
        <span key={mineral} data-mineral={mineral} />
      ))}
    </div>
  )
}
