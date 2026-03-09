import { CodeBlock } from "@/components/patterns/code-block"
import { CircuitBreakerDemo } from "@/components/patterns/circuit-breaker-demo"

export default function ResiliencePage() {
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
            Resilience
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Netflix Hystrix-inspired circuit breakers, retry with exponential backoff,
            and fallback chains. Prevent cascading failures when external APIs go down.
          </p>
        </div>

        {/* Install */}
        <div className="mb-12 rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-3 text-sm font-medium text-foreground">Install from registry</h3>
          <CodeBlock code={`npx shadcn@latest add https://registry.mukoko.com/api/r/circuit-breaker
npx shadcn@latest add https://registry.mukoko.com/api/r/retry
npx shadcn@latest add https://registry.mukoko.com/api/r/fallback-chain
npx shadcn@latest add https://registry.mukoko.com/api/r/timeout`} />
        </div>

        {/* Circuit Breaker */}
        <div className="mb-16">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">Circuit Breaker</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            State machine that tracks failures per external provider. When failures
            exceed the threshold, the circuit &quot;opens&quot; and rejects all requests
            immediately — preventing wasted time and cascading failures. After a
            cooldown period, it enters HALF_OPEN to probe with one request.
          </p>
          <CircuitBreakerDemo />
        </div>

        {/* Circuit Breaker code */}
        <div className="mb-12">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Usage</h3>
          <CodeBlock
            filename="lib/weather-client.ts"
            code={`import { CircuitBreaker, CircuitOpenError, PROVIDER_CONFIGS } from "@/lib/circuit-breaker"

// Create breakers for each external provider
const tomorrowBreaker = new CircuitBreaker({
  name: "tomorrow-io",
  ...PROVIDER_CONFIGS["tomorrow-io"],
  // 3 failures → open, 2min cooldown, 5s timeout
})

const openMeteoBreaker = new CircuitBreaker({
  name: "open-meteo",
  ...PROVIDER_CONFIGS["open-meteo"],
  // 5 failures → open, 5min cooldown, 8s timeout
})

// Execute through the breaker
try {
  const data = await tomorrowBreaker.execute(async () => {
    const res = await fetch("https://api.tomorrow.io/v4/weather/forecast")
    return res.json()
  })
} catch (error) {
  if (error instanceof CircuitOpenError) {
    // Circuit is open — use fallback provider or cache
    return openMeteoBreaker.execute(() => fetchOpenMeteo(lat, lon))
  }
  throw error
}`} />
        </div>

        {/* Pre-configured providers */}
        <div className="mb-12">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Pre-configured provider settings
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Based on production tuning from mukoko-weather. Import{" "}
            <code className="rounded bg-secondary px-1 font-mono text-xs">PROVIDER_CONFIGS</code>{" "}
            for battle-tested defaults.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium text-foreground">Provider</th>
                  <th className="pb-2 pr-4 font-medium text-foreground">Threshold</th>
                  <th className="pb-2 pr-4 font-medium text-foreground">Cooldown</th>
                  <th className="pb-2 pr-4 font-medium text-foreground">Window</th>
                  <th className="pb-2 font-medium text-foreground">Timeout</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 font-mono text-xs">tomorrow-io</td>
                  <td className="py-2 pr-4">3 failures</td>
                  <td className="py-2 pr-4">2 min</td>
                  <td className="py-2 pr-4">5 min</td>
                  <td className="py-2">5s</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 font-mono text-xs">open-meteo</td>
                  <td className="py-2 pr-4">5 failures</td>
                  <td className="py-2 pr-4">5 min</td>
                  <td className="py-2 pr-4">5 min</td>
                  <td className="py-2">8s</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 font-mono text-xs">anthropic</td>
                  <td className="py-2 pr-4">3 failures</td>
                  <td className="py-2 pr-4">5 min</td>
                  <td className="py-2 pr-4">10 min</td>
                  <td className="py-2">15s</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">mongodb</td>
                  <td className="py-2 pr-4">5 failures</td>
                  <td className="py-2 pr-4">1 min</td>
                  <td className="py-2 pr-4">2 min</td>
                  <td className="py-2">10s</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Retry */}
        <div className="mb-12">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">Retry with Backoff</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Exponential backoff with jitter prevents thundering herd. Configurable
            retry predicate lets you skip retries for 4xx errors.
          </p>
          <CodeBlock
            filename="retry example"
            code={`import { withRetry } from "@/lib/retry"

// Basic — 3 attempts, 1s base delay, exponential + jitter
const data = await withRetry(() =>
  fetch("/api/weather").then(r => r.json())
)

// Custom — don't retry client errors
const result = await withRetry(
  () => fetchProvider(),
  {
    maxAttempts: 5,
    baseDelayMs: 500,
    retryIf: (error) => {
      // Only retry 5xx errors
      if (error instanceof Response && error.status < 500) return false
      return true
    },
  }
)

// Git push pattern (from CLAUDE.md)
await withRetry(() => gitPush(), {
  maxAttempts: 4,
  baseDelayMs: 2000,  // 2s → 4s → 8s → 16s
  jitter: false,
})`} />
        </div>

        {/* Fallback Chain */}
        <div className="mb-12">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">Fallback Chain</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Sequential fallback from mukoko-weather production: try each data source
            in order, return the first success. Each stage has its own timeout.
          </p>
          <CodeBlock
            filename="fallback-chain example"
            code={`import { withFallback, AllStagesFailedError } from "@/lib/fallback-chain"

// Weather data fallback (production pattern from mukoko-weather)
const weather = await withFallback([
  {
    name: "mongodb-cache",
    execute: () => getCachedWeather(slug),
    timeoutMs: 2000,
  },
  {
    name: "tomorrow-io",
    execute: () => tomorrowBreaker.execute(() => fetchTomorrowIO(lat, lon)),
    timeoutMs: 5000,
  },
  {
    name: "open-meteo",
    execute: () => openMeteoBreaker.execute(() => fetchOpenMeteo(lat, lon)),
    timeoutMs: 8000,
  },
  {
    name: "seasonal-estimate",
    execute: () => getSeasonalEstimate(lat, lon, month),
    // No timeout — this is the last resort
  },
])

// Logs automatically:
// [mukoko:fallback] WARN Stage "mongodb-cache" failed (timeout)
// [mukoko:fallback] INFO Stage "tomorrow-io" succeeded`} />
        </div>

        {/* Timeout */}
        <div className="mb-12">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">Timeout</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Promise timeout wrapper used by circuit breaker and fallback chain.
            Operations that exceed the timeout reject with{" "}
            <code className="rounded bg-secondary px-1 font-mono text-xs">TimeoutError</code>.
          </p>
          <CodeBlock
            filename="timeout example"
            code={`import { withTimeout, TimeoutError } from "@/lib/timeout"

try {
  const data = await withTimeout(
    () => fetch("https://api.tomorrow.io/v4/weather"),
    5000,
    "tomorrow-io"
  )
} catch (error) {
  if (error instanceof TimeoutError) {
    // error.durationMs === 5000
    // error.label === "tomorrow-io"
    log.warn("Provider timed out", { data: { ms: error.durationMs } })
  }
}`} />
        </div>

        {/* Combined pattern */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Full resilience stack
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            In production, combine all four utilities: circuit breaker wraps each provider,
            retry handles transient failures, fallback chain orchestrates multiple providers,
            timeout prevents hangs.
          </p>
          <CodeBlock code={`// The complete resilience stack
const data = await withFallback([
  {
    name: "primary",
    execute: () => withRetry(
      () => primaryBreaker.execute(() => fetchPrimary()),
      { maxAttempts: 2, baseDelayMs: 500 }
    ),
    timeoutMs: 10000,
  },
  {
    name: "fallback",
    execute: () => fallbackBreaker.execute(() => fetchFallback()),
    timeoutMs: 8000,
  },
  {
    name: "cache",
    execute: () => getFromCache(),
    timeoutMs: 2000,
  },
])`} />
        </div>
      </div>
    </div>
  )
}
