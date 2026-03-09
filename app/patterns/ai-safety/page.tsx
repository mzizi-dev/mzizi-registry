import { CodeBlock } from "@/components/patterns/code-block"
import { AiSafetyDemo } from "@/components/patterns/ai-safety-demo"

export default function AiSafetyPage() {
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
            AI Safety
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Input validation, prompt injection detection, and rate limiting — ported from
            mukoko-weather&apos;s production guards. Every Mukoko app integrating Claude or
            Shamwari AI must use these utilities.
          </p>
        </div>

        {/* Install */}
        <div className="mb-12 rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-3 text-sm font-medium text-foreground">Install from registry</h3>
          <CodeBlock code={`npx shadcn@latest add https://registry.mukoko.com/api/r/ai-safety`} />
        </div>

        {/* Live demo */}
        <div className="mb-16">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
            Live demonstration
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Test slug validation, prompt injection detection, and rate limiting
            interactively.
          </p>
          <AiSafetyDemo />
        </div>

        {/* Input validation */}
        <div className="mb-12">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">Input Validation</h2>
          <CodeBlock
            filename="API route validation"
            code={`import {
  validateSlug,
  validatePromptLength,
  sanitizeUserInput,
  validateArrayLength,
  validateAllowlist,
  truncateMessage,
} from "@/lib/ai-safety"

// Slug validation (URL-safe identifiers)
const { valid, sanitized } = validateSlug(params.slug)
if (!valid) {
  return Response.json({ error: "Invalid slug" }, { status: 400 })
}

// Message length (2000 char cap from mukoko-weather)
if (!validatePromptLength(body.message, 2000)) {
  return Response.json({ error: "Message too long" }, { status: 400 })
}

// Sanitize user input (remove control chars)
const cleanInput = sanitizeUserInput(body.prompt)

// Array limits (20 items max from mukoko-weather)
if (!validateArrayLength(body.activities, 20)) {
  return Response.json({ error: "Too many activities" }, { status: 400 })
}

// Tag allowlisting
const knownTags = ["farming", "mining", "travel", "tourism", "sports"]
const { valid: tagsOk, invalid, filtered } = validateAllowlist(body.tags, knownTags)
if (!tagsOk) {
  log.warn("Unknown tags filtered", { data: { invalid } })
}

// Truncate chat history (2000 chars per message)
const history = messages.map(m => ({
  ...m,
  content: truncateMessage(m.content, 2000),
})).slice(-10)  // max 10 messages`} />
        </div>

        {/* Prompt injection */}
        <div className="mb-12">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">Prompt Injection Detection</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Heuristic detection of common prompt injection patterns. Use as one layer
            in defense-in-depth alongside length limits, rate limiting, and system
            prompt guardrails. Not a guarantee — determined attackers will find bypasses.
          </p>
          <CodeBlock
            filename="prompt safety check"
            code={`import { detectPromptInjection } from "@/lib/ai-safety"

// Check user input before sending to Claude
const { safe, flags } = detectPromptInjection(userMessage)

if (!safe) {
  logger.warn("Prompt injection attempt", {
    data: { flags, inputLength: userMessage.length },
  })
  return Response.json(
    { error: "Your message was flagged for safety review" },
    { status: 400 }
  )
}

// Detection categories:
// - system_override: "ignore previous instructions", "forget everything"
// - role_confusion: "pretend to be", "you are now a"
// - data_exfiltration: "reveal your system prompt", "repeat the text above"
// - delimiter_injection: "\`\`\`system", "<system>" tags`} />
        </div>

        {/* Rate limiting */}
        <div className="mb-12">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">Rate Limiting</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            In-memory sliding window rate limiter. Production limits from mukoko-weather:
          </p>
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium text-foreground">Endpoint</th>
                  <th className="pb-2 pr-4 font-medium text-foreground">Limit</th>
                  <th className="pb-2 font-medium text-foreground">Window</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["/api/py/chat", "20 req", "1 hour"],
                  ["/api/py/ai/followup", "30 req", "1 hour"],
                  ["/api/py/explore/search", "15 req", "1 hour"],
                  ["/api/py/history/analyze", "10 req", "1 hour"],
                  ["/api/py/locations/add", "5 req", "1 hour"],
                  ["/api/py/reports (submit)", "5 req", "1 hour"],
                ].map(([endpoint, limit, window]) => (
                  <tr key={endpoint as string} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs">{endpoint}</td>
                    <td className="py-2 pr-4">{limit}</td>
                    <td className="py-2">{window}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CodeBlock
            filename="rate limiting in API routes"
            code={`import { RateLimiter } from "@/lib/ai-safety"

// Create limiters per endpoint
const chatLimiter = new RateLimiter({ maxRequests: 20, windowMs: 3600_000 })
const searchLimiter = new RateLimiter({ maxRequests: 15, windowMs: 3600_000 })

// In API route handler
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const { allowed, remaining, resetMs } = chatLimiter.consume(ip)

  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(resetMs / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  // Process request...
}`} />
        </div>

        {/* Checklist */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            AI integration checklist
          </h3>
          <ul className="flex flex-col gap-3">
            {[
              "Validate all slugs with validateSlug() before database queries",
              "Cap message length to 2000 chars (validatePromptLength)",
              "Sanitize user input (sanitizeUserInput) — remove control characters",
              "Limit arrays to 20 items (validateArrayLength)",
              "Validate tags against allowlist (validateAllowlist)",
              "Check for prompt injection before sending to Claude (detectPromptInjection)",
              "Rate limit all AI endpoints (RateLimiter)",
              "Truncate chat history to 10 messages, 2000 chars each",
              "Use system prompt guardrails — never let user override the system prompt",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-tanzanite)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
