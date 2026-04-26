import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// Mock next/navigation so usePathname returns whatever we set per-test.
let currentPath = "/"
vi.mock("next/navigation", () => ({
  usePathname: () => currentPath,
}))

// Mock next/link to a plain anchor (avoids App Router context requirements).
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

import { Breadcrumbs } from "@/components/landing/breadcrumbs"

describe("<Breadcrumbs />", () => {
  beforeEach(() => {
    currentPath = "/"
  })

  it("returns null on the landing route ('/')", () => {
    currentPath = "/"
    const { container } = render(<Breadcrumbs />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders 'Home' + each segment for /architecture/fundi", () => {
    currentPath = "/architecture/fundi"
    render(<Breadcrumbs />)

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Architecture" })).toBeInTheDocument()
    // Last segment is rendered as a non-link span (aria-current="page")
    expect(screen.queryByRole("link", { name: "Fundi (L9)" })).toBeNull()
    expect(screen.getByText("Fundi (L9)")).toHaveAttribute("aria-current", "page")
  })

  it("maps known slugs through BREADCRUMB_LABELS (e.g. fundi → 'Fundi (L9)')", () => {
    currentPath = "/architecture/fundi"
    render(<Breadcrumbs />)
    expect(screen.getByText("Fundi (L9)")).toBeInTheDocument()
  })

  it("title-cases unknown slugs", () => {
    currentPath = "/something-else/another-thing"
    render(<Breadcrumbs />)
    expect(screen.getByRole("link", { name: "Something Else" })).toBeInTheDocument()
    expect(screen.getByText("Another Thing")).toHaveAttribute("aria-current", "page")
  })

  it("each link/span carries min-h-[48px] (touch-target floor per CLAUDE.md §8.2)", () => {
    currentPath = "/architecture/fundi"
    render(<Breadcrumbs />)

    expect(screen.getByRole("link", { name: "Home" })).toHaveClass("min-h-[48px]")
    expect(screen.getByRole("link", { name: "Architecture" })).toHaveClass("min-h-[48px]")
    expect(screen.getByText("Fundi (L9)")).toHaveClass("min-h-[48px]")
  })

  it("nav has aria-label='Breadcrumb' for SR navigation", () => {
    currentPath = "/architecture"
    render(<Breadcrumbs />)
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument()
  })

  it("does not use physical CSS like pl-* on links", () => {
    currentPath = "/architecture/fundi"
    render(<Breadcrumbs />)
    const home = screen.getByRole("link", { name: "Home" })
    // px-1 is two-sided horizontal — fine. Just ensure no physical pl/pr left/right.
    expect(home.className).not.toMatch(/\bpl-\d/)
    expect(home.className).not.toMatch(/\bpr-\d/)
  })
})
