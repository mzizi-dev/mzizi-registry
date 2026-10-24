/**
 * filter-bar (#543): every chip is a real <button type="button"> with aria-pressed, so the bar
 * works from the keyboard (tab order, Enter and Space are a button's own) and announces state.
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, expect, it, vi } from "vitest"

import { FilterBar } from "@/components/registry/n2-primitives/filter-bar"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const options = [
  { label: "Food", value: "food", count: 12 },
  { label: "Transport", value: "transport" },
]

function mount(el: React.ReactElement) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(el))
  return { host, unmount: () => act(() => root.unmount()) }
}

const chip = (host: HTMLElement, value: string) =>
  host.querySelector<HTMLButtonElement>(`button[data-filter-value="${value}"]`)!

describe("FilterBar", () => {
  it("renders a named group of real buttons, none of them spans", () => {
    const { host, unmount } = mount(<FilterBar options={options} />)
    const group = host.querySelector('[data-slot="filter-bar"]')
    expect(group?.getAttribute("role")).toBe("group")
    expect(group?.getAttribute("aria-label")).toBe("Filters")
    const buttons = host.querySelectorAll<HTMLButtonElement>('button[type="button"][aria-pressed]')
    expect(buttons).toHaveLength(3)
    for (const b of buttons) expect(b.tabIndex).toBe(0)
    expect(host.querySelector('span[data-slot="badge"]')).toBeNull()
    unmount()
  })

  it("All is pressed when nothing is selected; toggling a chip flips aria-pressed", () => {
    const onChange = vi.fn()
    const { host, unmount } = mount(<FilterBar options={options} onSelectionChange={onChange} />)
    expect(chip(host, "").getAttribute("aria-pressed")).toBe("true")
    expect(chip(host, "food").getAttribute("aria-pressed")).toBe("false")
    act(() => chip(host, "food").click())
    expect(onChange).toHaveBeenLastCalledWith(["food"])
    expect(chip(host, "food").getAttribute("aria-pressed")).toBe("true")
    expect(chip(host, "").getAttribute("aria-pressed")).toBe("false")
    act(() => chip(host, "transport").click())
    expect(onChange).toHaveBeenLastCalledWith(["food", "transport"])
    unmount()
  })

  it("single-select presses one chip at a time; Clear resets; label names the group", () => {
    const { host, unmount } = mount(<FilterBar options={options} multiple={false} label="Place type" />)
    expect(host.querySelector('[data-slot="filter-bar"]')?.getAttribute("aria-label")).toBe("Place type")
    act(() => chip(host, "food").click())
    act(() => chip(host, "transport").click())
    expect(chip(host, "food").getAttribute("aria-pressed")).toBe("false")
    expect(chip(host, "transport").getAttribute("aria-pressed")).toBe("true")
    const clear = [...host.querySelectorAll("button")].find((b) => b.textContent?.includes("Clear"))!
    act(() => clear.click())
    expect(chip(host, "").getAttribute("aria-pressed")).toBe("true")
    unmount()
  })
})
