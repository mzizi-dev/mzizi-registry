import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Toc } from "@/components/landing/toc"

// jsdom doesn't ship IntersectionObserver — stub it so the component can mount
// without throwing. The stub is callable but never fires; tests that don't
// rely on scroll-spy still pass.
class IO {
  observe() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
  unobserve() {}
  root = null
  rootMargin = ""
  thresholds = [0]
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", IO)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ""
})

describe("<Toc />", () => {
  it("returns null when no h2/h3 headings exist", () => {
    const { container } = render(<Toc />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders one anchor per h2/h3 with stable id when an article is mounted", async () => {
    document.body.innerHTML = `
      <article data-mdx>
        <h2 id="intro">Intro</h2>
        <h3 id="setup">Setup</h3>
        <h2 id="usage">Usage</h2>
      </article>
    `
    render(<Toc />)
    // useEffect runs after mount — give jsdom a tick
    await new Promise((r) => setTimeout(r, 0))

    expect(screen.getByRole("link", { name: "Intro" })).toHaveAttribute("href", "#intro")
    expect(screen.getByRole("link", { name: "Setup" })).toHaveAttribute("href", "#setup")
    expect(screen.getByRole("link", { name: "Usage" })).toHaveAttribute("href", "#usage")
  })

  it("nav exposes the 'On this page' label for SR users", async () => {
    document.body.innerHTML = `<article data-mdx><h2 id="x">X</h2></article>`
    render(<Toc />)
    await new Promise((r) => setTimeout(r, 0))

    expect(screen.getByRole("navigation", { name: "On this page" })).toBeInTheDocument()
  })

  it("indents h3 entries deeper than h2 (logical CSS: ps-3 vs ps-6)", async () => {
    document.body.innerHTML = `
      <article data-mdx>
        <h2 id="a">A</h2>
        <h3 id="b">B</h3>
      </article>
    `
    render(<Toc />)
    await new Promise((r) => setTimeout(r, 0))

    expect(screen.getByRole("link", { name: "A" })).toHaveClass("ps-3")
    expect(screen.getByRole("link", { name: "B" })).toHaveClass("ps-6")
  })

  it("uses logical CSS (no pl-* physical padding)", async () => {
    document.body.innerHTML = `<article data-mdx><h2 id="x">X</h2></article>`
    render(<Toc />)
    await new Promise((r) => setTimeout(r, 0))

    const link = screen.getByRole("link", { name: "X" })
    expect(link.className).not.toMatch(/\bpl-\d/)
    expect(link.className).not.toMatch(/\bborder-l\b/)
  })
})
