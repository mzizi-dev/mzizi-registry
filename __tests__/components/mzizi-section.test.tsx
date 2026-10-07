/**
 * MziziSection (the one section wrapper, with the props folded in from the old
 * mzizi-resilience copy) and MziziHealthPanel, both reporting to a HealthMonitor
 * (mzizi-registry#472).
 */
import * as React from "react"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { MziziHealthPanel, useHealthMonitor } from "@/components/registry/n5-resilience/mzizi-health-panel"
import { HealthMonitor } from "@/components/registry/n5-resilience/mzizi-resilience"
import { MziziSection } from "@/components/registry/n5-resilience/mzizi-section"

const mounted: Root[] = []

function render(ui: React.ReactElement) {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted.push(root)
  act(() => root.render(ui))
  return { container, rerender: (next: React.ReactElement) => act(() => root.render(next)) }
}

beforeEach(() => {
  // jsdom has no matchMedia; the harness reads prefers-reduced-motion through it.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
})

afterEach(() => {
  for (const root of mounted.splice(0)) act(() => root.unmount())
  document.body.innerHTML = ""
  vi.restoreAllMocks()
})

function Boom({ fail }: { fail: { current: boolean } }): React.ReactElement {
  if (fail.current) throw Object.assign(new Error("secret personal detail"), { code: "render-failed" })
  return <p>content</p>
}

describe("MziziSection", () => {
  test("reports loading, then healthy, from an effect (not during render)", () => {
    const monitor = new HealthMonitor()
    const { container, rerender } = render(
      <MziziSection name="news" loading monitor={monitor}>
        <p>content</p>
      </MziziSection>
    )
    expect(monitor.get("news")?.status).toBe("loading")
    expect(container.querySelector('[data-slot="mzizi-section"]')?.getAttribute("aria-busy")).toBe("true")
    rerender(
      <MziziSection name="news" monitor={monitor}>
        <p>content</p>
      </MziziSection>
    )
    expect(monitor.get("news")?.status).toBe("healthy")
    expect(container.textContent).toContain("content")
  })

  test("contains an error: code reported, message never shown or recorded; retry recovers", () => {
    const monitor = new HealthMonitor()
    const onError = vi.fn()
    const onRecovery = vi.fn()
    const fail = { current: true }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { container } = render(
      <MziziSection name="weather" monitor={monitor} onError={onError} onRecovery={onRecovery}>
        <Boom fail={fail} />
      </MziziSection>
    )
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.getAttribute("data-error-code")).toBe("render-failed")
    expect(container.textContent).not.toContain("secret")
    expect(monitor.get("weather")).toMatchObject({ status: "error", errorCount: 1, lastErrorCode: "render-failed" })
    expect(JSON.stringify(monitor.get("weather"))).not.toContain("secret")
    // React itself reports the caught error in development; the section's own log carries the code only.
    const own = spy.mock.calls.filter((c) => String(c[0]).startsWith("[mzizi:weather]"))
    expect(own.length).toBeGreaterThan(0)
    for (const call of own) expect(JSON.stringify(call)).not.toContain("secret")
    expect(onError).toHaveBeenCalledTimes(1)

    fail.current = false
    act(() => (container.querySelector("button") as HTMLButtonElement).click())
    expect(onRecovery).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain("content")
    expect(monitor.get("weather")?.status).toBe("healthy")
  })

  test("a custom fallback replaces the error card", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { container } = render(
      <MziziSection name="s" monitor={new HealthMonitor()} fallback={<p>cached view</p>}>
        <Boom fail={{ current: true }} />
      </MziziSection>
    )
    expect(container.textContent).toBe("cached view")
  })

  test("a critical section rethrows to the boundary above", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    class Outer extends React.Component<{ children: React.ReactNode }, { caught: boolean }> {
      state = { caught: false }
      static getDerivedStateFromError() {
        return { caught: true }
      }
      render() {
        return this.state.caught ? <p>outer caught it</p> : this.props.children
      }
    }
    const monitor = new HealthMonitor()
    const { container } = render(
      <Outer>
        <MziziSection name="s" critical monitor={monitor}>
          <Boom fail={{ current: true }} />
        </MziziSection>
      </Outer>
    )
    expect(container.textContent).toBe("outer caught it")
  })
})

describe("MziziHealthPanel", () => {
  test("lists every report and the worst status, and follows updates", () => {
    const monitor = new HealthMonitor()
    monitor.report("feed", { status: "healthy", source: "primary" })
    const { container } = render(<MziziHealthPanel monitor={monitor} />)
    const panel = container.querySelector('[data-slot="mzizi-health-panel"]') as HTMLElement
    expect(panel.getAttribute("aria-label")).toBe("System health")
    expect(panel.getAttribute("data-status")).toBe("healthy")
    act(() => {
      monitor.report("forecast", { status: "degraded", source: "cache", circuitState: "open", errorCount: 2, lastErrorCode: "timeout" })
    })
    expect(panel.getAttribute("data-status")).toBe("degraded")
    expect(panel.querySelectorAll('[data-slot="mzizi-health-row"]')).toHaveLength(2)
    expect(panel.textContent).toContain("forecast")
    expect(panel.textContent).toContain("cache")
    expect(panel.textContent).toContain("circuit open")
    expect(panel.querySelector('[title="timeout"]')?.textContent).toBe("2 errors")
  })

  test("empty: no sections reporting", () => {
    const { container } = render(<MziziHealthPanel monitor={new HealthMonitor()} />)
    expect(container.textContent).toContain("No sections reporting")
  })

  test("useHealthMonitor exposes the reports and getSection", () => {
    const monitor = new HealthMonitor()
    monitor.report("a", { status: "error" })
    let seen: ReturnType<typeof useHealthMonitor> | undefined
    function Probe() {
      seen = useHealthMonitor(monitor)
      return null
    }
    render(<Probe />)
    expect(seen?.systemHealth).toBe("error")
    expect(seen?.getSection("a")?.status).toBe("error")
  })
})
