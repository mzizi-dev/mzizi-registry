/**
 * device-code (React), qr-code and device-code-format: the QR encoder, the code, countdown and
 * status text, accessibility, and the live behaviour (ticking, lapsing, refresh). The contract
 * (`contracts/ui/device-code.contract.json`) holds the Astro, React and Rust builds to the same
 * states in `__tests__/contracts` and `__tests__/astro`; the cases here are shared with the Rust
 * build through `__tests__/fixtures/device-code.cases.json`, so the three builds draw the same
 * QR matrix and the same words.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import * as React from "react"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { DeviceCode, type DeviceCodeProps } from "@/components/registry/n2-primitives/device-code"
import {
  displayUri,
  effectiveStatus,
  formatRemaining,
  formatUserCode,
  spokenUserCode,
  statusMessage,
  timeMs,
  type DeviceCodeStatus,
} from "@/components/registry/n2-primitives/device-code-format"
import { qrMatrix, qrPath, qrViewBox, type QrEcc } from "@/components/registry/n2-primitives/qr-code"

const REGISTRY = path.resolve(__dirname, "../../components/registry/n2-primitives")
const fixture = JSON.parse(readFileSync(path.resolve(__dirname, "../fixtures/device-code.cases.json"), "utf8")) as {
  seed: string
  qr: { ecc: QrEcc; length: number; version: number | null; fnv1a64?: string }[]
  qrLiteral: { ecc: QrEcc; text: string; version: number; rows: string[] }[]
  userCode: { in: string; display: string; spoken: string }[]
  remaining: { ms: number; text: string }[]
  uri: { in: string; out: string }[]
  status: { status: DeviceCodeStatus; ms: number; shown: DeviceCodeStatus; message: string }[]
  time: { in: string; ms: number | null }[]
}

const textOf = (n: number) => fixture.seed.repeat(Math.ceil(n / fixture.seed.length) + 1).slice(0, n)
const bits = (d: boolean[]) => d.map((x) => (x ? "1" : "0")).join("")
function fnv1a64(s: string): string {
  let h = BigInt("0xcbf29ce484222325")
  const prime = BigInt("0x100000001b3")
  const mask = BigInt("0xffffffffffffffff")
  for (const c of s) {
    h ^= BigInt(c.charCodeAt(0))
    h = (h * prime) & mask
  }
  return h.toString(16).padStart(16, "0")
}

describe("qrMatrix: every version at every level, as the Rust build draws it", () => {
  it("covers versions 1 to 40 at L, M, Q and H", () => {
    for (const ecc of ["L", "M", "Q", "H"] as const) {
      const versions = fixture.qr.filter((c) => c.ecc === ecc && c.version !== null).map((c) => c.version)
      expect(versions).toEqual(Array.from({ length: 40 }, (_, i) => i + 1))
    }
  })

  it.each(fixture.qr.map((c) => [`${c.ecc} v${c.version ?? "-"} (${c.length} bytes)`, c] as const))("%s", (_n, c) => {
    const m = qrMatrix(textOf(c.length), c.ecc)
    if (c.version === null) {
      expect(m).toBeNull()
      return
    }
    expect(m?.version).toBe(c.version)
    expect(m?.size).toBe(c.version * 4 + 17)
    expect(fnv1a64(bits(m!.dark))).toBe(c.fnv1a64)
  })

  it.each(fixture.qrLiteral.map((c) => [JSON.stringify(c.text), c] as const))("whole matrix of %s", (_n, c) => {
    const m = qrMatrix(c.text, c.ecc)!
    expect(m.version).toBe(c.version)
    const rows = Array.from({ length: m.size }, (_, y) => bits(m.dark.slice(y * m.size, (y + 1) * m.size)))
    expect(rows).toEqual(c.rows)
  })

  it("draws the three finder patterns and the timing lines", () => {
    const m = qrMatrix("https://mukoko.com/link?code=KTQB4RMX")!
    const at = (x: number, y: number) => m.dark[y * m.size + x]
    for (const [ox, oy] of [
      [0, 0],
      [m.size - 7, 0],
      [0, m.size - 7],
    ]) {
      for (let i = 0; i < 7; i++) {
        expect(at(ox! + i, oy!)).toBe(true)
        expect(at(ox!, oy! + i)).toBe(true)
      }
      expect(at(ox! + 1, oy! + 1)).toBe(false)
      expect(at(ox! + 3, oy! + 3)).toBe(true)
    }
    for (let i = 8; i < m.size - 8; i++) expect(at(i, 6)).toBe(i % 2 === 0)
  })

  it("writes one subpath per run of dark modules, offset by the quiet zone", () => {
    const m = { size: 3, version: 1, ecc: "M" as const, mask: 0, dark: [true, true, false, false, false, false, false, true, true] }
    expect(qrPath(m, 4)).toBe("M4 4h2v1h-2zM5 6h2v1h-2z")
    expect(qrViewBox(21)).toBe("0 0 29 29")
  })
})

describe("device-code-format: the cases the Rust build also runs", () => {
  it.each(fixture.userCode.map((c) => [JSON.stringify(c.in), c] as const))("user code %s", (_n, c) => {
    expect(formatUserCode(c.in)).toBe(c.display)
    expect(spokenUserCode(c.in)).toBe(c.spoken)
  })

  it.each(fixture.remaining.map((c) => [c.ms, c] as const))("%i ms left", (_n, c) => {
    expect(formatRemaining(c.ms)).toBe(c.text)
  })

  it.each(fixture.uri.map((c) => [c.in, c] as const))("address %s", (_n, c) => {
    expect(displayUri(c.in)).toBe(c.out)
  })

  it.each(fixture.status.map((c) => [`${c.status} at ${c.ms} ms`, c] as const))("%s", (_n, c) => {
    const shown = effectiveStatus(c.status, c.ms)
    expect(shown).toBe(c.shown)
    expect(statusMessage(shown, c.ms)).toBe(c.message)
  })

  it.each(fixture.time.filter((c) => c.ms !== null).map((c) => [c.in, c] as const))("time %s", (_n, c) => {
    expect(timeMs(c.in)).toBe(c.ms)
  })
})

const BASE: DeviceCodeProps = {
  userCode: "ktqb4rmx",
  verificationUri: "https://mukoko.com/link",
  verificationUriComplete: "https://mukoko.com/link?code=KTQB4RMX",
  expiresAt: "2026-10-07T12:10:00Z",
  now: "2026-10-07T12:00:18Z",
}
const markup = (props: Partial<DeviceCodeProps> = {}) =>
  new DOMParser().parseFromString(renderToStaticMarkup(<DeviceCode {...BASE} {...props} />), "text/html").body

describe("accessibility", () => {
  const STATUSES: DeviceCodeStatus[] = ["pending", "approved", "expired", "denied", "error"]

  it.each(STATUSES)("%s: a named group with one polite status line", (status) => {
    for (const size of ["phone", "tv"] as const) {
      const host = markup({ status, size })
      const root = host.querySelector('[data-slot="device-code"]')!
      expect(root.getAttribute("role")).toBe("group")
      expect(root.getAttribute("aria-label")).toBe("Link this device")
      const live = host.querySelectorAll('[role="status"]')
      expect(live).toHaveLength(1)
      expect(live[0]!.textContent?.trim()).not.toBe("")
      expect(host.querySelectorAll("[aria-live]")).toHaveLength(0) // role=status carries it
      expect(host.querySelectorAll("[tabindex]")).toHaveLength(0)
      // Every decorative element is hidden; every animation waits for motion consent.
      for (const el of host.querySelectorAll("[class]")) {
        for (const c of el.getAttribute("class")!.split(/\s+/)) {
          if (/(^|:)animate-/.test(c)) expect(c.startsWith("motion-safe:")).toBe(true)
        }
      }
    }
  })

  it("reads the code one character at a time and hides the visual code", () => {
    const host = markup()
    expect(host.querySelector('[data-slot="device-code-user-code"]')?.getAttribute("aria-hidden")).toBe("true")
    expect(host.querySelector('[data-slot="device-code-spoken"]')?.textContent).toBe("Code: K T Q B, 4 R M X")
    expect(host.querySelector('[data-slot="device-code-spoken"]')?.className).toBe("sr-only")
  })

  it("names the QR code with the full address and keeps the timer out of the live region", () => {
    const host = markup()
    const svg = host.querySelector("svg")!
    expect(svg.getAttribute("role")).toBe("img")
    expect(svg.getAttribute("aria-label")).toBe("QR code for https://mukoko.com/link?code=KTQB4RMX")
    const timer = host.querySelector('[role="timer"]')!
    expect(timer.closest('[role="status"]')).toBeNull()
  })

  it.each(["expired", "denied", "error"] as const)("%s: the refresh control has a name, a focus ring and a 48px floor", (status) => {
    const host = markup({ status })
    const control = host.querySelector("[data-device-code-refresh]")!
    expect(control.textContent).toBe("Get a new code")
    expect(control.className).toMatch(/focus-visible:ring-/)
    expect(control.className).toMatch(/\bh-12\b/)
    expect(control.className).toMatch(/pointer-coarse:h-14/)
    expect(markup({ status, size: "tv" }).querySelector("[data-device-code-refresh]")!.className).toMatch(/\bh-16\b/)
  })

  it("colours a declined or failed pairing with the destructive token, not a mineral", () => {
    const status = markup({ status: "denied" }).querySelector('[role="status"]')!.className
    expect(status).toContain("group-data-[status=denied]/device-code:text-destructive")
  })
})

describe("the three builds", () => {
  const read = (f: string) => readFileSync(path.join(REGISTRY, f), "utf8")

  it("draw the QR code on the device, with no network request and no image", () => {
    for (const f of ["device-code.astro", "device-code.tsx", "device-code.rs", "qr-code.ts", "device-code-format.ts"]) {
      const src = read(f)
      expect(src, f).not.toMatch(/\bfetch\(|XMLHttpRequest|<img\b|\bimg \{|api\.qrserver|chart\.googleapis|quickchart/i)
    }
  })

  it("share the user code formatting rule", () => {
    expect(read("device-code.rs")).toContain("is_ascii_alphanumeric")
    expect(read("device-code-format.ts")).toContain("/[^A-Za-z0-9]/g")
  })
})

const mounted: Root[] = []
function mount(ui: React.ReactElement) {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted.push(root)
  act(() => root.render(ui))
  return container
}

afterEach(() => {
  for (const root of mounted.splice(0)) act(() => root.unmount())
  document.body.innerHTML = ""
  vi.useRealTimers()
})

describe("DeviceCode (live)", () => {
  it("ticks from the device clock, announces the last minute, then lapses to expired", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-10-07T12:08:30Z"))
    const onRefresh = vi.fn()
    const host = mount(<DeviceCode {...BASE} now={undefined} onRefresh={onRefresh} />)
    const timer = () => host.querySelector('[role="timer"]')?.textContent
    const message = () => host.querySelector('[data-slot="device-code-message"]')?.textContent
    expect(timer()).toBe("1:30")
    expect(message()).toBe("Waiting for approval on your phone.")
    act(() => vi.advanceTimersByTime(31_000))
    expect(timer()).toBe("0:59")
    expect(message()).toBe("Less than a minute left to enter the code.")
    act(() => vi.advanceTimersByTime(59_000))
    expect(host.querySelector('[data-slot="device-code"]')?.getAttribute("data-status")).toBe("expired")
    expect(host.querySelector("svg")).toBeNull()
    expect(message()).toBe("This code has expired.")
    const button = host.querySelector<HTMLButtonElement>("button[data-device-code-refresh]")!
    expect(button.closest("[hidden]")).toBeNull()
    act(() => button.click())
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it("stops ticking once approved", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-10-07T12:00:18Z"))
    const host = mount(<DeviceCode {...BASE} now={undefined} status="approved" />)
    expect(vi.getTimerCount()).toBe(0)
    expect(host.querySelector('[data-slot="device-code-message"]')?.textContent).toBe("This device is linked.")
  })
})
