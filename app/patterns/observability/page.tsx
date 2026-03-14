import { CodeBlock } from "@/components/patterns/code-block"
import { ObservabilityDemo } from "@/components/patterns/observability-demo"

export default function ObservabilityPage() {
  return (
    <div className="px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4">
          <a
            href="/patterns"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Patterns
          </a>
          <span className="mx-2 text-muted-foreground">/</span>
        </div>

        <div className="mb-12">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Observability
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Structured logging, performance measurement, and error tracking.
            Every log line uses the{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
              [mukoko]
            </code>{" "}
            prefix for grep-ability across all services.
          </p>
        </div>

        {/* Install */}
        <div className="mb-12 rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Install from registry
          </h3>
          <CodeBlock
            code={`npx shadcn@latest add https://registry.mukoko.com/api/v1/ui/observability`}
          />
        </div>

        {/* API overview */}
        <div className="mb-12">
          <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
            API reference
          </h2>

          <div className="flex flex-col gap-8">
            {/* log */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                <code className="font-mono">log</code>
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Structured logger with four levels: debug, info, warn, error.
                All output is prefixed with{" "}
                <code className="rounded bg-secondary px-1 font-mono text-xs">
                  [mukoko]
                </code>{" "}
                and optionally scoped to a module.
              </p>
              <CodeBlock
                filename="lib/observability.ts"
                code={`import { log } from "@/lib/observability"

// Basic logging
log.info("Server started")
// → [mukoko] INFO Server started

// With module scope
log.info("Component served", {
  module: "registry",
  data: { name: "button", fileCount: 1 },
})
// → [mukoko:registry] INFO Component served { name: "button", fileCount: 1 }

// Error logging
log.error("Failed to fetch weather", {
  module: "weather",
  error: new Error("timeout"),
  traceId: "req-abc123",
})
// → [mukoko:weather] ERROR Failed to fetch weather [trace:req-abc123] Error: timeout`}
              />
            </div>

            {/* createLogger */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                <code className="font-mono">createLogger</code>
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Creates a scoped logger bound to a module name. Recommended for
                files that log frequently — avoids repeating the module name.
              </p>
              <CodeBlock
                filename="app/api/v1/ui/route.ts"
                code={`import { createLogger } from "@/lib/observability"

const logger = createLogger("registry")

// All logs automatically scoped
logger.info("Registry index served", {
  data: { itemCount: 59 },
})
// → [mukoko:registry] INFO Registry index served { itemCount: 59 }

logger.warn("File not found, skipping", {
  data: { filePath: "components/ui/missing.tsx" },
})
// → [mukoko:registry] WARN File not found, skipping { filePath: ... }`}
              />
            </div>

            {/* measure */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                <code className="font-mono">measure</code>
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Measures execution time of sync or async functions. Logs
                duration on success and failure. Returns the function&apos;s result.
              </p>
              <CodeBlock
                filename="example usage"
                code={`import { measure } from "@/lib/observability"

// Measure an async operation
const data = await measure("fetch-weather", async () => {
  const res = await fetch("https://api.mukoko.com/weather")
  return res.json()
})
// → [mukoko:perf] INFO fetch-weather completed in 142ms { duration: 142, label: "fetch-weather" }

// Measure with module scope
const result = await measure("build-registry", () => {
  return buildAllComponents()
}, { module: "registry" })
// → [mukoko:registry] INFO build-registry completed in 3204ms { duration: 3204, ... }

// Failures are logged automatically
await measure("risky-operation", async () => {
  throw new Error("something broke")
})
// → [mukoko:perf] ERROR risky-operation failed after 2ms { duration: 2, ... } Error: something broke`}
              />
            </div>

            {/* trackError */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                <code className="font-mono">trackError</code>
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Convenience function for tracking errors without throwing. Wraps
                non-Error values in an Error automatically.
              </p>
              <CodeBlock
                filename="example usage"
                code={`import { trackError } from "@/lib/observability"

try {
  await riskyOperation()
} catch (error) {
  trackError(error, {
    module: "checkout",
    data: { userId: "user-123", action: "payment" },
  })
  // Show fallback UI instead of crashing
  return <FallbackView />
}`}
              />
            </div>
          </div>
        </div>

        {/* Live demo */}
        <div className="mb-12">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
            Live demonstration
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Click the buttons below and open your browser&apos;s console (F12) to
            see the structured log output in real time.
          </p>
          <ObservabilityDemo />
        </div>

        {/* Integration with error boundaries */}
        <div className="mb-12">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
            Integration with error boundaries
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            The SectionErrorBoundary automatically logs errors via the
            observability system. No manual integration needed — just wrap your
            sections.
          </p>
          <CodeBlock
            filename="automatic logging"
            code={`// SectionErrorBoundary logs automatically:
// [mukoko:error-boundary] ERROR Section "Weather Overview" crashed
//   { section: "Weather Overview", componentStack: [...] }
//   Error: Cannot read properties of undefined

// The ErrorBoundary component also logs:
// [mukoko:error-boundary] ERROR Component error caught by boundary
//   Error: Failed to render chart`}
          />
        </div>

        {/* Grep patterns */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Grep patterns
          </h3>
          <div className="flex flex-col gap-2">
            {[
              {
                pattern: 'grep "[mukoko]" logs',
                desc: "All Mukoko logs",
              },
              {
                pattern: 'grep "[mukoko:registry]" logs',
                desc: "Registry module only",
              },
              {
                pattern: 'grep "[mukoko].*ERROR" logs',
                desc: "All errors",
              },
              {
                pattern: 'grep "[mukoko:error-boundary]" logs',
                desc: "Error boundary events",
              },
              {
                pattern: 'grep "[mukoko:perf]" logs',
                desc: "Performance measurements",
              },
              {
                pattern: 'grep "[trace:req-" logs',
                desc: "Request traces",
              },
            ].map((item) => (
              <div
                key={item.pattern}
                className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2"
              >
                <code className="font-mono text-xs text-foreground">
                  {item.pattern}
                </code>
                <span className="text-xs text-muted-foreground">
                  — {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
