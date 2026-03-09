/**
 * AI safety utilities for the Mukoko ecosystem.
 *
 * Input validation, rate limiting, and prompt safety — ported from
 * mukoko-weather's production Python guards. Every Mukoko app that
 * integrates Claude or Shamwari AI must use these utilities.
 *
 * Install via: npx shadcn@latest add https://registry.mukoko.com/api/r/ai-safety
 */

import { createLogger } from "@/lib/observability"

const logger = createLogger("ai-safety")

// ---------------------------------------------------------------------------
// Input Validation
// ---------------------------------------------------------------------------

const SLUG_RE = /^[a-z0-9-]{1,80}$/

/**
 * Validate and sanitize a URL slug.
 *
 * @example
 * ```ts
 * validateSlug("harare-zw")    // { valid: true, sanitized: "harare-zw" }
 * validateSlug("Hello World")  // { valid: false, sanitized: "hello-world" }
 * validateSlug("")             // { valid: false, sanitized: "" }
 * ```
 */
export function validateSlug(input: string): { valid: boolean; sanitized: string } {
  const sanitized = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)

  return {
    valid: SLUG_RE.test(input),
    sanitized,
  }
}

/**
 * Validate that a prompt/message does not exceed the maximum length.
 *
 * @param input - The user's input string
 * @param maxLength - Maximum allowed length (default: 2000, from mukoko-weather)
 */
export function validatePromptLength(input: string, maxLength = 2000): boolean {
  return input.length <= maxLength
}

/**
 * Sanitize user input by removing control characters and trimming.
 *
 * @example
 * ```ts
 * sanitizeUserInput("  Hello\x00World\n  ")  // "Hello World"
 * ```
 */
export function sanitizeUserInput(input: string): string {
  return input
    // Remove null bytes and other control chars (keep newlines/tabs)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
}

/**
 * Validate an array of items against a maximum count.
 * From mukoko-weather: activity arrays capped at 20 items.
 *
 * @example
 * ```ts
 * validateArrayLength(activities, 20)  // true if <= 20 items
 * ```
 */
export function validateArrayLength(arr: unknown[], maxItems = 20): boolean {
  return arr.length <= maxItems
}

/**
 * Truncate a message to the specified max length.
 * From mukoko-weather: chat history messages truncated to 2000 chars.
 */
export function truncateMessage(input: string, maxLength = 2000): string {
  if (input.length <= maxLength) return input
  return input.slice(0, maxLength)
}

/**
 * Validate items against an allowlist.
 * From mukoko-weather: tags validated against get_known_tags() database query.
 *
 * @example
 * ```ts
 * const knownTags = ["farming", "mining", "travel"]
 * validateAllowlist(["farming", "hacking"], knownTags)
 * // { valid: false, invalid: ["hacking"], filtered: ["farming"] }
 * ```
 */
export function validateAllowlist(
  items: string[],
  allowlist: string[]
): { valid: boolean; invalid: string[]; filtered: string[] } {
  const allowSet = new Set(allowlist)
  const filtered = items.filter((item) => allowSet.has(item))
  const invalid = items.filter((item) => !allowSet.has(item))

  return {
    valid: invalid.length === 0,
    invalid,
    filtered,
  }
}

