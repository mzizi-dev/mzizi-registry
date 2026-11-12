/**
 * DEVICE CODE FORMAT — the framework-free half of `device-code` (contracts/ui/device-code):
 * the user code's display and spoken forms, the countdown text, the status messages and the
 * class strings. The `.astro` and `.tsx` builds read everything from here; the Rust build
 * (`device-code.rs`) implements the same functions, and both suites run the cases in
 * `__tests__/fixtures/device-code.cases.json`.
 *
 * The device side of OAuth 2.0 Device Authorization (RFC 8628 §3.3): show the `user_code`,
 * the short `verification_uri`, a QR code of `verification_uri_complete`, and how long the
 * code lasts.
 */

/** Where the pairing stands. `expired` also follows from `pending` once `expiresAt` passes. */
export type DeviceCodeStatus = "pending" | "approved" | "expired" | "denied" | "error"

/** `phone` for a hand-held or windowed screen; `tv` for a screen read from across a room. */
export type DeviceCodeSize = "phone" | "tv"

/** A moment: an ISO 8601 / RFC 3339 string, Unix milliseconds, or a Date. */
export type DeviceCodeTime = string | number | Date

/** The control's words, and the root's accessible name. */
export const DEVICE_CODE_TEXT = {
  label: "Link this device",
  goTo: "On your phone, go to",
  enter: "and enter this code",
  spokenPrefix: "Code: ",
  expiresIn: "Expires in ",
  scan: "Or scan this with your phone's camera",
  refresh: "Get a new code",
} as const

const MESSAGES: Record<DeviceCodeStatus, string> = {
  pending: "Waiting for approval on your phone.",
  approved: "This device is linked.",
  expired: "This code has expired.",
  denied: "The request was declined.",
  error: "Something went wrong.",
}

/** Said once the code has a minute or less left. */
export const DEVICE_CODE_LAST_MINUTE = "Less than a minute left to enter the code."

/** Unix milliseconds for a moment, or NaN when a string does not parse. */
export function timeMs(t: DeviceCodeTime): number {
  if (t instanceof Date) return t.getTime()
  if (typeof t === "number") return t
  return Date.parse(t)
}

/** The code as people read it: upper case, ASCII letters and digits only, in groups of four (`KTQB-4RMX`). */
export function formatUserCode(code: string): string {
  const clean = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
  return (clean.match(/.{1,4}/g) ?? []).join("-")
}

/** The code for a screen reader: one character at a time, a pause between groups (`K T Q B, 4 R M X`). */
export function spokenUserCode(code: string): string {
  return formatUserCode(code)
    .split("-")
    .map((group) => [...group].join(" "))
    .join(", ")
}

/** The verification address without its scheme or a trailing slash: what a person types. */
export function displayUri(uri: string): string {
  return uri.replace(/^https?:\/\//i, "").replace(/\/$/, "")
}

/** Time left as `m:ss`, rounded up to the second; `0:00` once it has passed. */
export function formatRemaining(ms: number): string {
  const s = Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 1000)) : 0
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

/** The status the component shows: a `pending` code whose time has passed is `expired`. */
export function effectiveStatus(status: DeviceCodeStatus, remainingMs: number): DeviceCodeStatus {
  return status === "pending" && Number.isFinite(remainingMs) && remainingMs <= 0 ? "expired" : status
}

/** The live status message for a (shown) status and the time left. */
export function statusMessage(status: DeviceCodeStatus, remainingMs: number): string {
  if (status === "pending" && Number.isFinite(remainingMs) && remainingMs <= 60_000) return DEVICE_CODE_LAST_MINUTE
  return MESSAGES[status]
}

/** Classes, shared by every build (the Rust build carries the same strings). */
export const DEVICE_CODE_CLASSES = {
  root: "group/device-code flex w-full flex-col items-center rounded-[var(--radius-lg,14px)] border border-border bg-card text-center text-card-foreground",
  rootSize: {
    phone: "max-w-sm gap-6 p-6",
    tv: "gap-10 p-10",
  },
  pending: {
    phone: "flex w-full flex-col items-center gap-6",
    tv: "flex w-full flex-col items-center gap-10 md:flex-row md:justify-center md:gap-16",
  },
  steps: "flex flex-col items-center gap-2",
  step: {
    phone: "text-sm text-muted-foreground",
    tv: "text-2xl text-muted-foreground",
  },
  uri: {
    phone: "text-lg font-semibold break-all text-foreground",
    tv: "text-4xl font-semibold break-all text-foreground",
  },
  code: {
    phone:
      "my-2 rounded-[var(--radius-md,12px)] border-2 border-primary px-4 py-2 font-mono text-4xl font-bold tracking-widest whitespace-nowrap text-foreground tabular-nums",
    tv: "my-4 rounded-[var(--radius-md,12px)] border-4 border-primary px-8 py-4 font-mono text-7xl font-bold tracking-widest whitespace-nowrap text-foreground tabular-nums",
  },
  countdown: {
    phone: "text-sm text-muted-foreground",
    tv: "text-2xl text-muted-foreground",
  },
  timer: "font-mono font-semibold text-foreground tabular-nums",
  figure: "flex flex-col items-center gap-2",
  qr: {
    phone: "size-48 rounded-[var(--radius-md,12px)] bg-white text-black",
    tv: "size-80 rounded-[var(--radius-md,12px)] bg-white text-black",
  },
  caption: {
    phone: "text-xs text-muted-foreground",
    tv: "text-xl text-muted-foreground",
  },
  status: {
    phone:
      "flex items-center justify-center gap-2 text-base font-medium text-foreground group-data-[status=denied]/device-code:text-destructive group-data-[status=error]/device-code:text-destructive",
    tv: "flex items-center justify-center gap-3 text-3xl font-medium text-foreground group-data-[status=denied]/device-code:text-destructive group-data-[status=error]/device-code:text-destructive",
  },
  dot: {
    phone:
      "hidden size-2 shrink-0 rounded-full bg-primary motion-safe:animate-pulse group-data-[status=pending]/device-code:inline-block",
    tv: "hidden size-4 shrink-0 rounded-full bg-primary motion-safe:animate-pulse group-data-[status=pending]/device-code:inline-block",
  },
  ended: "flex justify-center",
  refresh: {
    phone:
      "inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-base font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:transition-colors pointer-coarse:h-14",
    tv: "inline-flex h-16 items-center justify-center rounded-full bg-primary px-10 text-2xl font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-8 focus-visible:ring-ring/50 motion-safe:transition-colors",
  },
} as const
