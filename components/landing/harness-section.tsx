import { Layers, Cpu, Zap, Box, Monitor, Puzzle } from "lucide-react"
import { Section, SectionHeader } from "@/components/landing/section"

/**
 * Integration posture — Mzizi is a language and compiler, not a parallel
 * universe. Rendering, ML, and deployment are borrowed from the best of the
 * Rust ecosystem so the research budget goes where the thesis lives: syntax,
 * type system, and the compiler feedback loop.
 */

const integrations: Array<{
  icon: typeof Layers
  name: string
  mineral: string
  desc: string
}> = [
  {
    icon: Layers,
    name: "Rendering — Dioxus",
    mineral: "cobalt",
    desc: "Mzizi compiles to Dioxus's component model. No rebuilt renderer — that problem is already solved.",
  },
  {
    icon: Box,
    name: "Artifact — WASM",
    mineral: "malachite",
    desc: "The compiled output is standalone WASM — embeddable in any host page, framework or none.",
  },
  {
    icon: Monitor,
    name: "Native — desktop",
    mineral: "sodalite",
    desc: "The same program also compiles native for desktop. One corpus, two artifacts, zero rewrites.",
  },
  {
    icon: Zap,
    name: "Edge — Workers",
    mineral: "gold",
    desc: "Edge-first on Cloudflare Workers via workers-rs — the default deployment target, not an afterthought.",
  },
  {
    icon: Cpu,
    name: "ML — Candle",
    mineral: "copper",
    desc: "Inference runs through Candle. Mzizi makes tensors reachable from the language; it doesn't compete with the runtime.",
  },
  {
    icon: Puzzle,
    name: "Adapters — Astro & co.",
    mineral: "tanzanite",
    desc: "Astro and other frameworks are thin optional adapters around the artifact — distribution, never compile targets.",
  },
]

export function HarnessSection() {
  return (
    <Section bordered muted>
      <SectionHeader
        eyebrow="Integration posture"
        title="Interop, not reinvention"
        sub="Mzizi is a language and a compiler — not a renderer, a tensor runtime, or a hosting platform. Everything below the language is borrowed from the Rust ecosystem, so the research budget stays on the thesis: syntax, types, and the feedback loop."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        {/* The contract — show what the corpus is held to, honestly */}
        <div className="flex flex-col gap-3">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            The contract
          </span>
          <pre className="overflow-x-auto rounded-xl border border-border bg-background p-4 font-mono text-xs leading-relaxed">
            <code>{`// The oracle behind the Phase 0 defect metric: every corpus
// component carries a behavioral contract test (Rust/Dioxus).
#[test]
fn button_outline_contract() {
    let dom = render(rsx! {
        Button { variant: Variant::Outline, "Ship it" }
    });
    assert_eq!(dom.roles("button").count(), 1);
    assert!(dom.meets_contrast(Apca::Lc90));
}`}</code>
          </pre>
          <p className="text-sm leading-relaxed text-muted-foreground">
            &quot;Compiles cleanly but behaviorally wrong&quot; is only measurable if behavior is
            pinned down. Contract tests like this one define correctness per component — the same
            oracle scores the agent&apos;s output in Mzizi syntax, raw Dioxus, and Leptos.
          </p>
        </div>

        {/* Integration surface */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {integrations.map((c) => {
            const Icon = c.icon
            return (
              <div
                key={c.name}
                className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4 transition-colors hover:border-foreground/30"
              >
                <span
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(--color-${c.mineral}) 14%, transparent)`,
                    color: `var(--color-${c.mineral})`,
                  }}
                >
                  <Icon className="size-4" />
                </span>
                <h3 className="text-sm font-semibold">{c.name}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
