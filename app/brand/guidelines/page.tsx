import {
  ACCESSIBILITY,
  RADII,
  VOICE_AND_TONE,
  TYPOGRAPHY_FONTS,
} from "@/lib/brand"
import { TypeScale } from "@/components/brand/type-scale"
import { SpacingScale } from "@/components/brand/spacing-scale"
import { MineralStrip } from "@/components/brand/mineral-strip"
import { Check, X } from "lucide-react"

export const metadata = {
  title: "Guidelines — mukoko brand",
  description: "Design guidelines for the mukoko brand system: typography, spacing, accessibility, and voice & tone.",
}

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Guidelines
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Rules and principles for using the mukoko brand system consistently across all applications.
        </p>
      </div>

      {/* Wordmark standards */}
      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-foreground">Wordmark Standards</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          All brand names are always lowercase. This is a core identity rule.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-malachite)] bg-[var(--color-malachite)]/5 p-4">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-[var(--color-malachite)]" />
              <span className="text-sm font-medium text-foreground">Correct</span>
            </div>
            <div className="mt-3 space-y-1 font-serif text-lg text-foreground">
              <p>mukoko</p>
              <p>nyuchi</p>
              <p>shamwari</p>
              <p>bundu</p>
              <p>nhimbe</p>
            </div>
          </div>
          <div className="rounded-xl border border-destructive bg-destructive/5 p-4">
            <div className="flex items-center gap-2">
              <X className="size-4 text-destructive" />
              <span className="text-sm font-medium text-foreground">Incorrect</span>
            </div>
            <div className="mt-3 space-y-1 font-serif text-lg text-muted-foreground line-through">
              <p>Mukoko</p>
              <p>NYUCHI</p>
              <p>Shamwari</p>
              <p>BUNDU</p>
              <p>Nhimbe</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mineral strip */}
      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-foreground">Mineral Strip</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The signature 4px stripe using all five mineral colors. Used as a brand identity marker
          on cards, headers, and feature sections.
        </p>
        <div className="mt-6 flex gap-8">
          <div className="flex items-center gap-4 rounded-xl border border-border p-6">
            <MineralStrip className="h-24" />
            <div>
              <p className="text-sm font-medium text-foreground">Left edge accent</p>
              <p className="text-xs text-muted-foreground">
                The mineral strip is always vertical, always on the left edge.
                Used on cards, sidebars, page borders, and brand elements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-foreground">Typography</h2>

        {/* Font families */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Object.entries(TYPOGRAPHY_FONTS).map(([key, font]) => (
            <div key={key} className="rounded-xl border border-border p-4">
              <p
                className={`text-lg font-medium text-foreground ${
                  key === "sans" ? "font-sans" : key === "serif" ? "font-serif" : "font-mono"
                }`}
              >
                {font.family}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{font.usage}</p>
              <p className="mt-2 text-xs text-muted-foreground italic">{font.reason}</p>
            </div>
          ))}
        </div>

        {/* Type scale */}
        <div className="mt-8">
          <h3 className="text-base font-medium text-foreground">Type Scale</h3>
          <div className="mt-4">
            <TypeScale />
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-foreground">Spacing Scale</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Consistent spacing tokens used across all components and layouts.
        </p>
        <div className="mt-6">
          <SpacingScale />
        </div>
      </section>

      {/* Border radius */}
      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-foreground">Border Radius</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          All radii derive from a base value of <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">0.75rem (12px)</code>.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {Object.entries(RADII).map(([name, value]) => (
            <div key={name} className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="font-mono text-sm text-foreground">--radius-{name}</span>
              <span className="font-mono text-xs text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Accessibility */}
      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-foreground">Accessibility</h2>
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-border p-4">
            <p className="font-medium text-foreground">{ACCESSIBILITY.standard}</p>
            <p className="mt-1 text-sm text-muted-foreground">{ACCESSIBILITY.contrastDescription}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="font-medium text-foreground">{ACCESSIBILITY.minTouchTarget}px Touch Targets</p>
            <p className="mt-1 text-sm text-muted-foreground">
              All interactive elements must be at least {ACCESSIBILITY.minTouchTarget}px in both dimensions.
            </p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="font-medium text-foreground">Focus Indicators</p>
            <p className="mt-1 text-sm text-muted-foreground">{ACCESSIBILITY.focusIndicator}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="font-medium text-foreground">Keyboard Navigation</p>
            <p className="mt-1 text-sm text-muted-foreground">{ACCESSIBILITY.keyboardNavigation}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="font-medium text-foreground">Screen Readers</p>
            <p className="mt-1 text-sm text-muted-foreground">{ACCESSIBILITY.screenReaders}</p>
          </div>
        </div>
      </section>

      {/* Voice & tone */}
      <section className="mt-16">
        <h2 className="font-serif text-xl font-semibold text-foreground">Voice &amp; Tone</h2>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-base font-medium text-foreground">Principles</h3>
            <ul className="mt-3 space-y-2">
              {VOICE_AND_TONE.principles.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-tanzanite)]" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-base font-medium text-foreground">
                <Check className="size-4 text-[var(--color-malachite)]" />
                Do
              </h3>
              <ul className="mt-3 space-y-2">
                {VOICE_AND_TONE.doList.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-base font-medium text-foreground">
                <X className="size-4 text-destructive" />
                Don&apos;t
              </h3>
              <ul className="mt-3 space-y-2">
                {VOICE_AND_TONE.dontList.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
