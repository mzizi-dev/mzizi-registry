import { describe, expect, it, vi } from "vitest"
import * as React from "react"
import { act } from "react"
import { createRoot } from "react-dom/client"

import {
  SafeAreaFrame,
  safeAreaBands,
} from "@/components/registry/n2-primitives/safe-area-frame"
import { PreviewCanvas, zoomStyle } from "@/components/registry/n2-primitives/preview-canvas"
import { PresetPicker } from "@/components/registry/n2-primitives/preset-picker"
import { MziziEmailPreview } from "@/components/registry/n3-brand/mzizi-email-preview"

/** Mount into jsdom with React's own act — no extra test dependency. */
function render(ui: React.ReactElement) {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(ui))
  return { container, rerender: (next: React.ReactElement) => act(() => root.render(next)) }
}
const byText = (c: HTMLElement, text: string) =>
  [...c.querySelectorAll("*")].find((e) => e.children.length === 0 && e.textContent === text) ??
  null
const byButton = (c: HTMLElement, name: RegExp) =>
  [...c.querySelectorAll("button")].find((b) => name.test(b.textContent ?? "")) as HTMLButtonElement
const byLabel = (c: HTMLElement, label: string) =>
  c.querySelector(`[aria-label="${label}"]`) as HTMLInputElement
const click = (el: HTMLElement) => act(() => el.click())

describe("SafeAreaFrame", () => {
  it("fits a story into the box at its aspect ratio, with Meta's bands", () => {
    // Same numbers the Rust sibling's contract test asserts.
    expect(safeAreaBands(1080, 1920, [250, 64, 340, 64], 56)).toEqual({
      width: 32,
      height: 56,
      top: 13.02,
      right: 5.93,
      bottom: 17.71,
      left: 5.93,
    })
    expect(safeAreaBands(32, 4, [0, 0, 0, 0], 56)).toMatchObject({ width: 56, height: 7 })
  })

  it("renders only the bands a preset has, decoratively", () => {
    const { container } = render(<SafeAreaFrame width={1280} height={720} safe={[0, 0, 72, 0]} />)
    const root = container.querySelector('[data-slot="safe-area-frame"]')!
    expect(root.getAttribute("aria-hidden")).toBe("true")
    expect(container.querySelectorAll("[data-band]")).toHaveLength(1)
    expect(container.querySelector('[data-band="bottom"]')).not.toBeNull()
  })
})

describe("PreviewCanvas", () => {
  it("shows the empty slot, then the image, and reports busy", () => {
    const { container, rerender } = render(<PreviewCanvas empty={<p>Nothing yet</p>} />)
    expect(byText(container, "Nothing yet")).not.toBeNull()
    rerender(<PreviewCanvas src="blob:x" alt="A story" busy />)
    expect(container.querySelector('img[alt="A story"]')).not.toBeNull()
    expect(container.querySelector('[data-slot="preview-canvas"]')!.getAttribute("aria-busy")).toBe(
      "true"
    )
    expect(byText(container, "Rendering…")).not.toBeNull()
  })

  it("fits within the stage, or scales from the natural width", () => {
    expect(zoomStyle("fit", 1080, "70vh")).toMatchObject({ maxWidth: "100%", maxHeight: "70vh" })
    expect(zoomStyle(0.5, 1080, "70vh")).toMatchObject({ width: 540, maxWidth: "none" })
  })
})

describe("PresetPicker", () => {
  const groups = [
    {
      id: "social",
      label: "Social",
      presets: [
        {
          id: "story",
          name: "Story 9:16",
          width: 1080,
          height: 1920,
          safe: [250, 64, 340, 64] as [number, number, number, number],
        },
        { id: "square", name: "Square 1:1", width: 1080, height: 1080 },
      ],
    },
  ]

  it("keeps active and included apart", () => {
    const onActive = vi.fn()
    const onIncluded = vi.fn()
    const { container } = render(
      <PresetPicker
        groups={groups}
        active="story"
        onActiveChange={onActive}
        included={["story"]}
        onIncludedChange={onIncluded}
      />
    )
    expect(byButton(container, /Story 9:16/).getAttribute("aria-pressed")).toBe("true")
    click(byButton(container, /Square 1:1/))
    expect(onActive).toHaveBeenCalledWith("square")
    click(byLabel(container, "Include Square 1:1 in the set"))
    expect(onIncluded).toHaveBeenCalledWith(["story", "square"])
    click(byLabel(container, "Include Story 9:16 in the set"))
    expect(onIncluded).toHaveBeenLastCalledWith([])
  })
})

describe("MziziEmailPreview", () => {
  it("shows a placeholder, then the HTML in a sandbox that cannot run it", () => {
    const { container, rerender } = render(<MziziEmailPreview />)
    expect(byText(container, "Your preview appears here")).not.toBeNull()
    rerender(<MziziEmailPreview html="<table><tr><td>Sample Person</td></tr></table>" />)
    const frame = container.querySelector("iframe")!
    expect(frame.getAttribute("sandbox")).toBe("")
    expect(frame.getAttribute("srcdoc")).toContain("Sample Person")
  })
})
