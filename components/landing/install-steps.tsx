import { Braces, Terminal, Timer, Coins } from "lucide-react"
import { Section, SectionHeader } from "@/components/landing/section"

/**
 * The four measurable design goals from the research charter. Each card
 * carries the metric the goal is judged by — goals here are commitments to
 * measure, not shipped features (the compiler is being designed in Phase 0).
 */
const goals = [
  {
    icon: Braces,
    title: "Low syntactic ambiguity",
    description:
      "Fewer distinct-but-equivalent ways to express the same intent. When there is one canonical spelling, an agent stops burning iterations choosing between synonyms.",
    code: "measure: equivalent spellings per intent → 1",
    mineralColor: "bg-[var(--color-tanzanite)]",
  },
  {
    icon: Terminal,
    title: "Dense compiler errors",
    description:
      "Maximum actionable information per character, aimed at a machine reader. For an agent, the error message is the prompt for the next attempt.",
    code: "measure: actionable signal per error char ↑",
    mineralColor: "bg-[var(--color-malachite)]",
  },
  {
    icon: Timer,
    title: "Fast incremental compilation",
    description:
      "Compile latency is the dominant cost of an agent's workflow — author, compile, correct, thousands of times. Every millisecond compounds across the loop.",
    code: "measure: incremental recompile latency ↓",
    mineralColor: "bg-[var(--color-gold)]",
  },
  {
    icon: Coins,
    title: "Token-efficient representation",
    description:
      "More real logic per token of context window. A denser language means the agent holds more of the program in view on every iteration.",
    code: "measure: logic per token of context ↑",
    mineralColor: "bg-[var(--color-cobalt)]",
  },
]

export function InstallSteps() {
  return (
    <Section>
      <SectionHeader
        align="center"
        eyebrow="The charter"
        title="Four measurable design goals"
        sub="Not aesthetics, not vibes — each goal is a metric the Phase 0 benchmark can score."
      />

      <div className="mt-12 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {goals.map((goal, i) => (
          <div
            key={goal.title}
            className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:border-foreground/12"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                <goal.icon className="size-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${goal.mineralColor}`} />
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-foreground">{goal.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{goal.description}</p>
            </div>

            <div className="mt-auto overflow-hidden rounded-xl bg-secondary px-3 py-2.5">
              <code className="block font-mono text-[11px] leading-relaxed break-all text-muted-foreground sm:text-xs">
                {goal.code}
              </code>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
