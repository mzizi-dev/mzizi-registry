import { CodeBlock } from "@/components/patterns/code-block"
import { ChaosDemo } from "@/components/patterns/chaos-demo"

export default function ChaosPage() {
  return (
    <div className="px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4">
          <a href="/patterns" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Patterns
          </a>
          <span className="mx-2 text-muted-foreground">/</span>
        </div>

        <div className="mb-12">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Chaos Testing
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Netflix chaos engineering patterns for testing application resilience.
            Inject random errors and latency to verify that circuit breakers, fallback
            chains, and error boundaries work under stress.
          </p>
        </div>

        {/* Warning */}
        <div className="mb-12 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Safety:</span> All chaos functions are
            disabled by default (<code className="font-mono text-xs">enabled: false</code>).
            You must explicitly enable them. Never enable chaos in production.
          </p>
        </div>

        {/* Install */}
        <div className="mb-12 rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-3 text-sm font-medium text-foreground">Install from registry</h3>
          <CodeBlock code={`npx shadcn@latest add https://registry.mukoko.com/api/v1/ui/chaos`} />
        </div>

        {/* Live demo */}
        <div className="mb-16">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
            Live demonstration
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Chaos injection combined with circuit breaker. Adjust the error rate and
            latency, then send requests to see how the system responds under stress.
          </p>
          <ChaosDemo />
        </div>

        {/* withChaos */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            <code className="font-mono">withChaos</code>
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Wrap any async operation with configurable error and latency injection.
            Passes through unchanged when disabled.
          </p>
          <CodeBlock
            filename="chaos testing"
            code={`import { withChaos, ChaosError } from "@/lib/chaos"

// Only in development/testing
const data = await withChaos(
  () => fetch("/api/weather").then(r => r.json()),
  {
    enabled: process.env.NODE_ENV === "development",
    errorRate: 0.3,      // 30% chance of failure
    latencyMs: [100, 500], // 100-500ms random delay
  }
)

// Distinguish chaos errors from real errors
try {
  await withChaos(() => fetchData(), { enabled: true, errorRate: 0.5 })
} catch (error) {
  if (error instanceof ChaosError) {
    console.log("Chaos injected:", error.chaosType) // "error" | "latency"
    console.log(error.injected) // true
  }
}`} />
        </div>

        {/* chaosMiddleware */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            <code className="font-mono">chaosMiddleware</code>
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Create a reusable chaos wrapper with fixed configuration.
          </p>
          <CodeBlock
            filename="middleware pattern"
            code={`import { chaosMiddleware } from "@/lib/chaos"

const devChaos = chaosMiddleware({
  enabled: process.env.CHAOS_TESTING === "true",
  errorRate: 0.2,
  latencyMs: [50, 200],
})

// Wrap any operation
const weather = await devChaos(() => fetchWeather(slug))
const user = await devChaos(() => getUser(id))
const report = await devChaos(() => submitReport(data))`} />
        </div>

        {/* Combined with circuit breaker */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Combined with circuit breaker
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            The real power is testing your resilience stack end-to-end: chaos injects
            failures, the circuit breaker opens, the fallback chain kicks in.
          </p>
          <CodeBlock
            filename="end-to-end resilience testing"
            code={`import { withChaos } from "@/lib/chaos"
import { CircuitBreaker, PROVIDER_CONFIGS } from "@/lib/circuit-breaker"
import { withFallback } from "@/lib/fallback-chain"
import { withRetry } from "@/lib/retry"

const breaker = new CircuitBreaker({
  name: "weather-api",
  ...PROVIDER_CONFIGS["tomorrow-io"],
})

// Chaos wraps the innermost call
const weather = await withFallback([
  {
    name: "primary",
    execute: () => withRetry(
      () => breaker.execute(() =>
        withChaos(() => fetchPrimary(), {
          enabled: true,
          errorRate: 0.5,  // 50% failure rate
        })
      ),
      { maxAttempts: 2 }
    ),
    timeoutMs: 10000,
  },
  {
    name: "cache",
    execute: () => getFromCache(),
  },
])

// Verify:
// 1. Chaos injects failures in primary
// 2. Retry attempts 2x before giving up
// 3. Circuit breaker opens after 3 total failures
// 4. Fallback chain falls through to cache`} />
        </div>

        {/* chaosWrap */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Testing patterns
          </h3>
          <ul className="flex flex-col gap-3">
            {[
              "Start with low error rates (10-20%) and increase gradually",
              "Test each layer independently first, then the full stack",
              "Verify circuit breaker opens at the expected failure threshold",
              "Confirm fallback chain reaches the last stage under heavy chaos",
              "Check that error boundaries show appropriate fallback UI",
              "Monitor memory with useMemoryPressure during chaos testing",
              "Never enable chaos in production — use environment variables",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
