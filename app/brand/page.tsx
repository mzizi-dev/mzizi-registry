import { ECOSYSTEM_BRANDS, PHILOSOPHY } from "@/lib/brand"
import { BrandCard } from "@/components/brand/brand-card"
import { MineralStrip } from "@/components/brand/mineral-strip"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

export const metadata = {
  title: "Brand — mukoko registry",
  description: "The Mukoko brand system: Five African Minerals design language, ecosystem brands, and design philosophy.",
}

const brandLinks = [
  { label: "Colors", href: "/brand/colors", description: "Five African Minerals palette" },
  { label: "Components", href: "/brand/components", description: "Component visual specifications" },
  { label: "Guidelines", href: "/brand/guidelines", description: "Usage rules and accessibility" },
]

export default function BrandPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Hero */}
      <div className="flex gap-6">
        <MineralStrip className="hidden h-auto sm:flex" />
        <div className="space-y-4">
          <Badge variant="outline" className="gap-2">
            <span className="font-mono text-xs">v7.0.0</span>
          </Badge>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            mukoko brand system
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            The design system for the Mukoko ecosystem, built on the{" "}
            <strong className="text-foreground">Five African Minerals</strong> palette.
            Every color, component, and pattern is rooted in African heritage.
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {brandLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="group flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted"
          >
            <div>
              <p className="font-medium text-foreground">{link.label}</p>
              <p className="text-sm text-muted-foreground">{link.description}</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </a>
        ))}
      </div>

      {/* Ecosystem brands */}
      <section className="mt-20">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Ecosystem</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Five interconnected brands form the Mukoko ecosystem. Each plays a distinct role,
          named in Shona and inspired by the collective spirit of African communities.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ECOSYSTEM_BRANDS.map((brand) => (
            <BrandCard key={brand.name} brand={brand} />
          ))}
        </div>
      </section>

      {/* Ubuntu philosophy */}
      <section className="mt-20">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          {PHILOSOPHY.name} Philosophy
        </h2>
        <p className="mt-2 max-w-2xl text-lg italic text-muted-foreground">
          &ldquo;{PHILOSOPHY.meaning}&rdquo;
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-5">
          {PHILOSOPHY.pillars.map((pillar) => (
            <div
              key={pillar.name}
              className="rounded-xl border border-border p-4 text-center"
            >
              <p className="font-medium text-foreground">{pillar.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* API reference */}
      <section className="mt-20 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-xl font-semibold text-foreground">Brand API</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Access the complete brand system programmatically.
        </p>
        <div className="mt-4 rounded-xl bg-muted p-4">
          <code className="font-mono text-sm text-foreground">
            GET https://registry.mukoko.com/api/brand
          </code>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Returns the full brand system as JSON — minerals, typography, spacing, component specs, and more.
        </p>
      </section>
    </div>
  )
}
