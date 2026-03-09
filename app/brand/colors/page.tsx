import { MINERALS, SEMANTIC_COLORS, BACKGROUNDS } from "@/lib/brand"
import { ColorSwatch } from "@/components/brand/color-swatch"
import { TokenTable } from "@/components/brand/token-table"
import { MineralStrip } from "@/components/brand/mineral-strip"

export const metadata = {
  title: "Colors — mukoko brand",
  description: "The Five African Minerals color palette: cobalt, tanzanite, malachite, gold, and terracotta.",
}

export default function ColorsPage() {
  const semanticTokens = SEMANTIC_COLORS.map((c) => ({
    name: c.name,
    value: `${c.light} / ${c.dark}`,
    preview: c.dark,
    description: c.usage,
  }))

  const backgroundTokens = BACKGROUNDS.map((bg) => ({
    name: bg.name,
    value: `${bg.light} / ${bg.dark}`,
    preview: bg.light,
    description: bg.usage,
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Colors
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          The Five African Minerals palette. Each color is named after a mineral
          found across the African continent, carrying its own origin story and symbolism.
        </p>
      </div>

      {/* Mineral strip demo */}
      <section className="mt-12">
        <h2 className="font-serif text-xl font-semibold text-foreground">Mineral Strip</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The signature brand element — a 4px stripe of all five minerals, used as a visual identity marker.
        </p>
        <div className="mt-6 flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <MineralStrip orientation="vertical" className="h-32" />
            <span className="text-xs text-muted-foreground">Vertical</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <MineralStrip orientation="horizontal" className="w-48" />
            <span className="text-xs text-muted-foreground">Horizontal</span>
          </div>
        </div>
      </section>

      {/* Five minerals */}
      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-foreground">Five African Minerals</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Click any swatch to copy its hex value. Each mineral has light and dark theme variants.
        </p>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {MINERALS.map((mineral) => (
            <ColorSwatch key={mineral.name} mineral={mineral} />
          ))}
        </div>
      </section>

      {/* Mineral origins */}
      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-foreground">Origins &amp; Symbolism</h2>
        <div className="mt-6 space-y-4">
          {MINERALS.map((mineral) => (
            <div
              key={mineral.name}
              className="flex gap-4 rounded-xl border border-border p-4"
            >
              <div
                className="mt-1 size-3 shrink-0 rounded-full"
                style={{ backgroundColor: `var(${mineral.cssVar})` }}
              />
              <div>
                <p className="font-medium capitalize text-foreground">{mineral.name}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Origin:</span> {mineral.origin}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Symbolism:</span> {mineral.symbolism}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Semantic colors */}
      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-foreground">Semantic Colors</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Theme-adaptive colors for success, error, warning, and informational states.
        </p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <TokenTable
            tokens={semanticTokens}
            columns={{ name: "State", value: "Light / Dark", description: "Usage" }}
          />
        </div>
      </section>

      {/* Background tokens */}
      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-foreground">Background Tokens</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Neutral surface colors that adapt between light and dark themes.
        </p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <TokenTable
            tokens={backgroundTokens}
            columns={{ name: "Surface", value: "Light / Dark", description: "Usage" }}
          />
        </div>
      </section>

      {/* CSS variables reference */}
      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-foreground">CSS Variables</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          All mineral colors are available as CSS custom properties, registered in the Tailwind{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">@theme</code> block.
        </p>
        <div className="mt-6 rounded-xl bg-muted p-4">
          <pre className="overflow-x-auto font-mono text-sm text-foreground">
{`/* globals.css @theme inline block */
--color-cobalt: #0047AB;
--color-tanzanite: #B388FF;
--color-malachite: #64FFDA;
--color-gold: #FFD740;
--color-terracotta: #D4A574;

/* Usage in Tailwind */
bg-[var(--color-cobalt)]
text-[var(--color-tanzanite)]`}
          </pre>
        </div>
      </section>
    </div>
  )
}