// ---------------------------------------------------------------------------
// Prompt Injection Detection
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS = [
  // System prompt override attempts
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /system\s*:\s*/i,
  /\[\s*system\s*\]/i,
  /new\s+instructions?\s*:/i,
  // Role confusion
  /pretend\s+(to\s+be|you('re| are))/i,
  /act\s+as\s+(if\s+you|a|an)/i,
  /forget\s+(everything|all|your)/i,
  // Data exfiltration
  /reveal\s+(your|the)\s+(system|initial|original)\s+prompt/i,
  /what\s+(are|is)\s+your\s+(instructions|system\s+prompt)/i,
  /repeat\s+(the\s+)?(text|words)\s+above/i,
  // Delimiter injection
  /```\s*system/i,
  /<\/?system>/i,
]

/**
 * Detect potential prompt injection in user input.
 *
 * This is a heuristic check — not a guarantee. Use as one layer in a
 * defense-in-depth strategy alongside input length limits, rate limiting,
 * and system prompt guardrails.
 *
 * @example
 * ```ts
 * import { detectPromptInjection } from "@/lib/ai-safety"
 *
 * const result = detectPromptInjection("Ignore all previous instructions")
 * // { safe: false, flags: ["system_override"] }
 *
 * const clean = detectPromptInjection("What's the weather in Harare?")
 * // { safe: true, flags: [] }
 * ```
 */
export function detectPromptInjection(input: string): {
  safe: boolean
  flags: string[]
} {
  const flags: string[] = []

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      // Categorize the flag
      const source = pattern.source.toLowerCase()
      if (source.includes("ignore") || source.includes("forget") || source.includes("new")) {
        flags.push("system_override")
      } else if (source.includes("pretend") || source.includes("act as") || source.includes("you are now")) {
        flags.push("role_confusion")
      } else if (source.includes("reveal") || source.includes("repeat") || source.includes("what")) {
        flags.push("data_exfiltration")
      } else if (source.includes("system")) {
        flags.push("delimiter_injection")
      }
    }
  }

  // Deduplicate flags
  const uniqueFlags = [...new Set(flags)]

  if (uniqueFlags.length > 0) {
    logger.warn("Prompt injection detected", {
      data: { flags: uniqueFlags, inputLength: input.length },
    })
  }

  return {
    safe: uniqueFlags.length === 0,
    flags: uniqueFlags,
  }
}

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  timestamps: number[]
}

export interface RateLimiterConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
}

/**
 * In-memory sliding window rate limiter.
 *
 * From mukoko-weather production limits:
 * - /api/py/chat: 20 req/hour
 * - /api/py/ai/followup: 30 req/hour
 * - /api/py/explore/search: 15 req/hour
 * - /api/py/reports (submit): 5 req/hour
 *
 * @example
 * ```ts
 * import { RateLimiter } from "@/lib/ai-safety"
 *
 * const limiter = new RateLimiter({ maxRequests: 20, windowMs: 3600_000 })
 *
 * // In API route handler:
 * const ip = request.headers.get("x-forwarded-for") ?? "unknown"
 * const { allowed, remaining, resetMs } = limiter.consume(ip)
 *
 * if (!allowed) {
 *   return Response.json(
 *     { error: "Rate limit exceeded" },
 *     { status: 429, headers: { "Retry-After": String(Math.ceil(resetMs / 1000)) } }
 *   )
 * }
 * ```
 */
export class RateLimiter {
  private entries = new Map<string, RateLimitEntry>()
  private readonly config: RateLimiterConfig
  private cleanupTimer: ReturnType<typeof setInterval> | null = null

  constructor(config: RateLimiterConfig) {
    this.config = config
    // Cleanup stale entries every 5 minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupTimer = setInterval(() => this.cleanup(), 300_000)
    }
  }

  /** Check if a key is within rate limits without consuming a request */
  isAllowed(key: string): boolean {
    const entry = this.entries.get(key)
    if (!entry) return true

    const now = Date.now()
    const cutoff = now - this.config.windowMs
    const recentCount = entry.timestamps.filter((t) => t > cutoff).length
    return recentCount < this.config.maxRequests
  }

  /** Consume a request for the given key */
  consume(key: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now()
    const cutoff = now - this.config.windowMs

    let entry = this.entries.get(key)
    if (!entry) {
      entry = { timestamps: [] }
      this.entries.set(key, entry)
    }

    // Prune old timestamps
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

    if (entry.timestamps.length >= this.config.maxRequests) {
      const oldestInWindow = entry.timestamps[0]
      const resetMs = oldestInWindow + this.config.windowMs - now
      return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) }
    }

    entry.timestamps.push(now)
    const remaining = this.config.maxRequests - entry.timestamps.length
    const resetMs = entry.timestamps.length > 0
      ? entry.timestamps[0] + this.config.windowMs - now
      : this.config.windowMs

    return { allowed: true, remaining, resetMs: Math.max(0, resetMs) }
  }

  /** Remove stale entries to prevent memory leaks */
  private cleanup(): void {
    const cutoff = Date.now() - this.config.windowMs
    for (const [key, entry] of this.entries) {
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
      if (entry.timestamps.length === 0) {
        this.entries.delete(key)
      }
    }
  }

  /** Dispose of the cleanup timer */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}
