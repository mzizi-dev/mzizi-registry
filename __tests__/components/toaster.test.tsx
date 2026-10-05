import * as React from "react"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Toaster, toast } from "@/components/registry/n2-primitives/toaster"

const mounted: Root[] = []

/** Mount into jsdom with React's own act — no extra test dependency. */
function render(ui: React.ReactElement) {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted.push(root)
  act(() => root.render(ui))
  return { container }
}

afterEach(() => {
  for (const root of mounted.splice(0)) act(() => root.unmount())
  document.body.innerHTML = ""
  vi.useRealTimers()
})

describe("Toaster", () => {
  it("shows a toast as text in the live region, then removes it after the duration", () => {
    vi.useFakeTimers()
    const { container } = render(<Toaster duration={3000} />)
    act(() => toast("<b>Saved</b>"))
    const el = container.querySelector('[data-slot="toast"]')!
    expect(el.textContent).toBe("<b>Saved</b>")
    expect(el.querySelector("b")).toBeNull()
    expect(el.className).toContain("border-border")
    act(() => vi.advanceTimersByTime(2999))
    expect(container.querySelector('[data-slot="toast"]')).not.toBeNull()
    act(() => vi.advanceTimersByTime(1))
    expect(container.querySelector('[data-slot="toast"]')).toBeNull()
  })

  it("marks an error with the destructive border, and sets window.toast once mounted", () => {
    const { container } = render(<Toaster />)
    expect(window.toast).toBe(toast)
    act(() => window.toast?.("Failed", "error"))
    expect(container.querySelector('[data-slot="toast"]')!.className).toContain("border-destructive")
  })

  it("does nothing with no Toaster on the page", () => {
    expect(() => toast("Nobody hears this")).not.toThrow()
  })
})
