"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Copy, ArrowRight } from "lucide-react"

const minerals = [
  { name: "cobalt", color: "bg-[var(--color-cobalt)]" },
  { name: "tanzanite", color: "bg-[var(--color-tanzanite)]" },
  { name: "malachite", color: "bg-[var(--color-malachite)]" },
  { name: "gold", color: "bg-[var(--color-gold)]" },
  { name: "terracotta", color: "bg-[var(--color-terracotta)]" },
]

const products = [
  // Ecosystem
  { label: "bundu", href: "https://bundu.family" },
  // Infrastructure & enterprise
  { label: "nyuchi", href: "https://nyuchi.com" },
  { label: "bushtrade", href: "https://bushtrade.co.zw" },
  // Consumer apps
  { label: "mukoko", href: "https://www.mukoko.com" },
  { label: "weather", href: "https://weather.mukoko.com" },
  { label: "news", href: "https://news.mukoko.com" },
  { label: "lingo", href: "https://lingo.mukoko.com" },
  { label: "nhimbe", href: "https://nhimbe.com" },
  // AI
  { label: "shamwari", href: "https://shamwari.ai" },
]

function CopyCommand() {
  const [copied, setCopied] = useState(false)
  const command = "npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/button"

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(command)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="group flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 text-left transition-all hover:border-foreground/15 sm:gap-3 sm:px-5 sm:py-3.5"
    >
      <span className="hidden font-mono text-sm text-muted-foreground sm:inline">$</span>
      <code className="flex-1 truncate font-mono text-xs text-muted-foreground sm:text-sm">
        {command}
      </code>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors group-hover:text-foreground">
        {copied ? <Check className="size-4 text-[var(--color-malachite)]" /> : <Copy className="size-4" />}
      </span>
    </button>
  )
}

export function Hero() {
  return (
    <section className="relative flex flex-col items-center gap-8 px-4 pt-28 pb-16 text-center sm:gap-10 sm:px-6 md:pt-44 md:pb-32">
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="flex flex-col items-center gap-4">
        <Badge variant="outline" className="gap-2 px-3 py-1">
          <span className="flex gap-1">
            {minerals.map((m) => (
              <span key={m.name} className={`size-1.5 rounded-full ${m.color}`} />
            ))}
          </span>
          <span className="text-muted-foreground">Ndiri nekuti tiri — I am because we are</span>
        </Badge>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {products.map((p) => (
            <a
              key={p.label}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground transition-colors hover:text-foreground"
            >
              {p.label}
            </a>
          ))}
        </div>
      </div>

      <div className="flex max-w-3xl flex-col items-center gap-4 sm:gap-6">
        <h1 className="font-serif text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-6xl lg:text-7xl">
          The design system
          <br />
          for the bundu ecosystem
        </h1>
        <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          294 production-ready components, blocks, and charts rooted in the
          Five African Minerals palette. One design system powering mukoko,
          nyuchi, and every app in the bundu family. Install with the shadcn
          CLI — no packages, no lock-in.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-4 sm:gap-5">
        <CopyCommand />
        <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row sm:gap-3">
          <Button size="lg" className="w-full gap-2 rounded-xl sm:w-auto" asChild>
            <a href="#components">
              Browse components
              <ArrowRight className="size-4" />
            </a>
          </Button>
          <Button variant="outline" size="lg" className="w-full rounded-xl sm:w-auto" asChild>
            <a href="#catalog">
              Full catalog
            </a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-4 sm:gap-8">
        {[
          { label: "Registry Items", value: "294" },
          { label: "Mini-Apps", value: "17" },
          { label: "Enterprise Products", value: "7" },
          { label: "Data Layers", value: "7" },
          { label: "Palette", value: "5 minerals" },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-0.5">
            <span className="font-mono text-lg font-semibold text-foreground">{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
